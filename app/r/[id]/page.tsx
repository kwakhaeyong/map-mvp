import type { Metadata } from "next";
import { Brand, PRODUCT_DEFINITION } from "../../../src/map-decision-v1/components/Landing";
import { MidResultCta, PRIMARY_CTA_CLASS, ShareViewTracker, TryItCta } from "../../../src/map-decision-v1/components/SharedResultCta";
import { IdealTypeResultBlocks, TagRow } from "../../../src/map-decision-v1/components/IdealTypeResultBlocks";
import { SelfIntroResultBlocks, SelfIntroTagRow } from "../../../src/map-decision-v1/components/SelfIntroResultBlocks";
import { FriendshipResultBlocks, FriendshipTagRow } from "../../../src/map-decision-v1/components/FriendshipResultBlocks";
import { WorkResultBlocks, WorkTagRow } from "../../../src/map-decision-v1/components/WorkResultBlocks";
import { TasteResultDetails, TasteResultHighlights, TasteRoadmapDisclosure, TasteTagRow } from "../../../src/map-decision-v1/components/TasteResultBlocks";
import { TravelResultBlocks, TravelTagRow } from "../../../src/map-decision-v1/components/TravelResultBlocks";
import { FinalResultSectionReadOnly } from "../../../src/map-decision-v1/components/FinalResultBlocks";
import { ShareCardImage } from "../../../src/map-decision-v1/components/ShareCardImage";
import { CollapsibleFriendResult } from "../../../src/map-decision-v1/components/CollapsibleFriendResult";
import { DeleteShareSection } from "../../../src/map-decision-v1/components/DeleteShareSection";
import { Badge, Card } from "../../../src/map-decision-v1/components/ui/primitives";
import { GetShareResult, getShare } from "../../../src/map-decision-v1/engine/share-store";
import { FinalResult, FriendshipResult, IdealTypeResult, SelfIntroResult, TasteResult, TravelResult, WorkResult } from "../../../src/map-decision-v1/types";

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

function isSelfIntroResult(value: unknown): value is SelfIntroResult {
  const r = value as Partial<SelfIntroResult> | undefined;
  return typeof r === "object" && r !== null && typeof r.title === "string" && typeof r.oneLiner === "string" && typeof r.coreValues === "object";
}

function isFriendshipResult(value: unknown): value is FriendshipResult {
  const r = value as Partial<FriendshipResult> | undefined;
  return typeof r === "object" && r !== null && typeof r.title === "string" && typeof r.oneLiner === "string" && typeof r.friendCriteria === "object";
}

function isWorkResult(value: unknown): value is WorkResult {
  const r = value as Partial<WorkResult> | undefined;
  return typeof r === "object" && r !== null && typeof r.title === "string" && typeof r.oneLiner === "string" && typeof r.workDrivers === "object";
}

function isTasteResult(value: unknown): value is TasteResult {
  const r = value as Partial<TasteResult> | undefined;
  return typeof r === "object" && r !== null && typeof r.title === "string" && typeof r.oneLiner === "string" && typeof r.tasteCore === "object";
}

