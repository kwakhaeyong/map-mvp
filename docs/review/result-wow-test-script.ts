// RESULT WOW 실제 출력 검증용 1회성 스크립트 (2026-08).
//
// 목적: taste-generator.ts의 SYSTEM_PROMPT를 고치기 전에, 성격이 뚜렷이
// 다른 가상 사용자 3명(A/B/C)의 실제 생성 결과를 확인한다. 이 파일은
// production 코드가 아니다 — 앱 어디에서도 import되지 않고, 빌드에도
// 포함되지 않는다. 검증이 끝나면 지워도 무방하다.
//
// 세션은 임의 프롬프트 문자열을 직접 만드는 게 아니라, 실제 화면
// 컴포넌트(QuickTapStep/BinaryStep/AxisStep/ReflectionStep)가 만드는 것과
// 정확히 같은 모양으로 engine/quiz-answer.ts의 applyQuizAnswer를 그대로
// 호출해서 만든다 — topics.ts의 실제 axis.options에서 label로 찾은
// option만 쓰므로, 오타가 있으면 "label not found"로 즉시 실패한다.
//
// 실행 방법 (저장소 루트에서):
//   ANTHROPIC_API_KEY=sk-ant-... npx tsx docs/review/result-wow-test-script.ts
//
// 키를 이 파일이나 다른 어떤 파일에도 저장하지 않는다 — 환경변수로만
// 넘긴다. 커밋에도 절대 포함하지 않는다.
//
// 결과는 docs/review/result-wow-taste-{a,b,c}.md에 그대로(재작성 없이)
// 저장된다. 실패하면(파싱 오류 등) 해당 페르소나만 실패 사유를 적고
// 계속 진행한다 — 3명 중 하나가 실패해도 나머지는 계속 시도한다.

import * as fs from "fs";
import * as path from "path";
import { createSession } from "../../src/map-decision-v1/engine/session";
import { applyQuizAnswer } from "../../src/map-decision-v1/engine/quiz-answer";
import { resolveTopic, TopicOption } from "../../src/map-decision-v1/engine/topics";
import { generateTasteResult } from "../../src/map-decision-v1/engine/taste-generator";
import { MapSession } from "../../src/map-decision-v1/types";

// 단일 선택(quickTap/binary/scenario)은 label 문자열 하나, 다중 선택
// (preference/experience → Stack)은 "고른 순서대로" label 배열(최대 3개).
type PersonaAnswer = string | string[];

type PersonaSpec = {
  id: "A" | "B" | "C";
  theme: string;
  // reflectionTaste(Q17) 전용. 빈 문자열이면 "건너뛰기"를 그대로 재현한다
  // (ReflectionStep의 onSubmit("")과 동일).
  reflectionText: string;
  answers: Record<string, PersonaAnswer>;
};

