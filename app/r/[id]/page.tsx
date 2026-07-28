import type { Metadata } from "next";
import Link from "next/link";
import { Brand } from "../../../src/map-decision-v1/components/Landing";
import { IdealTypeResultBlocks, TagRow } from "../../../src/map-decision-v1/components/IdealTypeResultBlocks";
import { FinalResultSectionReadOnly } from "../../../src/map-decision-v1/components/FinalResultBlocks";
import { ShareCardImage } from "../../../src/map-decision-v1/components/ShareCardImage";
import { CollapsibleFriendResult } from "../../../src/map-decision-v1/components/CollapsibleFriendResult";
import { Badge, Card } from "../../../src/map-decision-v1/components/ui/primitives";
import { GetShareResult, getShare } from "../../../src/map-decision-v1/engine/share-store";
import { FinalResult, IdealTypeResult } from "../../../src/map-decision-v1/types";

// 링크를 아는 사람만 볼 수 있는 읽기 전용 공개 화면 — 검색엔진에는
// 노출되지 않게 한다. 편집·재생성·공유 버튼은 없고, 바이럴 고리인
// "너도 만들어봐" CTA만 있다. 이상형·진로 둘 다 같은 화면에서 저장된
// resultLayoutId에 따라 알맞은 결과 블록을 보여준다.
//
// title/description/이미지 전부 카드마다, 주제마다 달라지지 않는
// 고정값이다 — 카드 제목처럼 사용자 결과 내용이 들어가면 그 문구가
// 카톡 대화 로그에 그대로 남고, 외부 OG 캐시는 우리 쪽 90일 만료와
// 무관하게 따로 남아 있어서 링크가 만료된 뒤에도 미리보기에 내용이
// 노출될 수 있다는 점 때문에 의도적으로 고정해둔다.
//
// 카톡 미리보기 문구 3안 (오너 검토용, A안을 기본 적용):
// A안 (호기심, 현재 적용): title "친구가 자기 MAP을 보냈어요" /
//   desc "MBTI 16개로는 안 나오는, 그 사람만의 유형"
// B안 (직접): title "나를 4글자로 요약할 수 없어서" /
//   desc "34개 질문으로 만드는 나만의 MAP"
// C안 (현재 개선): title "친구가 공유한 MAP" /
//   desc "열어보고, 나도 만들어볼까요?"
export const metadata: Metadata = {
  title: "친구가 자기 MAP을 보냈어요",
  description: "MBTI 16개로는 안 나오는, 그 사람만의 유형",
  robots: { index: false, follow: false },
  openGraph: {
    title: "친구가 자기 MAP을 보냈어요",
    description: "MBTI 16개로는 안 나오는, 그 사람만의 유형",
    images: [{ url: "/og-share.png", width: 1200, height: 630 }],
  },
};

// 매 방문마다 저장소를 조회해야 하므로 빌드 시점에 미리 만들어두지
// 않는다(빌드 환경에 저장소 연결 정보가 없어도 빌드가 실패하지 않게).
export const dynamic = "force-dynamic";

function isIdealTypeResult(value: unknown): value is IdealTypeResult {
  // 저장할 때 이미 한 번 검증을 거친 데이터라, 여기서는 화면이 깨지지
  // 않을 정도의 최소한의 모양만 다시 확인한다.
  const r = value as Partial<IdealTypeResult> | undefined;
  return typeof r === "object" && r !== null && typeof r.title === "string" && typeof r.oneLiner === "string" && typeof r.criteria === "object";
}

function isFinalResult(value: unknown): value is FinalResult {
  const r = value as Partial<FinalResult> | undefined;
  return (
    typeof r === "object" && r !== null &&
    typeof r.factorMatrix === "object" && typeof r.scenarios === "object" &&
    typeof r.timeline === "object" && typeof r.insights === "object"
  );
}

