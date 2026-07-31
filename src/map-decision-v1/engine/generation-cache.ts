import { createHash } from "crypto";
import { MapSession } from "../types";
import { getRedisClient } from "./redis-client";

// 결과 생성 멱등 캐시. 페이지가 완전히 새로 로드되면(iOS Safari가 백그라운드
// 탭을 메모리에서 내리는 경우 등) 진행 중이던 생성 상태(컴포넌트 로컬
// state — generationState/attempt)는 사라지고, 재마운트된 화면은
// session.idealTypeResult가 아직 없으니 처음부터 다시 generate()를
// 부른다(IdealTypeCard.tsx의 useEffect). 그때마다 reserveGenerationSlot이
// 소모되고 Anthropic이 다시 호출된다 — 답변은 그대로인데 결과만 다시
// 만드는 낭비다. 이 파일은 "같은 사람이 같은 답변으로 다시 요청했다"를
// 감지해서 이미 만든 결과를 재사용하게 한다.
//
// 클라이언트 쪽 재요청 동작(재마운트 시 무조건 generate() 호출)은 이번에
// 건드리지 않는다 — 서버가 그 재요청을 받아내는 쪽만 고친다.

const GENERATION_CACHE_TTL_SECONDS = 30 * 60; // 30분 — 아래 computeGenerationCacheKey 주석 참고

export type GenerationTopic = "idealType" | "selfIntro";

// 객체 키 순서에 관계없이 항상 같은 문자열이 나오게 하는 정규화 —
// session.quizAnswers는 JS 객체라 키 순서가 원칙적으로 보장되지 않는다.
// 같은 답변이라도 세션이 어떤 경로로 재구성됐는지에 따라 키 순서가
// 달라질 수 있으므로, 여기서 재귀적으로 키를 정렬해 항상 동일한 문자열을
// 만든다(배열은 순서가 의미 있으므로 정렬하지 않는다).
function stableStringify(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map((item) => stableStringify(item)).join(",")}]`;
  }
  if (value && typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
    return `{${entries.map(([key, val]) => `${JSON.stringify(key)}:${stableStringify(val)}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

// 캐시 키 = 실제로 결과를 결정하는 값(대화 전문 + 퀴즈 답변)의 해시.
// session.startedAt(밀리초 타임스탬프) 같은 값을 키로 쓰지 않는다 — 그런
// 값은 추측 가능해서, 남의 startedAt을 대충 맞춰 넣으면 그 사람의 결과를
// 가로챌 수 있다(reserveGenerationSlot이 세션 슬롯 키로 startedAt을 쓰는
// 것과 헷갈리지 말 것 — 그건 레이트리밋 용도라 추측당해도 카운터 오염
// 정도지 결과 유출이 아니다). 반면 34~40개 문항의 실제 답변 조합을
// 통째로 맞히는 건 사실상 불가능하다(축마다 선택지 4~6개, 다중 선택
// 축은 순서까지 있어 조합이 기하급수적으로 늘어난다) — 그 사람이 실제로
// 고른 답을 이미 알고 있는 게 아니라면 같은 해시를 만들 수 없다.
// topic을 해시에도, 캐시 키 접두어에도 넣어 이상형/나소개 결과가 서로
// 섞이지 않게 한다(요청대로 이중으로 넣었다 — 접두어만으로 실질적으로
// 충분하지만, 해시 자체도 주제별로 달라지게 해서 우연히 같은 로직으로
// 두 캐시 조회 함수를 섞어 써도 안전하게 한다).
export function computeGenerationCacheKey(topic: GenerationTopic, session: MapSession): string {
  const canonicalInput = stableStringify({
    topic,
    messages: (session.messages ?? []).map((message) => ({ role: message.role, text: message.text })),
    quizAnswers: session.quizAnswers ?? {},
  });
  const hash = createHash("sha256").update(canonicalInput).digest("hex");
  return `gen-cache:${topic}:${hash}`;
}

// Redis 연결이 없거나 명령이 실패하면 캐시를 조용히 건너뛰고 기존 경로
// (레이트리밋 → 생성)로 그대로 진행한다. 레이트리밋의 fail-closed와는
// 다른 성격이다 — 레이트리밋은 "확인 못 하면 막아야" 비용 방어가
// 성립하지만, 이 캐시는 순수 최적화라 "확인 못 하면 그냥 새로 만든다"가
// 안전한 기본값이다(기존 동작 그대로 유지되는 것과 같다).
export async function getCachedGeneration<T>(cacheKey: string): Promise<T | null> {
  const redis = getRedisClient();
  if (!redis) return null;
  try {
    // @upstash/redis는 저장된 값이 JSON으로 파싱 가능하면 자동으로 파싱해
    // 돌려주기도 해서, 문자열/객체 둘 다 들어올 수 있다(share-store.ts의
    // getShare와 같은 처리).
    const raw = await redis.get<T | string>(cacheKey);
    if (!raw) return null;
    return typeof raw === "string" ? (JSON.parse(raw) as T) : raw;
  } catch (error) {
    console.error("[generation-cache] read failed", error);
    return null;
  }
}

// 생성 성공 시에만 호출한다(실패는 캐시하지 않는다 — 호출부 책임).
// 대화 원문(session.messages)이 아니라 생성된 결과(result)만 저장한다.
//
// TTL 30분: 이 캐시의 목적은 "백그라운드 전환 → 페이지 리로드 → 재요청"을
// 몇 분 안에 받아내는 것뿐이다. 앱 자체 문구(GENERATION_ESTIMATE_TEXT)가
// "보통 1~2분"이라 하고, 재시도 버튼도 3분(RETRY_AFTER_MS)에 뜨는 걸 보면
// 정상 시나리오의 대기는 길어야 수 분이다. 실측 사례(여러 번 리셋되며
// 체감 5~10분)까지 여유 있게 덮으면서도, 개인 결과 데이터를 필요 이상
// 오래 두지 않도록 1시간보다 짧게(30분) 잡았다.
export async function setCachedGeneration(cacheKey: string, result: unknown): Promise<void> {
  const redis = getRedisClient();
  if (!redis) return;
  try {
    await redis.set(cacheKey, JSON.stringify(result), { ex: GENERATION_CACHE_TTL_SECONDS });
  } catch (error) {
    console.error("[generation-cache] write failed", error);
  }
}