// 세 페르소나의 실제 옵션 라벨은 전부 topics.ts의 taste.axes 원문에서
// 그대로 가져왔다 — 여기서 새로 만든 문구는 없다(reflectionText 자유
// 서술 제외, 이건 사용자 지시에 있던 예시 문장을 그대로 썼다).
const PERSONAS: PersonaSpec[] = [
  {
    id: "A",
    theme: "새로운 것을 좋아한다고 생각하지만 실제 최근 행동은 반복적",
    reflectionText:
      "요즘 옛날 시집을 다시 읽는데, 새 책보다 전에 놓쳤던 문장을 찾는 재미가 있었다.",
    answers: {
      tasteMode: "읽는 편",
      tasteRecent: ["SNS 보기", "책·글 읽기", "영상 보기"],
      tasteDepth: "여러 개를 얕게 즐기는 편",
      tasteDiscover: "우연히 마주치는 편",
      tasteMoney: "경험에",
      tasteMood: ["낯설고 실험적인", "밝고 경쾌한", "강렬하고 빠른"],
      tasteStory: "남기는 메시지",
      tasteSpace: "적당히 북적이는 곳",
      tasteFood: "새로운 걸 시도하는 편",
      tasteAesthetic: ["개성 강한", "자연스러운", "빈티지한"],
      lifestyle: ["각자 시간 존중", "여행 좋아하는", "취미 공유"],
      tasteShare: "물어보면 말하는 편",
      tastePopular: "오히려 거리를 둔 편",
      tasteRepeat: "시간이 지나 다시 찾는 편",
      tasteGuilty: "있지만 티는 안 낸다",
      tasteChange: "계속 바뀌는 편",
      tasteWhy: "계속 배우는 것",
      tasteIdeal: "오히려 다른 게 재밌다",
      tasteSelfView: "그런 편인 것 같다",
    },
  },
  {
    id: "B",
    theme: "익숙한 것을 깊게 파고 반복하는 몰입형",
    reflectionText:
      "작년 겨울 뜨개질에 빠져 두 달 동안 계속했는데, 손으로 뭔가가 남는 게 좋았다.",
    answers: {
      tasteMode: "듣는 편",
      tasteRecent: ["음악 듣기", "직접 하는 취미", "책·글 읽기"],
      tasteDepth: "끝까지 파는 편",
      tasteDiscover: "직접 찾아보는 편",
      tasteMoney: "물건에",
      tasteMood: ["따뜻하고 익숙한", "잔잔하고 차분한", "어둡고 깊은"],
      tasteStory: "분위기와 미장센",
      tasteSpace: "익숙한 내 자리",
      tasteFood: "늘 먹던 걸 시키는 편",
      tasteAesthetic: ["정갈한", "자연스러운", "미니멀한"],
      lifestyle: ["집순이·집돌이", "규칙적인 생활", "각자 시간 존중"],
      tasteShare: "혼자 간직하는 편",
      tastePopular: "오히려 거리를 둔 편",
      tasteRepeat: "여러 번 반복하는 편",
      tasteGuilty: "있다, 대놓고 즐긴다",
      tasteChange: "거의 그대로인 편",
      tasteWhy: "쉬는 방법",
      tasteIdeal: "제일 편하다",
      tasteSelfView: "그런 편인 것 같다",
    },
  },
  {
    id: "C",
    theme: "사람을 통해 취향을 발견하고 대중적인 것을 자연스럽게 받아들이는 편",
    reflectionText: "", // Q17 건너뜀 — ReflectionStep의 "건너뛰기"와 동일
    answers: {
      tasteMode: "보는 편",
      tasteRecent: ["영상 보기", "SNS 보기", "게임하기"],
      tasteDepth: "여러 개를 얕게 즐기는 편",
      tasteDiscover: "사람 추천",
      tasteMoney: "먹는 데",
      tasteMood: ["밝고 경쾌한", "따뜻하고 익숙한", "강렬하고 빠른"],
      tasteStory: "인물이 매력적인 것",
      tasteSpace: "적당히 북적이는 곳",
      tasteFood: "남이 추천한 걸 따르는 편",
      tasteAesthetic: ["화려한", "자연스러운", "정갈한"],
      lifestyle: ["취미 공유", "액티브·야외파", "여행 좋아하는"],
      tasteShare: "자주 추천하는 편",
      tastePopular: "나도 좋으면 같이 좋아한 편",
      tasteRepeat: "한 번이면 충분한 편",
      tasteGuilty: "딱히 없다",
      tasteChange: "조금씩 넓어진 편",
      tasteWhy: "사람과 이어지는 통로",
      tasteIdeal: "제일 편하다",
      tasteSelfView: "잘 모르겠다",
    },
  },
];

function findOption(options: TopicOption[], label: string): TopicOption {
  const found = options.find((option) => option.label === label);
  if (!found) throw new Error(`label not found: "${label}" (available: ${options.map((o) => o.label).join(", ")})`);
  return found;
}