// 저장된 레코드가 지금 이 화면에서 그릴 수 있는 형태인지 판단한다.
// resultLayoutId는 topicId가 아니라 "어떤 블록 컴포넌트로 그릴지"를
// 뜻하는 값이라 이걸 기준으로 분기한다(app/api/share/route.ts가 저장
// 시점에 topics.ts의 resultLayoutId를 그대로 넣어둔다). 예전에 저장된
// 이상형 링크도 그때부터 resultLayoutId가 "idealType"이었어서 그대로
// 읽힌다 — 별도 마이그레이션이 필요 없다.
type RenderableShare =
  | { kind: "idealType"; result: IdealTypeResult }
  | { kind: "career"; result: FinalResult }
  | { kind: "unsupported" }
  | null;

function resolveRenderableShare(share: GetShareResult): RenderableShare {
  if (share.status !== "ok") return null;
  const { resultLayoutId, result } = share.record;
  if (resultLayoutId === "idealType") return isIdealTypeResult(result) ? { kind: "idealType", result } : null;
  if (resultLayoutId === "career") return isFinalResult(result) ? { kind: "career", result } : null;
  return { kind: "unsupported" };
}

const PRIMARY_CTA_CLASS =
  "inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-pill border border-primary bg-primary px-6 text-base font-extrabold tracking-[-0.01em] text-primary-foreground shadow-subtle transition-all duration-normal ease-emphasized hover:-translate-y-0.5 hover:bg-primary-hover hover:shadow-floating active:translate-y-0";

// topicId가 있으면 "/?start=<topicId>"로 보내 랜딩(종류 선택 화면)을
// 건너뛰고 같은 주제의 퀴즈/대화를 곧장 시작한다(MapDecisionProduct.tsx의
// 마운트 effect가 이 쿼리 파라미터를 읽는다). topicId를 모르는 상황
// (레이아웃을 모르는 결과, 링크 만료 등)에서는 그냥 "/"로 보낸다.
//
// withId(이 카드의 공유 ID)가 같이 있으면 "&with=<id>"도 붙인다 — 지금
// 이 카드(A)를 보고 있는 사람(B)이 퀴즈를 마치면 자기 결과 화면에서
// "친구와의 궁합 보기" 배너를 볼 수 있게 하는 용도다(궁합 기능).
// topicId가 없을 때는 애초에 "/"로만 보내므로 with도 같이 생략된다.
function ctaHref(topicId?: string, withId?: string) {
  if (!topicId) return "/";
  const params = new URLSearchParams({ start: topicId });
  if (withId) params.set("with", withId);
  return `/?${params.toString()}`;
}

function TryItCta({ topicId, withId }: { topicId?: string; withId?: string }) {
  return (
    <Link href={ctaHref(topicId, withId)} className={PRIMARY_CTA_CLASS}>
      너도 만들어봐
    </Link>
  );
}

// 자기성찰 블록(가장 감정적으로 몰입되는 지점) 바로 다음에 놓는 두 번째
// CTA. 맨 아래 CTA(강조 버튼)와 똑같이 생기면 같은 걸 두 번 보여주는
// 것처럼 느껴져서, 여기는 테두리만 있는 은은한 카드형으로 차등을 둔다.
function MidResultCta({ topicId, withId }: { topicId?: string; withId?: string }) {
  return (
    <Link
      href={ctaHref(topicId, withId)}
      className="flex items-center justify-between gap-3 rounded-large border border-primary/30 bg-primary/5 px-5 py-4 text-sm font-extrabold text-primary transition-colors hover:bg-primary/10"
    >
      <span>나도 이런 발견, 해보고 싶다면?</span>
      <span aria-hidden="true">→</span>
    </Link>
  );
}

