import type { Metadata } from "next";
import Link from "next/link";
import { Brand } from "../../../src/map-decision-v1/components/Landing";
import { IdealTypeResultBlocks } from "../../../src/map-decision-v1/components/IdealTypeResultBlocks";
import { FinalResultSectionReadOnly } from "../../../src/map-decision-v1/components/FinalResultBlocks";
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
export const metadata: Metadata = {
  title: "공유된 MAP | MAP Decision",
  description: "친구가 공유한 MAP이에요.",
  robots: { index: false, follow: false },
  openGraph: {
    title: "공유된 MAP | MAP Decision",
    description: "친구가 공유한 MAP이에요.",
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

function TryItCta() {
  return (
    <Link href="/" className={PRIMARY_CTA_CLASS}>
      ✨ 너도 만들어봐
    </Link>
  );
}

export default async function SharedResultPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const share = await getShare(id);
  const renderable = resolveRenderableShare(share);

  return (
    <main className="min-h-dvh px-4 py-4 pb-safe-bottom pt-safe-top text-text-primary">
      <div className="mx-auto flex w-full max-w-sm flex-col gap-3">
        <div className="flex items-center px-1">
          <Brand />
        </div>
        {renderable?.kind === "idealType" ? (
          <>
            {share.status === "ok" && share.record.quizDepth === "deep" ? (
              <Badge tone="success" className="self-start">
                🔍 심층 분석 포함
              </Badge>
            ) : null}
            <IdealTypeResultBlocks result={renderable.result} />
            <TryItCta />
          </>
        ) : renderable?.kind === "career" ? (
          <>
            <FinalResultSectionReadOnly result={renderable.result} />
            <TryItCta />
          </>
        ) : renderable?.kind === "unsupported" ? (
          // 알 수 없는(또는 아직 지원하지 않는) 레이아웃 — 데이터가
          // 없거나 만료된 것과는 다른 상황이라 문구를 구분해준다.
          <Card className="flex flex-col items-center gap-4 py-10 text-center">
            <p className="text-sm font-extrabold text-text-secondary">이 카드는 지금 화면에서 볼 수 있는 형식이 아니에요.</p>
            <TryItCta />
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
