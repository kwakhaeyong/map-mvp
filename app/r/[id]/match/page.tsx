import type { Metadata } from "next";
import Link from "next/link";
import { Brand } from "../../../../src/map-decision-v1/components/Landing";
import { TagRow } from "../../../../src/map-decision-v1/components/IdealTypeResultBlocks";
import { Card } from "../../../../src/map-decision-v1/components/ui/primitives";
import { getShare, SharedResultRecord } from "../../../../src/map-decision-v1/engine/share-store";
import { buildAxisSentences, compareTags, TIER_DESCRIPTION, TIER_LABEL } from "../../../../src/map-decision-v1/engine/compatibility";

// 친구(A)의 공유 카드와 내(B) 태그를 코드로만 비교하는 화면. ★AI를
// 호출하지 않는다 — engine/compatibility.ts의 compareTags()가 하는 일은
// 두 문자열 배열을 정해진 사전(TAG_CATEGORIES)으로 대조하는 것뿐이다.
//
// A의 자기성찰·6블록 등 다른 정보는 여기 전혀 노출하지 않는다 — A의
// 공유 레코드에서 태그 4개만 꺼내 쓴다. 공유 버튼도 없다: B가 A의 동의
// 없이 이 비교 결과(A의 태그 포함)를 제3자에게 다시 퍼뜨릴 수 있는
// 통로를 만들지 않기 위해서다. 검색엔진 노출도 막고(noindex), 카드
// 제목/설명은 사람마다 달라지지 않는 고정값으로 둔다(동적 OG 없음).
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "친구와의 궁합",
  description: "MAP 태그로 보는 우리 둘의 공통점과 다른 점",
  robots: { index: false, follow: false },
};

const PRIMARY_CTA_CLASS =
  "inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-pill border border-primary bg-primary px-6 text-base font-extrabold tracking-[-0.01em] text-primary-foreground shadow-subtle transition-all duration-normal ease-emphasized hover:-translate-y-0.5 hover:bg-primary-hover hover:shadow-floating active:translate-y-0";

function ctaHref(topicId?: string) {
  return topicId ? `/?start=${encodeURIComponent(topicId)}` : "/";
}

// A의 공유 레코드에서 "태그 4개"만 꺼낸다 — 이상형 결과가 아니거나
// (career 등, 궁합은 이상형 전용) 태그가 없는(이 기능 이전에 저장된)
// 링크는 전부 null로 취급해 "친구 결과를 찾을 수 없어요"로 안내한다.
function extractIdealTypeTags(record: SharedResultRecord): string[] | null {
  if (record.resultLayoutId !== "idealType") return null;
  const result = record.result as { tags?: unknown } | null;
  if (!result || !Array.isArray(result.tags)) return null;
  const tags = result.tags.filter((tag): tag is string => typeof tag === "string");
  return tags.length > 0 ? tags : null;
}

function parseFriendTags(raw: string | string[] | undefined): string[] {
  if (!raw) return [];
  return Array.isArray(raw) ? raw : [raw];
}

function NotFoundCard({ message }: { message: string }) {
  return (
    <Card className="flex flex-col items-center gap-4 py-10 text-center">
      <p className="text-sm font-extrabold text-text-secondary">{message}</p>
      <Link href="/" className={PRIMARY_CTA_CLASS}>
        MAP 만들러 가기
      </Link>
    </Card>
  );
}

function CompatibilityResult({ aTags, bTags, topicId }: { aTags: string[]; bTags: string[]; topicId?: string }) {
  const { overlapCount, tier, axes } = compareTags(aTags, bTags);
  const sentences = buildAxisSentences(axes);
  return (
    <>
      <Card className="flex flex-col items-center gap-2 py-6 text-center">
        <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-text-muted">친구와의 궁합</p>
        <h1 className="text-xl font-black tracking-[-0.02em] text-text-primary">{TIER_LABEL[tier]}</h1>
        <p className="text-sm font-semibold leading-6 text-text-secondary">{TIER_DESCRIPTION[tier]}</p>
        {/* 0/4는 숫자로 보면 "0%"와 같은 인상을 준다 — 겹침이 없을 때는
            분수를 아예 보여주지 않고 위 문구(TIER_DESCRIPTION)만 남긴다. */}
        {overlapCount > 0 ? <p className="text-xs font-bold text-text-muted">겹치는 축 {overlapCount}개 / 4개</p> : null}
      </Card>
      <Card className="flex flex-col gap-3">
        <div className="flex flex-col gap-1.5">
          <p className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-text-muted">친구의 태그</p>
          <TagRow tags={aTags} />
        </div>
        <div className="flex flex-col gap-1.5">
          <p className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-text-muted">내 태그</p>
          <TagRow tags={bTags} />
        </div>
      </Card>
      {sentences.length > 0 ? (
        <Card className="flex flex-col gap-2">
          {sentences.map((sentence) => (
            <p key={sentence} className="text-sm font-semibold leading-6 text-text-primary">
              {sentence}
            </p>
          ))}
        </Card>
      ) : null}
      <Link href={ctaHref(topicId)} className={PRIMARY_CTA_CLASS}>
        나도 MAP 만들어보기
      </Link>
    </>
  );
}

export default async function CompatibilityPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tag?: string | string[] }>;
}) {
  const { id } = await params;
  const query = await searchParams;
  const bTags = parseFriendTags(query.tag);
  const share = await getShare(id);
  const aTags = share.status === "ok" ? extractIdealTypeTags(share.record) : null;
  const topicId = share.status === "ok" ? share.record.topicId : undefined;

  return (
    <main className="min-h-dvh bg-background px-4 py-4 pb-safe-bottom pt-safe-top text-text-primary">
      <div className="mx-auto flex w-full max-w-sm flex-col gap-3">
        <div className="flex items-center px-1">
          <Brand />
        </div>
        {!aTags ? (
          <NotFoundCard
            message={
              share.status === "unavailable"
                ? "지금 일시적인 문제로 친구 결과를 불러올 수 없어요. 잠시 후 새로고침해주세요."
                : "친구 결과를 찾을 수 없어요. 링크가 만료됐을 수 있어요."
            }
          />
        ) : bTags.length === 0 ? (
          <NotFoundCard message="궁합을 보려면 먼저 내 MAP을 만들어야 해요." />
        ) : (
          <CompatibilityResult aTags={aTags} bTags={bTags} topicId={topicId} />
        )}
      </div>
    </main>
  );
}