export default async function SharedResultPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const share = await getShare(id);
  const renderable = resolveRenderableShare(share);

  // 초대장 컨셉(card.png) 배경과 톤을 맞춘다 — 이 화면 전체를 앱의
  // 다른 화면(퀴즈·결과 화면)이 쓰는 컬러풀한 그라데이션 배경 대신
  // card.png와 같은 단색 크림(#fbf7ef, bg-background 토큰)으로 바꾼다.
  // 이상형이 아닌 결과(진로 등)는 이번 범위 밖이라 기존 배경을 그대로
  // 쓴다.
  const isInvitationBackground = renderable?.kind === "idealType";

  return (
    <main
      className={
        isInvitationBackground
          ? "min-h-dvh bg-background px-4 py-4 pb-safe-bottom pt-safe-top text-text-primary"
          : "min-h-dvh px-4 py-4 pb-safe-bottom pt-safe-top text-text-primary"
      }
    >
      <div className="mx-auto flex w-full max-w-sm flex-col gap-3">
        <div className="flex items-center px-1">
          <Brand />
        </div>
        {renderable?.kind === "idealType" ? (
          <>
            {share.status === "ok" && share.record.quizDepth === "deep" ? (
              <Badge tone="success" className="self-start">
                심층 분석 포함
              </Badge>
            ) : null}
            <ShareCardImage
              src={`/r/${id}/card.png`}
              alt={renderable.result.title}
              // 카드 이미지 안에도 같은 내용이 있어서 평소엔 안 보여준다 —
              // 이미지 로드가 실패했을 때만 텍스트로 대신 보여주는
              // fallback이다(복사·선택·접근성 목적 겸용).
              fallback={
                <div className="flex flex-col items-center gap-2 text-center">
                  <h1 className="text-balance break-keep text-2xl font-black leading-8 tracking-[-0.03em] text-text-primary">
                    {renderable.result.title}
                  </h1>
                  <p className="text-sm font-bold leading-6 text-text-secondary">{renderable.result.oneLiner}</p>
                  <TagRow tags={renderable.result.tags ?? []} className="justify-center" />
                </div>
              }
            />
            <TryItCta topicId={share.status === "ok" ? share.record.topicId : undefined} withId={id} />
            <div className="h-px w-full bg-border" />
            <CollapsibleFriendResult>
              <IdealTypeResultBlocks
                result={renderable.result}
                afterReflection={<MidResultCta topicId={share.status === "ok" ? share.record.topicId : undefined} withId={id} />}
              />
            </CollapsibleFriendResult>
          </>
        ) : renderable?.kind === "career" ? (
          <>
            <FinalResultSectionReadOnly result={renderable.result} />
            <TryItCta topicId={share.status === "ok" ? share.record.topicId : undefined} />
          </>
        ) : renderable?.kind === "unsupported" ? (
          // 알 수 없는(또는 아직 지원하지 않는) 레이아웃 — 데이터가
          // 없거나 만료된 것과는 다른 상황이라 문구를 구분해준다.
          <Card className="flex flex-col items-center gap-4 py-10 text-center">
            <p className="text-sm font-extrabold text-text-secondary">이 카드는 지금 화면에서 볼 수 있는 형식이 아니에요.</p>
            <TryItCta topicId={share.status === "ok" ? share.record.topicId : undefined} />
          </Card>
        ) : share.status === "unavailable" ? (
          // 저장소 장애로 지금 당장 확인이 안 되는 상태 — 링크 자체는
          // 멀쩡할 수 있으니 "만료됐다"고 말하면 안 되고, 바이럴 CTA보다
          // 새로고침 안내가 먼저 나와야 한다.
          <Card className="flex flex-col items-center gap-4 py-10 text-center">
            <p className="text-sm font-extrabold text-text-secondary">지금 일시적인 문제로 이 카드를 불러올 수 없어요. 잠시 후 새로고침해주세요.</p>
            <a href={`/r/${id}`} className={PRIMARY_CTA_CLASS}>
              🔄 새로고침
            </a>
          </Card>
        ) : (
          <Card className="flex flex-col items-center gap-4 py-10 text-center">
            <p className="text-sm font-extrabold text-text-secondary">링크가 만료됐거나 찾을 수 없어요.</p>
            <TryItCta />
          </Card>
        )}
      </div>
    </main>
  );
}