function isTravelResult(value: unknown): value is TravelResult {
  const r = value as Partial<TravelResult> | undefined;
  return typeof r === "object" && r !== null && typeof r.title === "string" && typeof r.oneLiner === "string" && typeof r.fit === "object";
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
  | { kind: "selfIntro"; result: SelfIntroResult }
  | { kind: "friendship"; result: FriendshipResult }
  | { kind: "work"; result: WorkResult }
  | { kind: "taste"; result: TasteResult }
  | { kind: "travelStyle"; result: TravelResult }
  | { kind: "career"; result: FinalResult }
  | { kind: "unsupported" }
  | null;

function resolveRenderableShare(share: GetShareResult): RenderableShare {
  if (share.status !== "ok") return null;
  const { resultLayoutId, result } = share.record;
  if (resultLayoutId === "idealType") return isIdealTypeResult(result) ? { kind: "idealType", result } : null;
  if (resultLayoutId === "selfIntro") return isSelfIntroResult(result) ? { kind: "selfIntro", result } : null;
  if (resultLayoutId === "friendship") return isFriendshipResult(result) ? { kind: "friendship", result } : null;
  if (resultLayoutId === "work") return isWorkResult(result) ? { kind: "work", result } : null;
  if (resultLayoutId === "taste") return isTasteResult(result) ? { kind: "taste", result } : null;
  if (resultLayoutId === "travelStyle") return isTravelResult(result) ? { kind: "travelStyle", result } : null;
  if (resultLayoutId === "career") return isFinalResult(result) ? { kind: "career", result } : null;
  return { kind: "unsupported" };
}

// 모든 분기(이상형·나 소개·친구·인간관계·진로) 공통 하단 정책 링크.
// components/IdealTypeCard.tsx·SelfIntroCard.tsx·FriendshipCard.tsx처럼
// "본인이 결과를 만드는 화면"에는 이미 있던 링크(같은 문구·같은
// 가운뎃점 구분자)를, 이 읽기 전용 공유 화면에도 통일해서 넣는다.
// (PR #161에서 friendship 분기에만 넣었다가 나머지 세 분기와 비대칭이
// 생겨 이번에 전부 통일한다.)
function PolicyFooterLinks() {
  return (
    <p className="text-center text-xs font-semibold text-text-muted">
      <a href="/privacy" className="underline underline-offset-2 hover:text-text-primary">
        개인정보처리방침
      </a>
      <span className="mx-1.5">·</span>
      <a href="/terms" className="underline underline-offset-2 hover:text-text-primary">
        이용약관
      </a>
    </p>
  );
}

export default async function SharedResultPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const share = await getShare(id);
  const renderable = resolveRenderableShare(share);

  // 초대장 컨셉(card.png) 배경과 톤을 맞춘다 — 이 화면 전체를 앱의
  // 다른 화면(퀴즈·결과 화면)이 쓰는 컬러풀한 그라데이션 배경 대신
  // card.png와 같은 단색 크림(#fbf7ef, bg-background 토큰)으로 바꾼다.
  // 나 소개·성격도 같은 초대장 컨셉 card.png를 쓰므로 같이 포함한다.
  // 친구·인간관계도 같은 컨셉(engine/friendship-card-image.tsx)이라 포함한다.
  // 일할 때의 나도 같은 컨셉(engine/work-card-image.tsx)이라 포함한다.
  // 취향도 같은 컨셉(engine/taste-card-image.tsx)이라 포함한다.
  // 여행 스타일도 같은 컨셉(engine/travel-card-image.tsx)이라 포함한다.
  // 진로 등 그 외 결과는 이번 범위 밖이라 기존 배경을 그대로 쓴다.
  const isInvitationBackground =
    renderable?.kind === "idealType" ||
    renderable?.kind === "selfIntro" ||
    renderable?.kind === "friendship" ||
    renderable?.kind === "work" ||
    renderable?.kind === "taste" ||
    renderable?.kind === "travelStyle";

  // 삭제 버튼(DeleteShareSection)은 실제로 지울 데이터가 있는 경우
  // (share.status === "ok")에만 보여준다 — 이미 만료·삭제된 링크나
  // 저장소 장애 화면에는 지울 대상 자체가 없다.
  const cardContent = (
    <>
        {/* shared_view(NEXT CYCLE — MINIMUM PRODUCT ANALYTICS, 2026-08) —
            renderable이 실제로 지원되는 결과 형태일 때만 찍는다. 만료·
            저장소 장애·미지원 레이아웃 화면은 "정상적으로 열렸다"고 볼 수
            없어 제외한다(아래 각 분기의 topicId는 share.status === "ok"일
            때만 존재하므로 renderable이 있으면 항상 함께 있다). */}
        {renderable && renderable.kind !== "unsupported" ? (
          <ShareViewTracker topicId={share.status === "ok" ? share.record.topicId : undefined} />
        ) : null}
        {renderable?.kind === "idealType" ? (
          <>
            <div className="flex flex-wrap items-center gap-2">
              {/* 이상형·나소개 카드가 태그 18개를 공유해(교차 궁합용) card.png
                  겉모습이 같아진 것과 같은 이유로, 카드 이미지 밖 HTML
                  영역에도 같은 배지를 둔다 — showHero=false라 HeroHeader의
                  "이상형 카드" 배지가 이 화면엔 렌더되지 않기 때문이다. */}
              <Badge tone="default" className="self-start">
                내가 끌리는 사람
              </Badge>
              {share.status === "ok" && share.record.quizDepth === "deep" ? (
                <Badge tone="success" className="self-start">
                  심층 분석 포함
                </Badge>
              ) : null}
            </div>
            <ShareCardImage
              src={`/r/${id}/card.png`}
              alt={renderable.result.title}
              title={renderable.result.title}
              // 카드 이미지 안에도 같은 내용이 있어서 평소엔 안 보여준다 —
              // 이미지 로드가 실패했을 때만 텍스트로 대신 보여주는
              // fallback이다(복사·선택·접근성 목적 겸용).
              fallback={
                <div className="flex flex-col items-center gap-2 text-center">
                  <h1 className="text-balance break-keep text-2xl font-black leading-8 tracking-[-0.03em] text-text-primary">
                    {renderable.result.title}
                  </h1>
                  <p className="text-sm font-bold leading-6 text-text-secondary">{renderable.result.oneLiner}</p>
                  {renderable.result.statusLabel ? (
                    <p className="text-xs font-semibold leading-5 text-text-secondary">{renderable.result.statusLabel}</p>
                  ) : null}
                  {/* card.png(ideal-type-card-image.tsx)도 태그를 4개로
                      자르므로, 이미지가 실패했을 때만 뜨는 이 폴백도
                      같은 개수로 맞춘다. */}
                  <TagRow tags={(renderable.result.tags ?? []).slice(0, 4)} className="justify-center" />
                </div>
              }
            />
            <TryItCta topicId={share.status === "ok" ? share.record.topicId : undefined} withId={id} />
            <div className="h-px w-full bg-border" />
            <CollapsibleFriendResult>
              <IdealTypeResultBlocks
                result={renderable.result}
                showHero={false}
                afterReflection={<MidResultCta topicId={share.status === "ok" ? share.record.topicId : undefined} withId={id} />}
              />
            </CollapsibleFriendResult>
            <PolicyFooterLinks />
          </>
        ) : renderable?.kind === "selfIntro" ? (
          <>
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone="default" className="self-start">
                나는 이런 사람
              </Badge>
              {share.status === "ok" && share.record.quizDepth === "deep" ? (
                <Badge tone="success" className="self-start">
                  심층 분석 포함
                </Badge>
              ) : null}
            </div>
            <ShareCardImage
              src={`/r/${id}/card.png`}
              alt={renderable.result.title}
              title={renderable.result.title}
              fallback={
                <div className="flex flex-col items-center gap-2 text-center">
                  <h1 className="text-balance break-keep text-2xl font-black leading-8 tracking-[-0.03em] text-text-primary">
                    {renderable.result.title}
                  </h1>
                  <p className="text-sm font-bold leading-6 text-text-secondary">{renderable.result.oneLiner}</p>
                  {renderable.result.statusLabel ? (
                    <p className="text-xs font-semibold leading-5 text-text-secondary">{renderable.result.statusLabel}</p>
                  ) : null}
                  {/* card.png(self-intro-card-image.tsx)도 태그를 4개로
                      자르므로, 이미지가 실패했을 때만 뜨는 이 폴백도
                      같은 개수로 맞춘다. */}
                  <SelfIntroTagRow tags={(renderable.result.tags ?? []).slice(0, 4)} className="justify-center" />
                </div>
              }
            />
            <TryItCta topicId={share.status === "ok" ? share.record.topicId : undefined} withId={id} />
            <div className="h-px w-full bg-border" />
            <CollapsibleFriendResult>
              <SelfIntroResultBlocks
                result={renderable.result}
                showHero={false}
                afterReflection={<MidResultCta topicId={share.status === "ok" ? share.record.topicId : undefined} withId={id} />}
              />
            </CollapsibleFriendResult>
            <PolicyFooterLinks />
          </>
        ) : renderable?.kind === "friendship" ? (
          <>
            {/* 친구·인간관계는 심화(선택) 경로가 없는 주제라, 이상형·나
                소개 분기에 있는 "심층 분석 포함" 배지를 여기서는 넣지
                않는다(quizDepth 자체가 존재하지 않는다). */}
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone="default" className="self-start">
                나는 이런 친구
              </Badge>
            </div>
            <ShareCardImage
              src={`/r/${id}/card.png`}
              alt={renderable.result.title}
              title={renderable.result.title}
              fallback={
                <div className="flex flex-col items-center gap-2 text-center">
                  <h1 className="text-balance break-keep text-2xl font-black leading-8 tracking-[-0.03em] text-text-primary">
                    {renderable.result.title}
                  </h1>
                  <p className="text-sm font-bold leading-6 text-text-secondary">{renderable.result.oneLiner}</p>
                  {renderable.result.statusLabel ? (
                    <p className="text-xs font-semibold leading-5 text-text-secondary">{renderable.result.statusLabel}</p>
                  ) : null}
                  {/* card.png(friendship-card-image.tsx)도 태그를 4개로
                      자르므로, 이미지가 실패했을 때만 뜨는 이 폴백도
                      같은 개수로 맞춘다 — 카드보다 폴백에 태그가 더 많이
                      보이는 불일치를 피한다. */}
                  <FriendshipTagRow tags={(renderable.result.tags ?? []).slice(0, 4)} className="justify-center" />
                </div>
              }
            />
            <TryItCta topicId={share.status === "ok" ? share.record.topicId : undefined} withId={id} />
            <div className="h-px w-full bg-border" />
            <CollapsibleFriendResult>
              <FriendshipResultBlocks
                result={renderable.result}
                showHero={false}
                afterReflection={<MidResultCta topicId={share.status === "ok" ? share.record.topicId : undefined} withId={id} />}
              />
            </CollapsibleFriendResult>
            <PolicyFooterLinks />
          </>
        ) : renderable?.kind === "work" ? (
          <>
            {/* 일할 때의 나도 친구·인간관계와 같은 이유로 심화(선택) 경로가
                없는 주제라 "심층 분석 포함" 배지를 넣지 않는다. */}
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone="default" className="self-start">
                나는 이렇게 일해
              </Badge>
            </div>
            <ShareCardImage
              src={`/r/${id}/card.png`}
              alt={renderable.result.title}
              title={renderable.result.title}
              fallback={
                <div className="flex flex-col items-center gap-2 text-center">
                  <h1 className="text-balance break-keep text-2xl font-black leading-8 tracking-[-0.03em] text-text-primary">
                    {renderable.result.title}
                  </h1>
                  <p className="text-sm font-bold leading-6 text-text-secondary">{renderable.result.oneLiner}</p>
                  {renderable.result.statusLabel ? (
                    <p className="text-xs font-semibold leading-5 text-text-secondary">{renderable.result.statusLabel}</p>
                  ) : null}
                  {/* card.png(work-card-image.tsx)도 태그를 4개로
                      자르므로, 이미지가 실패했을 때만 뜨는 이 폴백도
                      같은 개수로 맞춘다. */}
                  <WorkTagRow tags={(renderable.result.tags ?? []).slice(0, 4)} className="justify-center" />
                </div>
              }
            />
            <TryItCta topicId={share.status === "ok" ? share.record.topicId : undefined} withId={id} />
            <div className="h-px w-full bg-border" />
            <CollapsibleFriendResult>
              <WorkResultBlocks
                result={renderable.result}
                showHero={false}
                afterReflection={<MidResultCta topicId={share.status === "ok" ? share.record.topicId : undefined} withId={id} />}
              />
            </CollapsibleFriendResult>
            <PolicyFooterLinks />
          </>
        ) : renderable?.kind === "taste" ? (
          <>
            {/* 취향도 친구·인간관계·일할 때의 나와 같은 이유로 심화(선택)
                경로가 없는 주제라 "심층 분석 포함" 배지를 넣지 않는다. */}
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone="default" className="self-start">
                내 취향은 이래
              </Badge>
            </div>
            <ShareCardImage
              src={`/r/${id}/card.png`}
              alt={renderable.result.title}
              title={renderable.result.title}
              fallback={
                <div className="flex flex-col items-center gap-2 text-center">
                  <h1 className="text-balance break-keep text-2xl font-black leading-8 tracking-[-0.03em] text-text-primary">
                    {renderable.result.title}
                  </h1>
                  <p className="text-sm font-bold leading-6 text-text-secondary">{renderable.result.oneLiner}</p>
                  {renderable.result.statusLabel ? (
                    <p className="text-xs font-semibold leading-5 text-text-secondary">{renderable.result.statusLabel}</p>
                  ) : null}
                  {/* card.png(taste-card-image.tsx)도 태그를 4개로
                      자르므로, 이미지가 실패했을 때만 뜨는 이 폴백도
                      같은 개수로 맞춘다. */}
                  <TasteTagRow tags={(renderable.result.tags ?? []).slice(0, 4)} className="justify-center" />
                </div>
              }
            />
            <div className="h-px w-full bg-border" />
            {/* RESULT EXPERIENCE REBUILD(2026-08): 라이브 결과 화면과
                마찬가지로 "MAP이 발견한 3가지"·MY MAP은 접지 않고 바로
                보여준다(§11 — 두 화면이 여기까지는 같은 걸 보여줘야
                한다). showHero=false인 이유는 그대로다 — 위 ShareCardImage가
                이미 타이틀·한줄설명·태그를 담은 카드 이미지라, RESULT
                CARD(HeroHeader)를 텍스트로 한 번 더 반복할 필요가 없다.
                VIRAL/FRIEND EXPERIENCE REBUILD(2026-08): 강한 CTA(아래)를
                이 블록보다 먼저 두지 않는다 — 친구가 카드 이미지만 보고
                바로 "너도 해봐" 버튼을 만나면, 이 링크의 핵심 자산인
                Living MY MAP을 보기도 전에 CTA부터 마주치게 된다. "발견 →
                MY MAP → CTA" 순서를 지켜야 강한 CTA가 "지금 막 본 지형이
                궁금해서 누르는 버튼"으로 읽힌다. */}
            <TasteResultHighlights result={renderable.result} showHero={false} />
            {/* 받는 사람 전용 강한 CTA — 발신자 쪽(TasteCard.tsx)의 "이
                카드 공유하기" 버튼과는 다른 문제다: 저건 "보내는 사람이
                누르는 버튼"이고 이건 "받은 사람이 자기 것도 궁금해져서
                누르는 버튼"이라 문구도 달라야 한다. 근거 없는 통계
                문구("98%가 놀랐어요" 류) 없이, 방금 본 Living MY MAP이
                "나만의 지형"이라는 사실 자체로 호기심을 건드리는 한 줄만
                붙인다. */}
            <div className="flex flex-col gap-2">
              <p className="text-center text-xs font-semibold text-text-muted">같은 질문에 답해도 지형은 다르게 나와요.</p>
              <TryItCta topicId={share.status === "ok" ? share.record.topicId : undefined} withId={id} label="나는 어떻게 나올까?" />
            </div>
            <CollapsibleFriendResult>
              <TasteResultDetails result={renderable.result} />
              {/* 위 강한 CTA와 문구를 다르게 둔다 — 여기까지 펼쳐서 읽은
                  사람은 이미 "나는 어떻게 나올까?"라는 호기심을 한 번
                  넘어선 상태라, 똑같은 질문을 반복하기보다 곧장 행동
                  문구("나도 내 MAP 보기")로 마무리한다. */}
              <MidResultCta
                topicId={share.status === "ok" ? share.record.topicId : undefined}
                withId={id}
                label="나도 내 MAP 보기"
              />
              <TasteRoadmapDisclosure roadmap={renderable.result.roadmap} />
            </CollapsibleFriendResult>
            <PolicyFooterLinks />
          </>
        ) : renderable?.kind === "travelStyle" ? (
          <>
            {/* 여행 스타일도 친구·인간관계·일할 때의 나·취향과 같은 이유로
                심화(선택) 경로가 없는 주제라 "심층 분석 포함" 배지를 넣지
                않는다. */}
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone="default" className="self-start">
                나는 이렇게 여행해
              </Badge>
            </div>
            <ShareCardImage
              src={`/r/${id}/card.png`}
              alt={renderable.result.title}
              title={renderable.result.title}
              fallback={
                <div className="flex flex-col items-center gap-2 text-center">
                  <h1 className="text-balance break-keep text-2xl font-black leading-8 tracking-[-0.03em] text-text-primary">
                    {renderable.result.title}
                  </h1>
                  <p className="text-sm font-bold leading-6 text-text-secondary">{renderable.result.oneLiner}</p>
                  {renderable.result.statusLabel ? (
                    <p className="text-xs font-semibold leading-5 text-text-secondary">{renderable.result.statusLabel}</p>
                  ) : null}
                  {/* card.png(travel-card-image.tsx)도 태그를 4개로
                      자르므로, 이미지가 실패했을 때만 뜨는 이 폴백도
                      같은 개수로 맞춘다. */}
                  <TravelTagRow tags={(renderable.result.tags ?? []).slice(0, 4)} className="justify-center" />
                </div>
              }
            />
            <TryItCta topicId={share.status === "ok" ? share.record.topicId : undefined} withId={id} />
            <div className="h-px w-full bg-border" />
            <CollapsibleFriendResult>
              <TravelResultBlocks
                result={renderable.result}
                showHero={false}
                afterReflection={<MidResultCta topicId={share.status === "ok" ? share.record.topicId : undefined} withId={id} />}
              />
            </CollapsibleFriendResult>
            <PolicyFooterLinks />
          </>
        ) : renderable?.kind === "career" ? (
          <>
            <FinalResultSectionReadOnly result={renderable.result} />
            <TryItCta topicId={share.status === "ok" ? share.record.topicId : undefined} />
            <PolicyFooterLinks />
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
    </>
  );

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
        {/* RESULT IDENTITY & CLARITY PASS(2026-08) — 공유 링크를 처음 여는
            사람이 맥락을 이해하는 지점. Landing.tsx의 PRODUCT_DEFINITION과
            똑같은 한 문장을 그대로 재사용한다(새 문구를 따로 만들지
            않는다 — 한 서비스에 정체성 문장은 하나여야 한다). 실제 결과
            카드가 있는 6개 퀴즈형 주제(isInvitationBackground와 같은
            조건)에서만 보여준다 — 만료·장애·미지원 화면이나 진로(자유
            대화형, "고르고 쓰다"라는 표현이 안 맞음)에는 넣지 않는다. */}
        {isInvitationBackground ? (
          <p className="px-1 text-xs font-semibold leading-5 text-text-muted">{PRODUCT_DEFINITION}</p>
        ) : null}
        {share.status === "ok" ? <DeleteShareSection id={id}>{cardContent}</DeleteShareSection> : cardContent}
      </div>
    </main>
  );
}