// 실제 컴포넌트와 동일한 answerText/selectedTopLevelLabels 조합을 만든다.
// - 단일 선택(QuickTapStep/BinaryStep/ScenarioStep): `${label} — ${description}`,
//   selectedTopLevelLabels=[label] (컴포넌트 코드 그대로).
// - 다중 선택(AxisStep, "Stack"): `${i+1}순위: ${label} — ${description}`을
//   줄바꿈으로 이어붙이고, selectedTopLevelLabels=고른 순서의 label 배열
//   (AxisStep.submit()과 동일 — taste 문항엔 subOptions가 없어
//   resolveTopLevelLabel도 결국 label 그대로를 돌려준다).
function buildSession(persona: PersonaSpec): MapSession {
  const topic = resolveTopic("taste");
  const axes = topic.axes ?? [];
  const requiredAxes = axes.filter((axis) => axis.required);
  const optionalAxes = axes.filter((axis) => !axis.required);

  let session = createSession("taste");

  for (const axis of axes) {
    if (axis.type === "reflection") {
      session = applyQuizAnswer(session, axis.question, persona.reflectionText, axis.id, undefined, requiredAxes, optionalAxes);
      continue;
    }

    const raw = persona.answers[axis.id];
    if (raw === undefined) throw new Error(`persona ${persona.id}: no answer configured for axis "${axis.id}"`);

    if (Array.isArray(raw)) {
      const chosen = raw.map((label) => findOption(axis.options, label));
      const answerText = chosen.map((option, index) => `${index + 1}순위: ${option.label} — ${option.description}`).join("\n");
      const selectedTopLevelLabels = chosen.map((option) => option.label);
      session = applyQuizAnswer(session, axis.question, answerText, axis.id, selectedTopLevelLabels, requiredAxes, optionalAxes);
    } else {
      const option = findOption(axis.options, raw);
      const answerText = `${option.label} — ${option.description}`;
      session = applyQuizAnswer(session, axis.question, answerText, axis.id, [option.label], requiredAxes, optionalAxes);
    }
  }

  return session;
}

function formatInputSummary(persona: PersonaSpec): string {
  const lines = Object.entries(persona.answers).map(([axisId, answer]) => {
    const value = Array.isArray(answer) ? answer.map((label, i) => `${i + 1}순위 ${label}`).join(" / ") : answer;
    return `- ${axisId}: ${value}`;
  });
  return [
    `테마: ${persona.theme}`,
    "",
    "선택형 답변:",
    ...lines,
    "",
    `Q17(reflectionTaste) 자유 서술: ${persona.reflectionText ? `"${persona.reflectionText}"` : "(건너뜀)"}`,
  ].join("\n");
}

async function main() {
  const outDir = path.join(__dirname);
  const hasKey = Boolean(process.env.ANTHROPIC_API_KEY);
  if (!hasKey) {
    console.log("ANTHROPIC_API_KEY not set — building sessions only, stopping before any API call.\n");
  }

  for (const persona of PERSONAS) {
    console.log(`\n=== persona ${persona.id} ===`);
    const session = buildSession(persona);
    console.log(`session built OK — messages=${session.messages.length}, quizAnswers keys=${Object.keys(session.quizAnswers ?? {}).length}`);

    if (!hasKey) {
      console.log(`(dry run) would call generateTasteResult(session) for persona ${persona.id} here.`);
      continue;
    }

    const outcome = await generateTasteResult(session);
    const outPath = path.join(outDir, `result-wow-taste-${persona.id.toLowerCase()}.md`);
    const inputSummary = formatInputSummary(persona);

    const body = outcome.result
      ? [
          `# RESULT WOW 실제 출력 검증 — 사용자 ${persona.id}`,
          "",
          "## 테스트용 입력 요약",
          "",
          "```",
          inputSummary,
          "```",
          "",
          "## 실제 AI 생성 결과 (원문 그대로, JSON)",
          "",
          "```json",
          JSON.stringify(outcome.result, null, 2),
          "```",
          "",
        ].join("\n")
      : [
          `# RESULT WOW 실제 출력 검증 — 사용자 ${persona.id}`,
          "",
          "## 테스트용 입력 요약",
          "",
          "```",
          inputSummary,
          "```",
          "",
          `## 생성 실패`,
          "",
          `countsAsFailure=${outcome.countsAsFailure}. 콘솔 로그(스크립트 실행 터미널)를 참고하세요.`,
          "",
        ].join("\n");

    fs.writeFileSync(outPath, body, "utf-8");
    console.log(`wrote ${outPath}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
