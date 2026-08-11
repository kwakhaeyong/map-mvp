# 현재 상태 (Current State)

이 문서는 특정 시점의 운영 현황을 기록합니다. 아래 "열려 있는 Draft PR"과 "다음 액션"만 예외적으로 가까운 계획을 담습니다. 그 외는 전부 "지금 실제로 그런 상태"만 적습니다.

마지막 갱신: 2026-08-11. 이번 갱신은 2026-08-11 진행된 세 가지 작업(work 주제 문항 업무 맥락 교체, 주제 전환 시 이전 결과 보존, 결과 화면 "다음 MAP 유도" 블록)과 FIRST CLICK MVP(랜딩 히어로를 취향 대표 콘텐츠로 재구성 + 애널리틱스 4개 이벤트 도입)를 코드 기준으로 반영한 것입니다 — 아래 "오늘(8/11) 진행된 작업"·"FIRST CLICK MVP" 두 섹션 참고. 이전 갱신 내용(2026-08-06·2026-08-07·2026-08-09)은 아래에 그대로 남아 있습니다.

## 코드

- 실제로 운영되는 서비스 코드는 **`src/map-decision-v1`** 하나뿐입니다.
- `src/map-os`, `src/conversation-engine`, `src/discovery-engine`, `src/story-engine`, `src/map-engine`는 **삭제되지 않고 그대로 남아있는 죽은 코드**입니다. 어디서도 사용되지 않으며, 참고·재사용하지 마세요. 삭제는 오너 승인 후 별도 정리 PR에서 진행합니다.

## 제품 정의 기준 문서

- 제품이 무엇인지/무엇이 아닌지에 대한 기준 문서는 **`docs/MAP_CONSTITUTION.md`**, **`docs/MAP_DESIGN_SYSTEM.md`**입니다. `README.md`는 기준 문서가 아니며 실제 구현과 맞지 않습니다.
- `docs/NASOGAE_DESIGN.md` — "나 소개·성격" 주제의 설계 문서(PR #122, 머지 완료). 이상형과 태그 4축을 동일하게 재사용하는 이유와 문항 설계 원칙을 담고 있습니다.

## 랜딩 주제 7개 현황

"연애 스타일"은 이상형·나소개와 내용이 겹쳐 만들지 않기로 확정해 목록에서 뺐고, "궁합"은 독립 주제가 아니라 이상형 결과를 비교하는 기능(#107, engine/compatibility.ts)이라 랜딩 카드에서 뺐습니다(그 기능 자체는 그대로 있습니다) — 아래 두 줄 "친구·인간관계"·"일할 때의 나"로 대체됐습니다. "이직"·"큰 결정·소비/재무"도 별도 주제로 만들지 않고 career(진로)에 흡수하기로 확정해 목록·topics.ts 양쪽에서 제거했습니다(PR #164) — 지금 topics.ts에는 이 두 topicId가 아예 존재하지 않아 아래 표에서도 뺐습니다(이전 갱신까지 "준비 중(껍데기만)" 행으로 남아있던 게 실제로는 이미 삭제된 주제를 가리키고 있었습니다).

| topicId | 표시 이름 | 상태 |
|---|---|---|
| career | 진로·커리어 | 활성 (대화형, 축 없음) |
| idealType | 이상형 | 활성 (필수 38문항, 심화 없음 — 심화 경로는 폐지됨) |
| selfIntro | 나 소개·성격 | 활성 (PR #122·#123 머지 완료, 필수 34문항, 심화 없음 — 심화 경로는 폐지됨. 2026-08-09 PR #234에서 직장 전제 문항 4개 제거 + 직업 무관 문항 2개 추가로 36→34, `quizVersion` 4) |
| friendship | 친구·인간관계 | 활성 (PR #158~#163 머지 완료, 필수 30문항, 심화 없음) |
| work | 일할 때의 나 | 활성 (PR #167~#170 머지 완료, 필수 30문항, 심화 없음) |
| taste | 취향 | 활성 (PR #172~#175 머지 완료, 필수 20문항, 심화 없음) |
| travelStyle | 여행 스타일 | 활성 (PR #177~#180 머지 완료, 필수 20문항, 심화 없음) |
| freeform | (자유 서술) | 랜딩 하단에 별도 카드로 노출됨(위 6개 주제 그리드와는 다른 자리), `implemented: false` |

"준비 중"은 `topics.ts`의 `implemented: false`로 판단합니다. `false`인 주제는 카드를 눌러도 대화가 시작되지 않고 "준비 중" 안내만 뜹니다 — 지금 이 조건에 해당하는 주제는 freeform(자유 고민) 하나뿐입니다. `Landing.tsx`의 "딱 맞는 게 없나요?" 카드(302~314행)가 freeform을 가리키며 "준비 중" 배지가 그 카드에 항상 붙어 있습니다. 위 표의 나머지 7개(career·idealType·selfIntro·friendship·work·taste·travelStyle)는 전부 활성 상태입니다.

**심화(선택) 구간은 6개 완성형 퀴즈 주제 전부에서 폐지됐습니다.** `topics.ts`를 코드로 직접 세어 확인한 결과 6개 주제 모두 `required: false`인 축이 0개입니다 — 처음에는 이상형·나 소개만 필수+심화 구조였고 나머지 넷은 처음부터 전부 필수였는데, 이상형·나 소개도 이후 심화 경로가 제거되며 전부 필수로 통합돼 지금은 예외 없이 전부 필수입니다. 다만 `TopicQuiz.tsx`의 심화 갈림길 코드 자체는 아직 파일에 남아있습니다 — 아래 "발견된 죽은 코드" 참고.

## 주제 선택 뒤 프로필 입력 화면 (PR #236, 2026-08-09)

- 랜딩에서 주제 카드를 고르면 바로 대화·퀴즈 화면(`stage: "conversation"`)으로 가지 않고, 그 사이에 `ProfileStep.tsx`(`stage: "profile"`) 화면을 한 번 거칩니다. `MapDecisionProduct.tsx`의 `start(topicId)`가 세션을 만들 때 stage를 `"profile"`로 설정합니다.
- `types/index.ts`의 `MapSession`에 `profile?: { ageRange?: string; occupationStatus?: string; gender?: string }` 필드가 새로 생겼습니다. 나이대·지금 하는 일·성별 세 질문이고 전부 건너뛸 수 있습니다. 이 값은 결과 타입(SelfIntroResult 등)에는 들어가지 않아 공유 링크·card.png에는 노출되지 않습니다.
- 이 값은 두 곳에서만 쓰입니다: (1) 6개 완성형 퀴즈 주제 생성기가 결과 생성 프롬프트의 user 메시지 앞에 "사용자 프로필: ..." 한 줄로 붙여 표현 수위 참고 자료로만 쓰고(SYSTEM_PROMPT에는 넣지 않음, 프롬프트 캐시 적중률 유지 목적), (2) `Landing.tsx`가 `profile.occupationStatus === "학생"`이면 work(일할 때의 나) 카드를 목록에서 뺍니다.
- 선택한 주제가 work이고 "지금 나는"에서 학생을 고르면 `ProfileStep.tsx` 하단에 다른 주제를 고를지 그대로 진행할지 묻는 안내가 뜨지만, 차단하지는 않습니다.
- `/?start=<topicId>` 딥링크(공유 카드의 "너도 만들어봐" CTA)는 `start()`를 거치지 않고 `createSession()`을 직접 호출하는 별도 경로라, 이 경로로 들어온 사용자는 프로필 화면을 보지 않습니다.

## 결과 화면 레이아웃

- 현재 실제로 구현된 결과 레이아웃은 7종류입니다(`types/index.ts`의 각 Result 타입 필드를 코드로 직접 확인):
  - **진로**(대화형, 기존 4블록+지도 구조, `Result.tsx`)
  - **이상형**(6블록, `IdealTypeCard.tsx`+`IdealTypeResultBlocks.tsx` — criteria/attractionPatterns/matrix/flags/selfReflection(whatYouOffer 2개·whatToImprove 3개)/roadmap)
  - **나소개**(6블록, `SelfIntroCard.tsx`+`SelfIntroResultBlocks.tsx` — coreValues/patterns/matrix/traits/selfReflection(whatYouOffer 2개·whatToImprove 3개)/roadmap)
  - **친구·인간관계**(6블록 — friendCriteria/patterns/matrix/friendTypes/selfReflection(whatYouOffer 2개·whatToImprove 3개)/roadmap)
  - **일할 때의 나**(6블록 — workDrivers/patterns/matrix/workFit/selfReflection(strengths 2개·blindSpots 3개)/roadmap)
  - **취향**(6블록 — tasteCore/patterns/matrix/tasteMap/selfReflection(awareness 2개·blindSpots 3개)/roadmap)
  - **여행 스타일**(4블록 — discovery/matrix/fit/roadmap. 원래 다른 다섯 주제와 같은 6블록이었으나 2026-08-06 오늘 4블록으로 재설계됨 — 아래 "오늘(8/6) 진행된 작업" 참고. selfReflection에 해당하는 블록이 없고 discovery가 그 역할까지 흡수함)
  - **2026-08-09 PR #227·#228**: 위 5개 주제(여행 스타일 제외) 전부 selfReflection의 두 필드 개수를 "각 2개"에서 "한쪽 2개·다른 쪽 3개"(whatToImprove/blindSpots 계열이 3개)로 바꿨습니다 — friendship은 #227, idealType·selfIntro·taste·work 4개는 #228에서 적용됐습니다(각 생성기 SYSTEM_PROMPT 문구만 수정, 스키마·문항 변경 없음). 여행 스타일은 selfReflection 블록 자체가 없어 대상에서 빠졌습니다.
- 이상형·나소개·친구·일·취향 다섯 주제는 카드 렌더링·공유 연결 구조가 유사하지만, **공통 추상화 컴포넌트로 뽑혀 있지는 않습니다** — 각자 별도 파일로 존재하는 병렬 구현입니다. "새 주제 추가 시 재사용 가능한 공통 틀"은 아직 코드로 존재하지 않고, 지금까지는 기존 주제 파일을 복제해 새로 만드는 방식으로 확장했습니다.
- `TopicQuiz.tsx`(퀴즈 입력 UI)는 6개 완성형 퀴즈 주제(이상형·나소개·친구·일·취향·여행 스타일) 전부가 공유합니다 — `topic.id` 기반으로 세션 필드명을 계산하도록 일반화되어 있습니다(PR #123).
- **결과 화면 상단 목차는 2026-08-07 하루 동안 제거됐다가 복원됐습니다.** 오전에 전부 제거됐습니다(PR #194) — 목차를 `<a href="#id">` 네이티브 해시 링크로 만들었더니, 클릭할 때 생기는 해시 네비게이션을 `MapDecisionProduct.tsx`의 `popstate` 핸들러가 "알 수 없는 화면 전환"으로 오판해 결과 화면 밖으로 튕겨나가는 버그가 있었기 때문입니다. 저녁에 URL/history를 전혀 건드리지 않는 방식(버튼 클릭 + `useRef` + `scrollIntoView`)으로 다시 만들어졌습니다(PR #203) — 이전 버그의 원인이던 해시 네비게이션 자체를 안 쓰므로 같은 문제가 구조적으로 재발하지 않습니다. career를 제외한 6개 완성형 퀴즈 주제 결과 화면에 전부 적용됐고, 라이브 화면과 공유 화면(`app/r/[id]/page.tsx`)이 같은 블록 컴포넌트를 재사용해 둘 다 자동으로 반영됩니다.
- **로드맵 블록 제목이 "로드맵" → "이제 해볼 것" → "다음 행동"으로 이날 두 차례 바뀌었습니다**(PR #200, 최종적으로 "다음 행동"). 항목 텍스트 앞의 가운뎃점(·)도 인라인 SVG 체크박스 아이콘(빈 사각형, 클릭 기능 없는 순수 시각 표현)으로 교체됐습니다. `TopicQuiz.tsx`의 `RESULT_BLOCK_PREVIEW`(퀴즈 완주 전 보여주는 결과 블록 이름 미리보기, 지금은 idealType·selfIntro만 값이 채워져 있음)도 마지막 블록 이름을 "다음 행동"으로 맞춰 함께 갱신됐습니다.
- **`statusLabel`**: 6개 완성형 퀴즈 주제 결과 타입 전부가 갖고 있는 짧은 상태 문구 필드입니다. AI가 만들지 않고 `engine/ideal-type-tags.ts`의 `getStatusLabel()`이 퀴즈 답변(`session.quizAnswers`)만 보고 고정 사전에서 코드로 결정적으로 골라 채웁니다. **2026-08-09 PR #231(과 PR #231이 머지된 뒤에도 같은 브랜치에 이어붙였다가 반영되지 못한 마지막 2커밋을 복구한 #233 — 자동 머지와는 무관합니다, 아래 "머지된 브랜치 재사용 금지" 참고)**에서 6개 주제의 card.png(초대장 이미지)에 `statusLabel` 전용 존이 새로 추가됐습니다 — 그 전에는 card.png에 title/tags/oneLiner/footer만 있었고 statusLabel은 없었습니다. 존 높이 배분(`ZONE`/`INVITATION_ZONE` 상수)도 이 존을 넣기 위해 title·oneLiner·footer 사이에서 재조정됐습니다. `app/r/[id]/page.tsx`의 카드 이미지 실패 시 폴백 화면에서는 태그를 4개로 자르는 처리도 같은 PR에서 6개 주제 전부에 맞춰졌습니다.

## 새 퀴즈형 주제를 활성화하려면 손대야 하는 파일

1. `src/map-decision-v1/engine/topics.ts` — 문항/선택지/축 매핑 추가, `inputMode: "quiz"`, `implemented: true`
2. `src/map-decision-v1/engine/*-generator.ts`(신규) — 결과 생성 SYSTEM_PROMPT + 스키마
3. `app/api/generate-*-result/route.ts`(신규) — 결과 생성 API
4. `src/map-decision-v1/components/*ResultBlocks.tsx`(신규) — 결과 화면 블록
5. `src/map-decision-v1/components/*Card.tsx`(신규) — 생성 트리거 + 공유 연결
6. `src/map-decision-v1/components/MapDecisionProduct.tsx` — 결과 화면 라우팅 분기 추가
7. `src/map-decision-v1/engine/*-card-image.tsx`(신규, card.png 지원 시) — 초대장 카드 렌더러
8. `src/map-decision-v1/engine/share-validation.ts` — `SUPPORTED_SHARE_TOPICS`에 형태 검증 추가
9. `app/r/[id]/page.tsx`, `app/r/[id]/card.png/route.ts` — 새 주제 렌더 분기 추가
10. `src/map-decision-v1/types/index.ts` — 결과 타입, `MapSession` 필드 추가
11. `app/privacy/page.tsx` — §1·§3·§5의 주제 나열 문장에 새 주제 이름 추가(§4는 "카드형 MAP" 범주 서술로 통일해 두어 원칙적으로 갱신 불필요, PR #162)

**2026-08-09 PR #236 이후 참고**: 위 6번(`MapDecisionProduct.tsx` 라우팅)에는 결과 화면 분기뿐 아니라 `stage === "profile"`일 때 `ProfileStep.tsx`를 렌더링하는 분기도 이미 포함돼 있습니다 — 새 퀴즈형 주제를 추가해도 이 프로필 화면은 모든 주제가 공통으로 거치므로 주제별로 별도 작업이 필요하지 않습니다. 자세한 내용은 위 "주제 선택 뒤 프로필 입력 화면" 참고.

## 공유 링크 · card.png · 궁합 지원 범위 (코드로 확인, 세 기능의 지원 주제가 서로 다름)

- **공유 링크(`/r/{id}`, `/api/share`)는 7개 주제 전부 지원합니다** — `share-validation.ts`의 `SUPPORTED_SHARE_TOPICS`에 idealType·career·selfIntro·friendship·work·taste·travelStyle이 전부 등록돼 있습니다. 공유 링크는 Upstash Redis에 결과 JSON만 저장(대화 원문·IP·이메일 저장 안 함), 90일 자동 만료, **하루 공유 25회 제한**(`share-store.ts`의 `DAILY_SHARE_LIMIT` — 원래 5였다가 국내 이동통신사 CGNAT 환경에서 무관한 사용자가 같은 공인 IP로 묶여 차단되는 문제 때문에 25로 올라간 값입니다. 언제 바뀌었는지는 이 문서 범위에서 확인하지 못했습니다).
- **card.png(초대장 컨셉 이미지, 1080×1350)는 career를 제외한 6개 완성형 퀴즈 주제만 지원합니다** — `app/r/[id]/card.png/route.ts`가 `resultLayoutId`로 분기하는데 career 분기가 없어, career 공유 링크는 card.png를 만들지 못합니다(진로는 원래 카드형이 아니라 지도형 결과라 이 컨셉 자체가 적용되지 않습니다). 2026-08-09 PR #231·#233으로 이 6개 card.png 전부에 `statusLabel` 존이 추가된 내용은 위 "결과 화면 레이아웃" 참고.
- **친구와의 궁합 비교(#107, `engine/compatibility.ts`)는 이상형 결과 전용입니다.** `app/r/[id]/match/page.tsx`의 `extractIdealTypeTags()`가 `resultLayoutId !== "idealType"`이면 곧바로 비교를 포기하고 "친구 결과를 찾을 수 없어요"로 안내합니다 — 나소개를 포함한 나머지 6개 주제는 궁합 화면 진입 자체가 안 됩니다. `compareTags()` 함수 자체는 태그 형식만 맞으면 어떤 주제의 태그든 비교할 수 있게 짜여 있지만(주제를 가리지 않음), 실제로 그 함수를 호출하는 화면 진입 경로가 이상형 하나로만 연결돼 있습니다.
- 궁합 비교(`compareTags`)는 태그 4축이 양쪽 모두 전부 있을 때만("status: ok") 성립합니다. 한쪽이라도 축이 비어 있으면("status: incomplete") "지금은 두 결과를 비교할 수 없어요. 새로 만든 결과끼리는 비교할 수 있어요."로 중립적으로 안내합니다(PR #133). 어느 쪽 축이 비었는지는 사용자에게 노출하지 않고 서버 로그(`[compatibility] comparison incomplete — ...`)에만 남깁니다.
- 태그 체계(`engine/ideal-type-tags.ts`)는 카테고리 4개·태그 총 64개로 고정돼 있습니다(6개 완성형 퀴즈 주제가 공유). 2026-08-06 오늘 이 중 7개 태그 문자열이 교체됐습니다 — 아래 "오늘(8/6) 진행된 작업" 참고.

## 진로 결과 화면 (7/29 정리됨)

- 헤더의 중복 버튼 그룹, 프리미엄 내보내기/다른 기기 안내(둘 다 실제 결제·로그인 연동 없는 목업 문구였음), 결과 화면 상단 방사형 지도(MapCanvas)를 제거했습니다(PR #121). 하단 액션 바(#120에서 접힌 형태로 축소)로 버튼 기능이 통합돼 있습니다.
- ★단, 대화 중 화면(`Conversation.tsx`)에는 방사형 지도(`MapCanvas`)가 여전히 3곳(컴팩트 모드, 전체 모드, 결과 프리뷰 모드)에서 렌더링됩니다 — #121이 정리한 것은 "결과 화면(`Result.tsx`)"뿐이고, 대화가 진행 중인 화면 자체는 범위 밖이었습니다. 아래 "알려진 기술 부채" 참고.

## 결과 생성 멱등 캐시 (PR #135, 락 제거 PR #136 머지 완료)

- 같은 사람이 같은 답변으로 결과 생성을 다시 요청하면(백그라운드 전환 후 페이지 리로드 등) Upstash Redis 캐시에서 이미 만든 결과를 바로 돌려주고, 레이트리밋 슬롯(`reserveGenerationSlot`)을 소모하지 않습니다. 캐시 키는 대화·퀴즈 답변을 정규화해 SHA-256으로 해시한 값(`gen-cache:{topic}:{hash}`)이라 추측 불가능하고, `session.startedAt` 같은 값은 쓰지 않습니다. TTL은 30분(`GENERATION_CACHE_TTL_SECONDS`).
- PR #135는 원래 동시 요청 중복 방지용 락(`acquireGenerationLockOrWaitForCache` 등)을 포함한 채로 머지됐습니다 — 이 락은 대기 상한이 9초인데 실제 생성은 보통 1~2분 걸려서, 통상적인 생성 시간에는 중복 방지가 사실상 작동하지 않는 설계 결함이 있었습니다. **이 락 코드는 후속 수정 PR #136(커밋 `7bccc6d`)으로 이미 제거돼 지금 main·프로덕션에는 남아있지 않습니다.**
- **정정(2026-08-10 조사): "PR #135가 자동 머지됐다"는 이전 서술은 틀렸습니다.** PR 생성 1분 뒤 자동 머지가 실제로 시도됐지만, 당시 PR이 아직 Draft였던 탓에 GitHub가 GraphQL 레벨에서 "Pull Request is still a draft"로 거부해 **실패**했습니다(Actions 잡 로그로 직접 확인). 그로부터 30분 뒤(같은 날 06:22) **오너가 직접 머지**했습니다 — merged_by가 오너 계정이고 머지 커밋도 스쿼시가 아니라 2-부모 병합 커밋입니다. 자동 머지가 "일하다 성공한" 사례가 아니라 "시도했다가 실패한" 사례입니다.
- **같은 세션의 중복 생성 요청을 막는 별도의 마커 장치가 2026-08-07 새로 추가됐습니다(PR #202).** 위 캐시가 "답변 내용이 같으면" 막는 것과 달리, 이 마커는 "지금 이 세션이 생성을 진행 중인지"를 Redis에 짧게 표시해둡니다(`acquireGenerationMarker`/`releaseGenerationMarker`, TTL 3분). 같은 세션에서 생성이 이미 진행 중일 때 새 요청이 들어오면 새로 생성하지 않고 먼저 시작된 생성이 끝나 캐시에 결과가 채워지길 기다립니다(`waitForCachedGeneration`, 2초 간격 폴링). 이 대기는 최대 45초까지만이고(원래 90초였다가 이날 안에 줄임 — 대기 상한과 생성 시간이 겹쳐 함수 자체가 시간 초과로 죽는 것을 막기 위해서), 45초가 지나도 캐시가 안 채워지면 기다리지 않고 그냥 새로 생성합니다. career를 제외한 6개 완성형 퀴즈 주제 라우트에 적용돼 있습니다.
- **`GENERATION_CACHE_TTL_SECONDS`(30분)와 `STALE_SESSION_MS`(30분)는 같은 값이어야 합니다.** 캐시가 먼저 만료되면 복귀 사용자가 재생성 비용을 물고, 세션이 먼저 만료되면 캐시가 무의미해집니다. 이 두 값을 따로따로 바꾸지 마세요 — 둘 중 하나를 조정할 일이 생기면 다른 쪽도 같이 확인해야 합니다.
- **대기 화면 "재개" 문구(2026-08-10, PR #244).** 탭이 배경에서 메모리 압박으로 폐기됐다가 새로고침으로 돌아오면 같은 답변으로 재요청이 발생하는데, 서버 캐시에 이미 결과가 있으면 몇 초 안에 끝나면서도 화면은 처음과 같은 144초짜리 3단계 대기 문구를 보여줘 사용자가 "또 144초를 기다려야 하나" 오해하고 이탈할 수 있었습니다. `session.pendingResultGeneration`(각 `*Card.tsx`의 `generate()`가 요청 직전에 true로 세팅하고 응답이 오면 false로 되돌리는 필드)이 컴포넌트 마운트 시점에 이미 true였으면(=페이지가 새로고침되기 전 생성이 진행 중이었다는 뜻) 대기 화면 첫 문구를 "이전에 만들던 결과를 찾고 있어요"로 바꿉니다(`GenerationWaitCard`의 `resuming` prop). 이 문구는 단계별로 진행시키지 않고 고정해둡니다 — 캐시 히트면 몇 초 안에 화면이 바뀌고, 캐시 미스여도 실제 생성은 정상 진행되니 해가 없습니다.
- **2026-08-10 실측 결과, 이 시나리오(탭 폐기)는 실제로는 발생하지 않았습니다 — 아래 "프로덕션 실측 데이터" 항목 참고.**

## 레이트리밋 (Upstash Redis)

- **정정(2026-08-10): 생성 라우트는 6개가 아니라 7개입니다.** career(`/api/generate-result`)와 6개 완성형 퀴즈 주제(이상형·나소개·친구·일·취향·여행 스타일) 라우트를 합친 숫자입니다 — 문서 곳곳의 "career를 제외한 6개"라는 표현 자체는 정확하지만, "생성 라우트 = 6개"로만 읽으면 career가 빠져 착각하기 쉬워 이번에 명시해둡니다.
- 생성 API 7개 전부는 Upstash Redis 원자적 연산으로 세션당 5회(`MAX_GENERATIONS_PER_SESSION`)·IP당 하루 25회(`DAILY_GENERATION_LIMIT`, 2026-08-10 10→25로 조정)·서비스 전체 하루 상한(`DAILY_GLOBAL_GENERATION_LIMIT`, 기본 300, 환경변수로 재배포 없이 조절 가능, PR #126)을 겁니다.
- 생성 실패 시도 자체에도 세션당 2회(`MAX_FAILED_GENERATIONS_PER_SESSION`) 상한이 있습니다("failure_limit") — 항상 실패하는 입력으로 무제한 호출하는 것을 막기 위함입니다.
- 전체 하루 상한 키(`gen-slot:global:{KST 날짜}`)는 `.github/workflows/daily-limit-alert.yml`이 그대로 읽습니다 — 바뀌지 않았습니다.
- Redis 연결 정보가 없으면(장애 포함) **막는 쪽(fail-closed)**으로 설계돼 있습니다 — 레이트리밋 없이 생성을 허용하면 이 기능의 목적(비용 방어) 자체가 무너지기 때문입니다. 위의 결과 생성 캐시(PR #135)는 이와 반대로 fail-open(Redis 장애 시 캐시를 건너뛰고 기존 동작 유지)이며, 레이트리밋의 fail-closed 동작 자체는 건드리지 않았습니다.
- `session.startedAt`은 세션별 한도의 키로만 쓰입니다(날짜 판단에는 서버 시간만 사용) — 위조 시 세션당 5회 한도만 우회 가능하고, IP 하루 25회·전체 300회 한도는 영향받지 않습니다.
- **2026-08-09 PR #230**에서 `rate-limit.ts`에 두 가지 리스크가 코드 주석으로 기록됐습니다(코드 로직 변경은 없음): (1) `session.startedAt`은 클라이언트가 만드는 값이라 서버가 형식·내용을 검증하지 않으므로, 매 요청마다 새 값을 지어 보내면 세션당 5회 한도를 우회할 수 있습니다(IP·전체 한도는 우회되지 않아 비용 상한 자체는 유지됨). (2) `getClientIp`가 보는 공인 IP 하나에 국내 이동통신사 CGNAT 환경의 여러 실사용자가 묶일 수 있어, IP당 하루 10회(`DAILY_GENERATION_LIMIT`) 한도가 무관한 사용자를 함께 차단할 위험이 있습니다 — 공유 하루 한도(`DAILY_SHARE_LIMIT`)는 같은 이유로 5→25로 이미 조정된 이력이 있지만, 이 생성 쪽 한도(10)는 이번 PR 시점까지 조정되지 않았습니다. **→ 2026-08-10에 같은 근거로 10→25로 조정 완료(아래 항목 참고).**
- **2026-08-10**: 위 PR #230이 예고한 대로 `DAILY_GENERATION_LIMIT`을 10→25로 올렸습니다(공유 하루 한도와 같은 값). 비용 상한은 `DAILY_GLOBAL_GENERATION_LIMIT`(300)이 별도로 담당하므로 서비스 전체의 하루 최대 비용은 그대로입니다. 트레이드오프: 봇 차단이 Origin/Referer 헤더 확인뿐이라, 이 헤더를 흉내 낸 단일 IP 봇이 전역 300 중 최대 25회까지 소모할 수 있다는 점은 감수합니다. `ip_daily_limit` 차단은 현재 서버 로그에 남지 않습니다(다른 사유들과 달리 `console.error` 호출이 없음) — 이번 PR에서는 구현하지 않았고, 필요해지면 `rate-limit.ts`의 `if (ipDailyCount > DAILY_GENERATION_LIMIT)` 분기에 `failure_limit` 분기와 같은 방식의 로그를 추가해야 합니다.
- **2026-08-10 조사로 드러난 더 근본적인 구멍**: 위 레이트리밋은 전부 "몇 번 요청했는지"만 세지, "그 요청이 실제로 퀴즈를 풀고 보낸 것인지"는 보지 않았습니다. 6개 완성형 퀴즈 주제 라우트의 `isOversized`는 상한만 있고 하한이 없어서, `session.messages`가 빈 배열이어도(퀴즈를 하나도 안 푼 요청) 그대로 통과해 Anthropic 호출까지 갔습니다 — 봇이 매번 세션 키를 새로 지어 보내면(위 우회 방법과 결합) 전역 하루 300회 상한이 소진될 때까지 사실상 공짜로 생성 비용을 소모시킬 수 있는 경로였습니다.
- **2026-08-10 조치**: 위 구멍을 막기 위해 6개 완성형 퀴즈 주제 라우트(career 제외 — career는 이미 `isReadyForResult`가 있어 손대지 않음) 전부에 답변 개수 하한 검증(`requiredAnswerCount`/`isMissingRequiredAnswers`)을 추가했습니다. `isOversized`와 같은 자리(레이트리밋 예약·캐시 조회보다 먼저)에서 실행되며, 차단 시 응답도 `isRequestBody` 실패와 같은 형식·같은 문구(`reason: "invalid_request"`, "요청 형식이 올바르지 않아요.")를 그대로 재사용합니다(새 문구를 만들지 않았습니다).
  - **임계값 근거**: `resolveTopic(topicId).axes`에서 `required && type !== "reflection"`인 축의 개수를 그대로 최소 기준으로 씁니다. 서술형(reflection) 문항은 `TopicQuiz.tsx`에서 건너뛰기가 항상 허용되고, 건너뛰면 `commitAnswer`가 애초에 `session.quizAnswers`에 기록하지 않습니다(선택형 문항만 `selectedTopLevelLabels`가 있을 때 기록됨) — 그래서 전체 축 개수를 그대로 요구하면 서술형을 정상적으로 건너뛴 진짜 사용자까지 막히므로, 서술형을 뺀 개수를 씁니다. 선택형 문항은 건너뛸 방법이 자체가 없어 정상 완주 시 반드시 `quizAnswers`에 채워집니다. 주제별 임계값: 이상형 35(전체 38−서술형 3), 나소개 31(34−3), 친구 27(30−3), 일 27(30−3), 취향 19(20−1), 여행 스타일 19(20−1).
  - **검증 방법**: 저장소에 실제 퀴즈 답변이 담긴 목 세션 파일은 없어서(golden-screens.spec.ts는 브라우저를 직접 조작할 뿐 세션 JSON을 담고 있지 않음), 새로 목 데이터를 만드는 대신 `topics.ts`(실제 운영 설정)를 그대로 읽어 "서술형은 건너뛰고 나머지 필수 축은 첫 번째 선택지를 고른" 정상 완주 케이스를 코드로 구성해 방금 추가한 검증 로직에 직접 통과시켰습니다. 6개 주제 전부 완주 케이스는 통과, 완주보다 답변 1개 적은 케이스와 빈 답변(`{}`)은 차단됨을 확인했습니다.
  - **실행 순서**: 레이트리밋 예약(`reserveGenerationSlot`)보다 먼저 실행되어, 답변 없는 요청이 IP·전역 하루 카운터를 소모하지 않습니다. 캐시 조회(`getCachedGeneration`)보다도 먼저입니다 — 답변 없는 요청은 캐시에 있을 리 없어 Redis 왕복도 아낍니다.
  - **한계**: 완전한 방어는 아닙니다 — 결심한 공격자는 문항 수만큼 그럴듯한 답을 채운 JSON을 만들어 우회할 수 있습니다. 다만 빈 배열 하나로 끝나던 것보다는 봇이 만들어야 할 페이로드의 비용이 확실히 올라갑니다.
- **봇 방어 수단 검토 및 결정(2026-08-10)**: Vercel Hobby 플랜에서 코드 변경 없이 켤 수 있는 수단은 Attack Challenge Mode(대시보드 토글, 무료)와 WAF 커스텀 규칙(최대 3개, 요청 속도 제한 포함)입니다.
  - **Attack Challenge Mode는 지금 켜지 않기로 결정했습니다** — 켜두면 의심스러운 트래픽에 "사람인지 확인" 도전 페이지를 띄우는데, 판단 기준이 이 서비스의 실제 트래픽(로그인 없는 익명 사용, 모바일 유입 주력)과 안 맞으면 정상적인 모바일 사용자에게도 도전 페이지가 뜰 수 있습니다. 대신 **실제 공격이 관측되면 즉시 켤 수 있는 비상 스위치**로 남겨둡니다 — 대시보드 토글 한 번이라 코드 배포 없이 바로 적용 가능합니다.
  - **BotID(Vercel의 전용 봇 탐지 기능)는 2차 방어로 보류합니다** — Hobby에서도 기본 검사는 무료지만, 대시보드 토글만으로 끝나지 않고 클라이언트 컴포넌트 삽입 + 서버 라우트의 `checkBotId()` 호출까지 코드 변경이 필요합니다. 이번 PR의 답변 개수 검증(위 항목)으로 가장 값싼 공격 경로부터 먼저 막았으니, 효과를 지켜보면서 필요해지면 다음 단계로 검토합니다.
- 세션 시작(`registerSessionStart`, `/api/extract-nodes`) 한도만 여전히 인메모리입니다 — AI 호출 비용이 없는 가벼운 동작이라 의도적으로 남겨둔 것입니다.

## 생성 실패 진단 로그 (PR #132)

- 결과 생성이 실패하면 사용자에게는 항상 같은 문구("지금은 카드를 만들 수 없어요...")가 뜹니다 — 원인이 API 키 미설정/Redis 미설정/failure_limit 도달/스키마 검증 실패/응답 비어있음/Claude API 에러 중 무엇이든 화면상으로는 구분되지 않습니다(의도적 — 원인을 노출하면 공격자에게 내부 상태를 알려주는 셈이라 그대로 둠).
- 다만 서버 로그로는 구분 가능합니다 — `[ideal-type-generator]`/`[self-intro-generator]`/`[redis-client]`/`[rate-limit]` 접두어로 원인별 로그가 남습니다(검색어 목록은 PR #132 본문 참고). 개인정보(IP, 원본 세션 키, 프롬프트, 답변 내용)는 로그에 남기지 않습니다.

## 생성 소요 시간 계측 로그 (PR #199, `generation-timing.ts`)

- 결과 생성이 왜 느린지 원인을 조사할 목적으로 세 가지 로그 형식이 추가됐습니다(Vercel Runtime Logs에서 접두어로 검색 가능):
  - `[generation-timing:<topic>]` — AI 호출 1회(재시도 포함 각 시도)의 소요 시간·결과(성공/실패 종류)·effort 설정값·출력 토큰 수를 남깁니다(`logGenerationAttempt`).
  - `[api-timing:<topic>]` — API 라우트 전체 요청의 소요 시간·결과·캐시 히트 여부를 남깁니다(`logGenerationRequest`).
  - `[generation-marker:<topic>]` — 바로 위 "결과 생성 멱등 캐시" 항목의 마커 대기 결과(대기 후 캐시 사용/대기 시간 초과 후 새로 생성 등)와 대기 시간을 남깁니다(`logGenerationMarker`).
- 세 로그 전부 개인정보(IP, 세션 키, 프롬프트, 답변 내용)는 남기지 않고 숫자·상태값만 남깁니다.
- **주의: `generation-timing.ts` 66행 근처 주석이 "마커 대기 최대 90초"라고 설명하는데, 이는 PR #204로 실제 대기 상한이 45초로 줄어들기 전 기준이라 지금은 사실과 다릅니다.** 코드 동작 자체(45초)는 맞고, 주석 설명만 낡았습니다. 아래 "알려진 기술 부채" 참고.

## 결과 생성 대기 화면 타이밍 (PR #204, `GenerationProgress.tsx`)

- 대기 화면의 단계별 문구 전환 간격이 실측 최대 생성 시간(135초)에 맞춰 재조정됐습니다 — 5단계 × 27초(`STAGE_INTERVAL_MS`) = 135초로, 마지막 단계 문구가 실제로 가장 오래 걸리는 경우와 거의 동시에 끝나도록 계산된 값입니다.
- "시간이 오래 걸리고 있어요" 안내는 3분(`DELAYED_AFTER_MS`) 경과 후, 재시도 버튼은 4분(`RETRY_AFTER_MS`) 경과 후 노출됩니다.
- 화면 안내 문구는 **"보통 2~3분 정도 걸려요"**(`GENERATION_ESTIMATE_TEXT`)입니다. 이 값은 "2분 정도 걸려요" → "2분 30초 정도 걸려요"를 거쳐 **2026-08-09 PR #229**에서 범위 표현으로 다시 바뀌었습니다 — friendship(30문항) 실측 144초(effort=high) 하나만 확인된 상태에서, 주제마다 문항 수(20~38개)가 달라 실제 생성 시간도 다를 수 있다는 이유로 특정 숫자 대신 범위를 씁니다.

## CI / 브랜치 보호 · 머지 방식

- `.github/workflows/quality-gate.yml`("MAP Quality Gate")이 모든 PR에서 `typecheck`, `harness:check`, `design:check`, `build`를 순서대로 실행하며, GitHub의 필수 상태 체크로 등록되어 있습니다.
- **`.github/workflows/auto-merge.yml`("Guarded Auto Merge")은 설계상으로만 자동 머지고, 실제로는 작동하지 않습니다 — 2026-08-10 조사로 확인.** 아래 세 가지가 원인입니다.
  1. `auto-merge.yml`은 자신이 PR 이벤트를 직접 구독하지 않고, `workflow_run`(즉 `MAP Quality Gate`가 `completed`되는 것)에만 반응합니다.
  2. `quality-gate.yml`의 `pull_request` 트리거에는 `types`가 명시돼 있지 않아 GitHub 기본값(`opened`/`synchronize`/`reopened`)만 적용되고, **`ready_for_review`(Draft→Ready 전환)는 이 목록에 없습니다.**
  3. 이 저장소는 PR을 항상 Draft로 먼저 엽니다. PR을 열면(`opened`) Quality Gate가 한 번 돌고, 뒤이어 `auto-merge.yml`도 한 번 실행되지만 그 시점엔 아직 Draft라 "Skip merge for Draft pull requests" 단계에서 매번 스킵됩니다(`gh pr merge --squash` 단계의 실행 결과가 `skipped`로 찍힘). Draft를 Ready로 바꿔도 `ready_for_review`는 Quality Gate를 다시 돌리지 않으므로, `auto-merge.yml`이 다시 트리거될 방법이 없습니다.
  - **실측**: 최근 머지된 PR 10건(#236~#245) 전부의 GitHub Actions 실행 기록을 확인한 결과, `auto-merge.yml`의 머지 단계는 10건 전부 `skipped`였고, 10건 전부 `merged_by`가 오너 계정(`kwakhaeyong`)이었습니다(자동화 토큰이 머지했다면 `github-actions[bot]`으로 찍혔을 것). **자동 머지 워크플로가 실제로 머지를 수행한 사례는 지금까지 0건입니다.** main 히스토리가 `--squash`가 만드는 단일 커밋이 아니라 2-부모 병합 커밋(`Merge pull request #N from ...`) 형태인 것도 이 때문입니다 — 오너가 GitHub UI의 기본 "Merge pull request" 버튼을 직접 눌러 머지해온 것이 실제 경로입니다.
  - **이 문제를 고치지 않기로 결정했습니다.** Ready 전환 즉시(또는 그 직후 아무 트리거로든) 자동 머지가 실제로 작동하게 되면, "완료 보고 전까지 머지 금지"처럼 세션 안에서 거는 요청을 오너가 직접 지킬 방법이 없어집니다(검사만 통과하면 확인 없이 바로 반영되므로). 지금처럼 "고장난 채로 있어서" 오너가 매번 직접 Merge 버튼을 누르는 것이, 결과적으로 마지막 사람 검토 지점 역할을 하고 있습니다. 고치려면 `quality-gate.yml`의 `pull_request` 트리거에 `types: [opened, synchronize, reopened, ready_for_review]`를 추가하면 됩니다 — 이 조사에서는 워크플로 파일을 건드리지 않았으므로 이 사실만 기록해둡니다.
  - **정정(2026-08-10 재조사): 2026-08-09 PR #231의 커밋 2개 유실 사고는 이 자동 머지 문제와 무관합니다.** 이전 서술은 "자동 머지 도중 유실"이라고 잘못 적었습니다. 실제로는 PR #231도 오너가 직접 머지했고, 대응하는 Guarded Auto Merge 실행은 draft 판정으로 스킵됐습니다(Actions 로그로 확인). 진짜 원인과 재발 방지 규칙은 아래 "머지된 브랜치 재사용 금지" 항목과 `CLAUDE.md` 참고.
  - **자동 머지를 다시 살릴 경우 먼저 확인할 것: 저장소 설정(`Settings → General → Pull Requests`)의 "Allow squash merging" 체크 여부.** 이번 조사에서 사용한 GitHub MCP 도구로는 이 설정을 조회할 방법이 없었습니다(저장소 설정을 읽는 도구 자체가 없음) — 꺼져 있으면 `gh pr merge --squash`가 (Draft가 아닌 상태에서) 실행될 때마다 실패하게 됩니다. 오너가 웹에서 직접 확인해야 합니다.
- `main`은 PR을 통해서만 반영됩니다.

## 머지된 브랜치 재사용 금지 (2026-08-09 PR #231 커밋 유실 사고 — 원인 재조사)

- **2026-08-10 재조사로 원인이 정정됐습니다.** 이전에는 "자동 머지 도중 유실"로 알려졌으나, 실제로는 자동 머지와 무관합니다. PR #231도 오너가 직접 머지했고(`merged_by: kwakhaeyong`, 2-부모 병합 커밋), 대응하는 Guarded Auto Merge 실행은 PR이 아직 Draft라는 이유로 스킵됐습니다(Actions 로그로 직접 확인).
- **진짜 원인**: `feat/friendship-card-status-label` 브랜치에는 순서대로 커밋 4개(`a011757`→`f089337`→`4f641e9`→`71254ad`)가 푸시됐습니다. PR #231은 08:03:06에 `f089337`까지만(첫 2개) 머지됐는데, 나머지 2개는 그 **이후**에 같은 브랜치에 이어붙여졌습니다 — `4f641e9`는 머지 11분 36초 뒤, `71254ad`는 2시간 13분 뒤. `git merge-base --is-ancestor`로 `4f641e9`의 부모가 정확히 `f089337`(머지 시점의 head)임을 확인했습니다. 즉 **이미 머지되어 닫힌 PR의 브랜치에 후속 작업을 계속 얹은 것**이 원인이며, 그 시점부터는 어떤 PR도 그 브랜치를 지켜보고 있지 않아 두 커밋 다 어떤 검사도 받지 못하고 고립됐습니다.
- PR #233은 이 2개 커밋을 최신 main 위에 `git cherry-pick`으로 재적용해 복구했습니다 — `git diff`와 `git patch-id`로 직접 대조한 결과 원본과 **내용이 100% 동일**함을 확인했습니다(커밋 해시만 부모가 달라져 바뀌었을 뿐).
- **재발 방지 규칙은 `CLAUDE.md`의 "머지된 브랜치 재사용 금지" 참고.**
- 그 외 워크플로: `.github/workflows/daily-limit-alert.yml`(30분마다 전체 하루 생성 상한 임박 여부 확인), `.github/workflows/health-check.yml`(1시간마다 프로덕션 단순 응답 확인), `.github/workflows/production-smoke.yml`(main 푸시·머지 직후 + 6시간마다 더 폭넓은 프로덕션 확인, 실패 시 GitHub 이슈 자동 생성).

## 배포 · 모니터링

- `main`에 머지되면 Vercel이 자동으로 프로덕션(`mapdecision.com`, Vercel 프로젝트 `map-mvp-46zk`)에 배포합니다.
- **career를 제외한 6개 결과 생성 라우트에 `export const maxDuration = 300;`이 명시돼 있습니다**(PR #202 후속 수정, `vercel.json`은 여전히 없고 각 `route.ts` 파일에 직접 선언). career의 `/api/generate-result`에는 없습니다. 오너 확인에 따르면 프로덕션 Vercel 프로젝트의 **Fluid Compute가 켜져 있어**, Hobby 플랜에서도 이 300초 값이 실제로 적용됩니다(Fluid Compute 없이는 Hobby 플랜 기본 상한이 더 짧아 이 값이 그대로 적용되지 않을 수 있음).
- **오너 확인에 따르면 Vercel Function Region은 `iad1`(미국 동부)인데 Upstash Redis는 도쿄 리전입니다.** 결과 생성 중 레이트리밋·캐시·마커 확인마다 태평양을 왕복하는 셈이지만, 생성 자체가 100초 넘게 걸리는 것에 비하면 이 왕복 지연은 작은 비중이라 우선순위 낮은 항목으로 둡니다.
- `.github/workflows/production-smoke.yml`이 `main` 푸시·머지 직후·6시간마다 프로덕션 정상 응답을 확인하고, 실패 시 GitHub 이슈를 자동 생성합니다.
- 이 개발 샌드박스는 네트워크 프록시로 `mapdecision.com`에 직접 접근이 막혀 있어, 배포 확인은 GitHub Actions 결과(간접 증거)로만 합니다.

## 프로덕션 실측 데이터 (오너 확인, 이 저장소 안에서는 직접 측정 불가)

아래는 코드로 확인 가능한 사실이 아니라 오너가 프로덕션에서 직접 관찰해 알려준 값입니다 — 코드가 바뀌면 달라질 수 있고, 이 저장소만 보고는 재현·검증할 수 없습니다.

- **결과 생성 소요 시간은 실제로 100~135초입니다.** 주제별로 유의미한 차이는 없었습니다(취향 104초·133초, 여행 101초 관찰). 반면 랜딩 화면(`Landing.tsx`)의 `TOPIC_META`가 보여주는 문항별 소요 시간 표시는 여전히 "문항당 대략 14~15초"라는 추정치이고, 이 실측된 생성 대기 시간은 전혀 포함하지 않습니다 — 즉 랜딩에 뜨는 예상 소요 시간과 실제 체감 시간(문항 응답 + 100초 이상 생성 대기) 사이에 차이가 있습니다.
- **`ANTHROPIC_GENERATION_EFFORT` 환경변수의 프로덕션 값은 `high`입니다.** `generation-config.ts`의 코드 기본값(`DEFAULT_GENERATION_EFFORT`)은 `medium`이라 — 환경변수가 명시적으로 설정돼 있어 실제로는 코드 기본값보다 한 단계 높은 effort로 생성되고 있습니다.
- **2026-08-10 실측(프로덕션, 폰): 생성 대기 중 앱을 3분간 떠났다가 복귀 → 결과가 그대로 표시됨.** 탭 폐기가 일어나지 않았고, fetch가 백그라운드에서 그대로 완료된 것으로 보입니다. 즉 "대기 중 이탈로 인한 데이터 손실·불필요한 재생성 비용" 시나리오(위 "결과 생성 멱등 캐시"의 "대기 화면 재개 문구" 항목이 대비하던 상황)는 이번 실측에서는 확인되지 않았습니다. 다만 탭 폐기는 기기 성능·동시 실행 앱 수·OS 메모리 압박 정도에 따라 갈리는 조건부 현상이라, 이번 실측 1건으로 "이 문제가 없다"고 일반화할 수는 없습니다 — 저사양 기기나 메모리 압박이 심한 상황에서는 여전히 일어날 수 있습니다. 대기 화면 재개 문구(PR #244)는 그런 상황에 대한 대비로 그대로 유지하되, 이 방향에는 추가 투자를 하지 않기로 했습니다. 이 시나리오와 관련해 남은 문제는 최초 대기 144초 자체의 체감 길이 하나로 좁혀집니다(아래 "다음 액션" 참고).

## 열려 있는 Draft PR

이전 갱신까지 여기 남아있던 #136·#137은 각각 `7bccc6d`(PR #136 머지 커밋), `04e5a95`(PR #137 머지 커밋)로 이미 오래전에 main에 머지됐습니다 — git 로그로 확인. 이번 갱신 시점(2026-08-09) 기준으로 GitHub에 열려 있는 PR은 0건입니다(이 문서를 갱신하는 이번 PR 자체는 제외) — API로 확인.

## 알려진 기술 부채

1. **`design:check`의 `KNOWN_OPACITY_DEBT`에 등록된 기존 raw opacity 위반이 아직 남아있습니다** (`scripts/design-check.mjs`) — `TopicQuiz.tsx`(2건), `Conversation.tsx`(4건), `FinalResultBlocks.tsx`(1건), `Landing.tsx`(2건), `components/ui/primitives.tsx`(3건). 새 위반은 게이트가 막지만, 이 목록에 있는 기존 위반은 통과합니다. 목록에서 항목이 빠지는 것 자체가 "고쳤다"는 뜻이 되도록 설계돼 있습니다.
2. **생성 실패 6가지 원인이 사용자에게는 전부 같은 문구로 보입니다.** PR #132로 서버 로그는 원인별로 구분되게 됐지만(위 항목 참고), 사용자 화면 문구 자체는 의도적으로 그대로입니다.
3. **`/api/share`가 클라이언트가 보낸 `result`를 형태(shape)만 검증하고 그대로 저장합니다** (`share-validation.ts`의 `validateSharePayload` → `SUPPORTED_SHARE_TOPICS[topicId](result)`는 타입·필드 존재 여부만 확인하는 구조 검증기이지, 내용이 실제로 AI가 생성한 것인지는 확인하지 않습니다). 즉 구조만 맞으면 임의의 텍스트를 담아 공유 링크를 만들 수 있습니다.
4. ~~어떤 API 라우트에도 Vercel `maxDuration`이 지정돼 있지 않습니다.~~ **해소됨 — PR #202 후속 수정으로 career를 제외한 6개 결과 생성 라우트에 `maxDuration = 300`이 명시됐고, 오너 확인으로 Fluid Compute가 켜져 있어 이 값이 실제로 적용됨을 확인했습니다. 위 "배포·모니터링" 참고.**
5. **`Conversation.tsx`(진로 대화 중 화면)에 방사형 지도(`MapCanvas`)가 3곳 남아있습니다.** 결과 화면(`Result.tsx`)의 지도는 PR #121로 제거됐지만, 대화 진행 중 화면 자체는 범위 밖이었습니다.
6. **결과 레이아웃이 주제마다 병렬 구현입니다.** 공통 추상화가 없어, 주제가 늘어날수록 같은 종류의 파일(제너레이터·결과 블록·카드 컴포넌트)이 반복해서 생깁니다.
7. ~~PR #135의 락 제거가 아직 main에 반영되지 않았습니다.~~ **해소됨 — PR #136이 머지되어(커밋 `7bccc6d`) 락 코드가 제거됐습니다.**
8. **Vercel Function Region(`iad1`, 미국 동부)과 Upstash Redis(도쿄) 리전이 서로 다릅니다.** 위 "배포·모니터링" 참고 — 생성 소요 시간(100초 이상) 대비 왕복 지연 비중이 작아 지금은 우선순위 낮음으로 둡니다.
9. **`generation-timing.ts` 66행 근처 주석이 마커 최대 대기 시간을 "90초"라고 설명해 실제 코드 동작(45초, PR #204)과 어긋납니다.** 코드 동작 자체는 정상이고 주석 설명만 낡았습니다.
10. **저장된 세션이 있는 재방문자는 새로고침 시 랜딩(주제 선택) 화면이 460~930ms 동안 잘못 보였다가 실제 화면으로 바뀝니다(2026-08-10 조사).** `MapDecisionProduct.tsx`가 SSR에서 `createLandingSession()`으로 항상 랜딩을 먼저 그린 뒤, 하이드레이션이 끝나고 나서야 `useEffect`가 `localStorage`를 읽어 실제 `stage`로 바꾸기 때문입니다 — 서버는 브라우저의 `localStorage` 내용을 알 수 없어 구조적으로 피할 수 없는 순서입니다. Playwright로 실측한 결과 병목은 `localStorage` 읽기(마이크로초 단위)가 아니라 **JS 번들 다운로드·파싱·실행(하이드레이션) 동안 메인 스레드가 점유돼 있는 시간**입니다 — 스켈레톤을 넣어도 이 점유 시간 자체는 줄지 않습니다. `/r/{id}` 공유 화면은 서버 컴포넌트(`force-dynamic`)로 Redis에서 직접 읽어 완성된 HTML을 내려주므로 이 문제가 없습니다(27ms 첫 프레임부터 화면이 바뀌지 않음을 실측 확인) — 공유받은 사람은 이 깜빡임을 겪지 않습니다.
    - **검토한 해결안**: 이미 있는 `hydrated` 플래그(현재는 저장·히스토리 초기화에만 쓰임)를 렌더링 게이트로 재사용해, 하이드레이션이 끝나기 전에는 스켈레톤을 보여주는 방법. 기존 상태를 재사용해 변경 범위가 작고, 서버·클라이언트 첫 렌더가 항상 동일(`hydrated=false`)해 SSR 불일치가 없습니다.
    - **지금은 고치지 않기로 결정했습니다.** 저장된 세션이 없는 신규 방문자는 지금 이 깜빡임이 전혀 없는데(랜딩이 처음부터 정답이므로), `hydrated` 게이트를 걸면 이 신규 방문자에게도 "스켈레톤 → 랜딩" 전환이 새로 생깁니다. 홍보로 신규 유입이 트래픽의 큰 비중을 차지할 단계에서, 신규 방문자에게 없던 손해를 주는 거래는 맞지 않다고 판단했습니다.
    - **재검토 조건**: 재방문율이 유의미해지거나(신규 방문자 대비 이 깜빡임을 겪는 재방문자 비중이 커지거나), 번들 크기를 줄여 하이드레이션 시간 자체가 짧아졌을 때(스켈레톤을 넣더라도 그 노출 시간이 짧아져 신규 방문자 쪽 손해도 함께 줄어듦).

## 발견된 죽은 코드

2026-08-06 문서 노후화 점검 중 코드로 확인한, 실행되지 않는 코드 목록입니다. 2026-08-07에 이 중 세 가지(`entryChips`, `IconButton`/`Input`/`Modal`, `VoiceProvider` 타입)는 사전 조사로 참조·실행 경로가 0건임을 재확인한 뒤 실제로 삭제됐습니다(PR #205) — 아래 목록에서도 그에 맞춰 갱신했습니다. 나머지(`DecisionStep`, `progressHint`, `quizDepth` 배선)는 이번에도 의도적으로 삭제 범위에서 제외됐습니다.

1. **`TopicQuiz.tsx`의 `DecisionStep`(심화 갈림길 화면)** — `resolvePhase()`가 `optionalAxes.length === 0`이면 `kind: "decision"`을 절대 반환하지 않도록 짜여 있는데, 지금 6개 완성형 퀴즈 주제 전부 `optionalAxes`가 항상 빈 배열입니다(심화 구간 전면 폐지). 즉 `DecisionStep`을 렌더링하는 분기 자체에 도달할 방법이 없습니다. **PR #205에서도 삭제 범위에서 제외됐습니다** — 향후 주제별로 문항 길이를 필수/심화 두 단계로 다시 나누는 전략을 쓸 가능성이 있어, 그때 재사용할 수 있다는 이유로 보류 중입니다.
2. **`TopicQuiz.tsx`의 `progressHint`** — `phase.kind === "required" && phase.index === 0 && optionalAxes.length > 0`일 때만 값이 채워지는데, 위와 같은 이유로 이 조건이 항상 거짓이라 `progressHint`는 항상 `null`이고 화면에도 그려지지 않습니다.
3. ~~`topics.ts`의 `entryChips` 필드~~ **삭제됨(PR #205)** — 7개 주제 전부에서 타입 정의와 값이 함께 제거됐습니다. 형제 필드 `entryQuestion`은 `session.ts`에서 실제로 쓰이고 있어 그대로 남아있습니다.
4. **`TopicQuiz.tsx`의 `DEPTH_FIELD_BY_TOPIC`와 `MapSession.idealTypeQuizDepth`/`selfIntroQuizDepth`** — 심화 완료 시 이 값을 `"deep"`으로 기록하는 코드(closing 단계의 `if (optionalAxes.length > 0 && depthField)` 분기)가 있지만, 위 1번과 같은 이유로 `optionalAxes.length`가 항상 0이라 이 분기도 절대 실행되지 않습니다. 이 값은 `IdealTypeCard.tsx`·`SelfIntroCard.tsx`를 거쳐 `/api/share`까지 그대로 실려가 `share-store.ts`에 저장되는 구조라 배선 자체는 넓게 퍼져 있는데, 지금 이 시점 이후로 새로 만들어지는 값은 항상 `undefined`만 가능합니다. **완전한 죽은 코드는 아닙니다** — 심화 구간이 있던 시절(폐지 이전)에 만들어진 기존 공유 링크는 90일 TTL이 끝나기 전까지 `quizDepth: "deep"`를 여전히 들고 있을 수 있고, `app/r/[id]/page.tsx`의 "심층 분석 포함" 배지(224행·264행)는 그런 옛 링크에 대해서는 지금도 실제로 그려집니다. **PR #205도 이 배선은 삭제 범위에서 제외했습니다** — 과거 공유 데이터의 TTL이 만료될 때까지는 이 배선을 유지해야 하기 때문입니다.
5. `TopicQuiz.tsx` 795~797행의 주석("둘 다 심화 경로를 없애 optionalAxes가 항상 빈 배열이라... 지금은 이상형·나 소개 둘 다")도 이번 점검에서 같이 발견된 문서 노후화입니다 — 지금은 이상형·나 소개만이 아니라 6개 완성형 주제 전부가 이 상태입니다. 이 주석은 파일 상단이 아니라 함수 내부 주석이라 이번 정리 대상(코드 파일 "상단" 설명 주석)에서는 빠졌습니다. (2026-08-07 재확인 — 아직 남아있습니다.)
6. ~~`ui/primitives.tsx`의 `IconButton`·`Input`·`Modal` 컴포넌트, `types/index.ts`의 `VoiceProvider` 타입~~ **삭제됨(PR #205)** — 어디서도 쓰이지 않음을 확인 후 제거했습니다. 같은 파일의 다른 export(`Button`, `Card`, `Badge` 등)와 형제 타입 `VoiceProviderState`(`voice/use-web-speech.ts`에서 실제 사용)는 그대로 남아있습니다.
7. ~~`public/showcases/`(이미지 20개 + README.md), `src/map-decision-v1/engine/integration-providers.ts`, `design-tokens.css`의 `--color-primary-foreground-strong`·`--color-primary-foreground-wash-strong`~~ **삭제됨(2026-08-10)** — 전수 grep으로 코드·문서 어디서도 참조되지 않음을 확인한 뒤 제거했습니다. `public/showcases/`를 참조한다던 `docs/CAREER_MAP_SHOWCASE.md`는 이미 스스로 "참조 없음"이라고 정정해 둔 상태였습니다. `integration-providers.ts`는 어디서도 import되지 않았고, 두 CSS 토큰은 원래 있던 "자기성찰 다크 블록"이 흰 카드 디자인으로 바뀌며 쓰임을 잃었습니다(형제 토큰 `-soft`·`-wash`는 `TopicQuiz.tsx`가 실제로 쓰고 있어 남겨뒀습니다). 전부 git 히스토리로 복원 가능합니다.

## 오늘(7/31) 머지된 PR 요약 (그 날짜 기준 기록, 그 이후 갱신되지 않음)

- **#131** — 태그 4축(다중 선택, 최대 3개) 중 1순위가 공유 태그를 결정한다는 규칙을 AI 프롬프트(이상형·나소개 SYSTEM_PROMPT)에 명시. 문항·태그 계산 로직은 변경 없음.
- **#132** — 생성 실패 6종 원인에 서버 로그 추가(위 항목 참고). 사용자 문구 변경 없음.
- **#133** — 궁합 비교가 태그 4축 전부 있을 때만 성립하도록 수정, 비교 불가 안내 문구를 원인 단정 없는 중립 표현으로 교체(위 "이상형·나소개 MAP" 항목 참고).
- **#134** — 결과 타이틀·나소개 패턴 블록의 어휘/구조 수렴 문제를 프롬프트로 완화, PR #131이 만든 "1순위" 표현 지시 충돌 해소. 문항·스키마 변경 없음.
- **#135** — 결과 생성 멱등 캐시 도입(위 항목 참고). ★단 락 코드가 포함된 채로 머지됐고, 제거 PR(#136)은 아직 미병합.

이 5개 PR 전부 공통으로: 실제 AI 출력 품질(타이틀 다양성 개선, 1순위 표현 규칙 준수 여부 등)은 이 개발 샌드박스에 `ANTHROPIC_API_KEY`가 없어 검증하지 못했습니다 — 오너가 프로덕션에서 직접 확인해야 합니다.

## 코드 외 확인 필요 (이 저장소 안에서는 확인 불가)

- `ANTHROPIC_API_KEY`가 Vercel Preview 환경에도 스코프돼 있는지
- Upstash Redis 요금제의 정확한 명령 한도
- 오늘 머지된 프롬프트 변경(#131, #134)이 실제 AI 출력에서 의도한 효과(1순위 표현 규칙 준수, 타이틀/패턴 다양성)를 내는지
- 테스터 피드백, 프로덕션 실사용 데이터

## 오늘(8/6) 진행된 작업

- **travelStyle 결과를 6블록에서 4블록으로 재설계**(discovery/matrix/fit/roadmap) — 스키마·생성기(PR #183), 결과 화면(PR #186).
- **6개 완성형 주제 전부에 "블록 간 반복 금지" 지시 추가** — taste(PR #187), friendship·work·selfIntro(PR #188), idealType(PR #189). travelStyle은 애초 4블록 재설계(PR #183) 때 같이 반영됨.
- **6개 주제 전부의 생성기에 재해석 축 명시**(자기인식·바람 vs 실제 답변 사이 간극을 어디서 다뤄야 하는지 프롬프트에 못박음). idealType은 이번에 세 쌍(화해 방식/구애 방식/갈등 대처)을 신규로 추가(PR #189). 다만 **selfIntro는 다른 다섯 주제와 달리 "★핵심/가장 중요한 재해석★"으로 이름 붙인 전용 축이 없습니다** — SYSTEM_PROMPT 안에서 태그 4축의 1순위와 다른 결론을 낼 때 간극을 드러내라는 지시(22행)로만 다뤄집니다. "여섯 주제 전부"라는 표현은 이 차이를 뭉뚱그리지 않도록, 정확히는 "다섯 주제는 전용 재해석 축 라벨이 있고 selfIntro는 더 느슨한 형태로 같은 역할을 한다"로 이해해야 합니다.
- **selfReflection의 awareness 계열 필드 재정의** — 필드 이름(`awareness`, `whatYouOffer`, `strengths` 등) 자체는 이전부터 있었고 바뀌지 않았습니다. 오늘 바뀐 것은 이 필드가 "무엇을 써야 하는지"에 대한 프롬프트 설명입니다 — 반복 금지 지시(위 항목)의 일부로, patterns/attractionPatterns 블록에서 이미 다룬 결을 selfReflection 계열 필드에서 같은 근거로 반복하지 말라고 못박았습니다.
- **랜딩 개편** — 헤드라인, 카드를 질문형 문구로 교체, 문항 수/소요 시간 표시 추가, 이모지 제거, "30초 체험" 카피 제거(PR #185, #190, 후속 카드 문구 교체 커밋).
- **태그 8개 교체** — travelStyle의 `#즉흥형`→`#무계획형`(PR #184, 생성기의 재해석이 "즉흥이 아니라 위임"이라고 결론 낼 수 있어 태그와 모순되던 것을 해소) + taste·work·friendship 등 7개 태그를 오독 위험 때문에 교체(PR #191: `#선행형`→`#사전완료형`, `#나눔형`→`#털어놓기형`, `#나눔바람형`→`#털어놓기바람형`, `#순응형`→`#페이스맞춤형`, `#혼자정리형`→`#감정삭임형`, `#몰입형`→`#몰아치기형`, `#외곬형`→`#깊이파는형`). 카테고리 4개·태그 64개 구조는 그대로 유지됨. taste-generator.ts의 재해석 문구도 같은 PR에서 "자기 이미지를 정체성 차원에서 부정하지 말라"는 방향으로 순화됨.
- **결과 화면 "반복되는 패턴" 블록의 따옴표 겹침 수정** — 6개 주제 전부(PR #182).

## 오늘(8/7) 머지된 PR 요약 (그 날짜 기준 기록, 그 이후 갱신되지 않음)

- **#194** — 결과 화면 상단 목차(SectionNav) 전부 제거. 해시 링크(`<a href="#id">`) 클릭이 `MapDecisionProduct.tsx`의 `popstate` 핸들러와 충돌해 결과 화면 밖으로 튕겨나가는 버그가 원인. 이상형·나소개·친구·일·취향·career 6개 결과 화면에서 목차 칩과 대상 id·scroll-mt를 제거(travelStyle은 이미 제거돼 있었음).
- **#195** — 브랜드 컬러 팔레트를 보라·네이비에서 오프화이트/먹색/청록으로 교체, 대비 미달이던 `text-muted` 색상값(`#8a8a86`→`#6e6e6a`, 대비 3.29:1→4.86:1)도 같이 수정.
- **#196** — 랜딩 히어로에서 "MAP Decision" 브랜드명이 헤더·히어로 두 곳에 중복 노출되던 것을 히어로 쪽 kicker 제거로 해소, 서브 카피를 "답한 나와 행동하는 나, 그 차이를 봅니다"로 교체, 헤드라인 줄바꿈을 모바일/데스크톱 반응형으로 조정.
- **#197** — travel-generator.ts의 핵심 재해석 (1) 문구를 "실제로는 그런 사람이 아니다" 류의 정체성 부정 표현에서 상황적 차이를 짚는 표현으로 순화(태그와 본문 결론이 정면 충돌하던 프로덕션 사례 대응, taste-generator.ts를 PR #191에서 고친 것과 같은 방향).
- **#198** — 주제 선택 화면 섹션 라벨을 "가볍게, 빠르게"/"차근차근, 깊이 있게"(소요 방식 중심)에서 "내가 어떤 사람인지"/"무엇을 결정해야 할지"(결과물 중심)로 교체, 각 라벨 옆에 주제 개수 배지 추가(`VIRAL_TOPIC_IDS`/`DEPTH_TOPIC_IDS` 배열 길이 기반, 주제가 늘거나 줄어도 자동으로 맞음). 이후 두 섹션에 배지가 나란히 있으면 "1개"인 둘째 섹션이 미완성 구역처럼 보인다는 이유로 `showCount` prop을 추가해 첫 섹션에만 배지를 남김.
- **#199** — 결과 생성 소요 시간 계측 로그 추가(`generation-timing.ts` 신설, 위 "생성 소요 시간 계측 로그" 항목 참고). 프롬프트·스키마·max_tokens·effort·재시도 횟수 등 로직은 전혀 바꾸지 않음. career는 범위 제외.
- **#200** — 결과 화면 로드맵 블록을 체크리스트 느낌으로 개선(제목 "로드맵"→"이제 해볼 것", 항목 앞 가운뎃점을 인라인 SVG 체크박스 아이콘으로 교체). 같은 PR 안에서 제목을 다시 "다음 행동"으로 조정하고 `TopicQuiz.tsx`의 `RESULT_BLOCK_PREVIEW`도 맞춰 갱신.
- **#201** — 주제 선택 화면 진로(career) 카드에도 다른 6개 카드처럼 질문형 설명 문구 추가(`TOPIC_HOOK`에 career 항목 추가, `topics.ts`의 `oneLiner` 원문은 그대로 유지하고 폴백 방식 유지).
- **#202** — 같은 세션의 결과 생성 중복 실행 방지(위 "결과 생성 멱등 캐시" 항목의 마커 부분 참고). 후속 수정으로 마커 최대 대기를 90초에서 45초로 줄이고, career를 제외한 6개 생성 라우트에 `maxDuration = 300`을 명시(대기+생성 최악 케이스가 Vercel 함수 시간제한을 넘길 위험 방지).
- **#203** — 결과 화면 목차를 해시 없는 `<button>` + `ref` + `scrollIntoView` 방식으로 복원(위 "결과 화면 레이아웃" 항목 참고). #194가 제거한 지 하루 안에 다른 구조로 되살아남. career는 범위 제외, 6개 ResultBlocks 파일 모두 `"use client"`가 새로 필요해짐.
- **#204** — 결과 생성 대기 화면 문구·타이밍을 실측 생성 시간(100~135초)에 맞춤(위 "결과 생성 대기 화면 타이밍" 항목 참고).
- **#205** — 참조·실행 경로가 0건임을 확인한 죽은 코드 세 가지 삭제: `topics.ts`의 `entryChips` 필드, `ui/primitives.tsx`의 `IconButton`·`Input`·`Modal` 컴포넌트, `types/index.ts`의 `VoiceProvider` 타입(위 "발견된 죽은 코드" 항목 참고). `DecisionStep`·`progressHint`·`quizDepth` 배선은 이번 범위에서 의도적으로 제외.

이 12개 PR 전부 공통으로: 실제 AI 출력 품질(재해석 문구 순화가 실제 생성 결과에 미치는 효과 등)과 화면 시각 품질(색상 교체, 배지 레이아웃 등)은 이 개발 샌드박스에서 완전히 검증하지 못했습니다 — `ANTHROPIC_API_KEY` 부재, 프로덕션 도메인 접근 차단이 이유입니다.

## 오늘(8/9) 머지된 PR 요약 (그 날짜 기준 기록, 그 이후 갱신되지 않음)

- **#227** — friendship 생성기의 selfReflection `whatToImprove`를 2개→3개로 늘림(`whatYouOffer`는 2개 유지). SYSTEM_PROMPT 문구만 수정, 스키마·문항 변경 없음.
- **#228** — #227과 같은 "한쪽 2개·다른 쪽 3개" 비대칭을 idealType·selfIntro·taste·work 4개 생성기에 동일 적용(위 "결과 화면 레이아웃" 참고). travelStyle은 selfReflection 블록 자체가 없어 제외.
- **#229** — 생성 대기 화면 안내 문구를 "2분 30초 정도"에서 "2~3분 정도"(범위 표현)로 변경(위 "결과 생성 대기 화면 타이밍" 참고).
- **#230** — `rate-limit.ts`에 세션 키(`session.startedAt`) 위조로 세션당 생성 한도를 우회할 수 있다는 점, CGNAT 환경에서 IP 기반 한도가 무관한 사용자를 함께 차단할 수 있다는 점을 코드 주석으로 기록(위 "레이트리밋" 참고). 코드 로직 변경 없음.
- **#231** — 공유 카드(card.png)에 `statusLabel` 존을 신설하고 6개 완성형 퀴즈 주제 전부로 확장, 레이아웃 존 높이 재조정(위 "결과 화면 레이아웃" 참고).
- **#232** — selfIntro 생성기 SYSTEM_PROMPT의 patterns/matrix/selfReflection 예시 문구에서 "일" 맥락 3곳 제거(테스터 피드백 "내 소개인데 왜 일할 때가 나와?" 대응).
- **#233** — #231이 머지된 뒤에도 같은 브랜치에 이어붙여 반영되지 못했던 마지막 2개 커밋을 새 PR로 복구(자동 머지와 무관 — 위 "머지된 브랜치 재사용 금지" 참고).
- **#234** — selfIntro에서 직장 전제 문항 4개(workDeadline·workMistake·reflectionWorkMistake·workTeam) 제거, 직업 무관 문항 2개(experienceMistake·reflectionMistake) 추가. 필수 문항 수 36→34, `quizVersion` 2→4. 태그 4축·`work` 주제(별도 topicId)는 손대지 않음.
- **#235** — selfIntro 생성기 SYSTEM_PROMPT에 남아있던 "동료"(문항 구성 설명 문장)·"일할 때"(patterns/matrix 개요 문단) 잔여 언급 정리. 30행의 모더레이션 지침("직장·연애·감정에 대한 솔직한 서술은 배제 대상이 아니다")은 그대로 유지.
- **#236** — 주제 선택 뒤 프로필 입력 화면 신설(위 "주제 선택 뒤 프로필 입력 화면" 참고). 후속 커밋으로 나이 선택지를 "14세 미만/10대/20대/30대/40대 이상" 5단계로 정리하고, work+학생 조합일 때 다른 주제를 고를지 묻는 안내를 추가.

이 10개 PR 전부 공통으로: 실제 AI 출력 품질(selfReflection 문구·개수 변경이 실제 생성 결과에 미치는 효과 등)과 화면 시각 품질(프로필 화면·상태 라벨 레이아웃 등)은 이 개발 샌드박스에서 완전히 검증하지 못했습니다 — `ANTHROPIC_API_KEY` 부재, 프로덕션 도메인 접근 차단이 이유입니다.

## 오늘(8/11) 진행된 작업

- **work 주제 `experienceStressResponse` 문항 업무 맥락 교체(커밋 `6099f32`)** — "일할 때의 나"(work) 주제에 나 소개(selfIntro)의 사적 인간관계 문항("가까운 사람과 갈등이 있을 때...")이 지문·선택지 그대로 복사돼 있던 문제를 외부 검토로 지적받아 수정했습니다. 축 구조(직면/내면화/거리두기/공유 네 갈래)·`id`·`type`·`required`·문항 순서는 그대로 유지하고 질문·선택지 4개만 업무 갈등/압박 맥락으로 바꿨습니다. 라벨 문자열이 selfIntro·friendship과 더 이상 같지 않아, 태그(`ideal-type-tags.ts`의 `conflictPattern.mapping`)와 상태 라벨(`WORK_STATUS_LABELS`)에 work 전용 항목 4개를 새로 등록해 연결했습니다(기존 selfIntro·friendship 전용 항목은 그대로 둬서 영향 없음). work 답변 개수 검증 임계값(27)은 문항 개수가 바뀌지 않아 그대로입니다.
- **주제를 바꿔도 이전 결과가 지워지지 않게 수정(커밋 `a3c8d97`)** — `MapDecisionProduct.tsx`의 `start()`가 `createSession(topicId)`로 완전히 새 세션을 만들면서, 두 번째 주제를 시작하는 순간(완료 전에도) 첫 번째 주제의 결과가 `localStorage`에서 사라지던 문제를 고쳤습니다. `MapSession` 타입 자체는 6개 완성형 주제 결과를 서로 다른 필드로 동시에 담을 수 있게 이미 설계돼 있었는데, 세션을 새로 만드는 코드가 그 필드들을 이어받지 않았을 뿐이었습니다. `engine/session.ts`의 `createSession()`에 `previousSession` 파라미터를 추가하고 `preserveCompletedResults()`가 이전 세션에서 "완료된 결과 본문(`*Result`)·서명(`*ResultSignature`)·심화 배지(`*QuizDepth`)"만 골라 새 세션에 이어붙입니다 — `messages`/`nodes`/`quizAnswers`/`quizStep`/`profile`은 그대로 리셋됩니다(profile을 승계하지 않는 기존 결정은 유지 — 주제마다 맥락이 달라 프로필을 새로 묻는 게 의도된 설계).
- **결과 화면 하단 "다음 MAP 유도" 블록 추가(커밋 `51c60a9`, `NextMapPrompt.tsx` 신설)** — 결과를 본 뒤 끝나던 흐름에 두 번째 주제로 넘어가는 동선을 만들었습니다. 6개 완성형 주제 결과 화면(`*Card.tsx`) 전부에서 같은 위치("너도 만들어봐" 버튼과 정책 링크 사이)에 공통으로 삽입됩니다. `Landing.tsx`에서 이 컴포넌트가 재사용할 수 있도록 `VIRAL_TOPIC_IDS`·`TOPIC_HOOK`·`TOPIC_META`를 모듈 비공개 상수에서 export로 바꿨습니다 — 이 세 값은 지금 `NextMapPrompt.tsx`와 `Landing.tsx` 둘 다의 공유 소스입니다(아래 FIRST CLICK MVP 항목에서 이 배열을 건드리지 않은 이유 참고).

## FIRST CLICK MVP — 랜딩 히어로를 "취향" 대표 콘텐츠로 재구성 (브랜치 `claude/map-mvp-first-click-mvp`)

**2026-08-11 갱신: 아래 절의 Hero 구조(헤드라인 "나도 모르는 내 취향은?" → teaser → CTA 버튼 → microcopy)는 이후 FIRST ACTION MVP(같은 브랜치, 이 문서 아래 절 참고)로 대체됐습니다 — CTA를 누르고 나서 문항을 시작하는 방식에서, 히어로 자체가 실제 Q1이 되는 방식으로 바뀌었습니다. 애널리틱스 4개 이벤트 정의 중 `topic_select`·`quiz_start`의 taste 관련 서술도 아래 FIRST ACTION MVP 절의 내용으로 갱신됐습니다(`quiz_complete`·`result_view`는 그대로 유효). 이 절은 "히어로가 CTA 기반이었다가 실제 Q1 기반으로 바뀌었다"는 변경 이력 기록으로 남겨두고, 실제 하위 절은 지우지 않습니다.**

- **목적**: 랜딩에 처음 들어온 사람이 "MAP이 뭔지 이해"하는 것보다, 취향 MAP을 한 번 눌러보고 싶어지는 것을 목표로 랜딩 히어로를 재구성했습니다. 6개 주제 중 취향(taste)을 대표 콘텐츠로 골라 히어로에 크게 노출하고, 그 외 5개는 "다른 MAP" 그리드로 아래에 배치했습니다.
- **`Landing.tsx` 히어로 변경**: 기존에는 헤드라인 "16개 유형에 넣지 않아요" 하나와 서브카피만 있었습니다. 지금은 순서대로 브랜드(변경 없음) → 작아진 눈에보이기 문구 "16개 유형에 넣지 않아요"(삭제 아님, 강등) → 큰 헤드라인 "나도 모르는 / 내 취향은?" → 티저 2문단(자기 인식 vs 최근 실제 행동이라는 취향 주제의 구조를 반영) → CTA 버튼 "취향 확인해보기" → 마이크로카피 "약 5분 · 가입 없음 · 20문항" → 결과 티저 박스("이런 차이를 발견할 수 있어요" / "좋아한다고 생각한 것과 최근 실제로 고른 것은 다를 수도 있어요")입니다. 기존 서브카피("답한 나와 행동하는 나...")는 새 티저·마이크로카피와 내용이 겹쳐 제거했습니다.
- **`TasteHeroBackdrop` 신규 SVG 컴포넌트**: 히어로 뒤에 옅게 깔리는 동심원 윤곽선 장식입니다. 기존 코드에 재사용할 만한 지도 윤곽 이미지·컴포넌트가 없어(`MapCanvas.tsx` 등 grep으로 확인) 순수 SVG로 하나 새로 만들었습니다. 색은 `currentColor`+`text-primary` 토큰만 쓰고(raw 색상 없음), 반투명은 Tailwind 슬래시 클래스가 아니라 SVG 고유의 `opacity` 속성으로 처리해 `design:check`의 금지 규칙에 걸리지 않습니다. 캐릭터·이모지·사진 없음.
- **취향 카드 중복 노출 제거**: 취향이 히어로에 크게 나오므로 "다른 MAP" 그리드에서는 뺐습니다. **단, 이 제외는 `Landing.tsx` 렌더링 레벨의 로컬 파생 변수(`gridTopicIds = VIRAL_TOPIC_IDS.filter(...)`)로만 처리했고, export된 `VIRAL_TOPIC_IDS` 배열 자체는 건드리지 않았습니다** — 이 배열은 위 "다음 MAP 유도" 블록(`NextMapPrompt.tsx`)이 추천 후보를 고르는 데 그대로 쓰고 있어서, 여기서 taste를 빼면 아직 취향 MAP을 안 해본 사용자에게 다시는 취향이 추천되지 않는 부작용이 생기기 때문입니다.
- **나머지 5개 카드(TopicCard)는 손대지 않았습니다** — 그리드가 6개에서 5개로 줄며 생기는 레이아웃 조정, 섹션 제목("다른 MAP")만 바꿨습니다. 카드별 비주얼 차별화는 이번 범위 밖입니다.
- **애널리틱스 4개 신규 이벤트 추가**(이전까지 `track()` 호출 자체가 코드에 0건이었습니다 — `@vercel/analytics`의 `track()`을 처음 도입):
  1. `topic_select` — `Landing.tsx`에서 주제 카드를 누른 시점. `{ topicId, source: "hero" | "grid" }`. 히어로 CTA는 `handleHeroStart()`, 그리드 카드는 `handleGridStart(topicId)`에서 발생. career·자유 서술(freeform)은 대상에서 제외(기존 `onStart` prop을 그대로 사용).
  2. `quiz_start` — `TopicQuiz.tsx`에서 사용자가 실제로 1번 문항 화면에 도달한 시점(`step === 0`)에만 발생. `useRef` 가드로 React 18 StrictMode의 개발 모드 중복 실행을 막았습니다. `MapDecisionProduct.tsx`의 `start()` 안에는 넣지 않았습니다 — `start()`는 `ProfileStep`보다 먼저 실행돼 `topic_select`와 사실상 같은 시점이 되어 버리기 때문입니다.
  3. `quiz_complete` — `TopicQuiz.tsx`의 `ClosingStep.onSubmit` 콜백(6개 주제 전부가 공유하는, 마지막 필수 답변을 제출하는 지점) 안에서 `onFinish()` 직전에 발생. 클릭 핸들러 안이라 클릭 한 번에 정확히 한 번만 실행되며 StrictMode 중복 실행 대상이 아닙니다.
  4. `result_view` — `MapDecisionProduct.tsx`에 새로 추가한 `useEffect` 하나에서, `session.stage`가 `"result"`로 바뀌는 모든 진입 경로(퀴즈 완주·"이전 결과 보기"·popstate)를 공통으로 잡습니다. 6개 `*Card.tsx` 파일에 따로 넣지 않았습니다. `${topicId}:${startedAt}` 키로 재렌더링 중복을 막고, `hydrated` 게이트로 하이드레이션 전 SSR 기본값("landing") 오탐을 막습니다.
  - 4개 이벤트 모두 `topicId`/`source` 외의 값(답변 내용, 나이·성별·직업 등 프로필, 자유서술 텍스트, 세션 키)은 전달하지 않습니다.
  - **이 세션에서 확인 가능한 범위는 "코드에 `track()` 호출이 올바른 위치에 배선돼 있고 빌드가 정상"까지입니다. 실제 프로덕션에서 Vercel Analytics가 이 이벤트를 정상 수집하는지는 오너가 직접 확인해야 합니다.**
- **손대지 않은 것**(지시받은 대로): `topics.ts`의 문항·선택지·문항 수·채점, `ideal-type-tags.ts`, `TAG_CATEGORIES`, AI 프롬프트/스키마, 결과 타입/블록, `PatternsSection`/`SelfReflectionSection`/`HeroHeader`, `/r/{id}`, `NextMapPrompt` 로직, 궁합, 생성 effort·레이트리밋·캐시, `ProfileStep.tsx`, 하이드레이션 동작, career 플로우, 가입/DB.

## FIRST ACTION MVP — 랜딩 히어로를 taste의 실제 Q1(REAL Q1 LANDING)으로 교체 (브랜치 `claude/map-mvp-first-click-mvp` 계속)

- **제품 목표**: "처음 들어온 사람이 MAP을 이해하기 전에 첫 행동을 하게 만들 수 있는가"를 검증하는 실험입니다. FIRST CLICK MVP의 "헤드라인 → teaser → CTA 클릭 → ProfileStep → Q1" 구조는 CTA를 누를지 판단하는 단계가 여전히 남아 있어, 히어로 자체를 취향(taste)의 실제 Q1 문항(axisId `tasteMode`, "혼자 있는 시간에 나는 주로 뭘 해?")으로 바꿨습니다. 문항 원문·option label(보는 편/듣는 편/읽는 편/만드는 편)은 `topics.ts`에서 그대로 읽어오고 이번 PR에서 수정하지 않았습니다 — 순서도 그대로입니다.
- **일러스트 관련 정정**: 이번 실험은 일러스트를 쓰지 않지만, 이것이 MAP의 영구 디자인 원칙은 아닙니다. FIRST ACTION 효과가 검증되기 전까지 제작 비용이 큰 시각 요소에 기대지 않기 위한 이번 실험 한정 선택입니다 — 대표 콘텐츠의 시각적 초점이 여전히 부족하다고 판단되면 이후 별도로 재검토합니다.
- **`Landing.tsx` 히어로 재구성**: 기존 헤드라인·teaser·"취향 확인해보기" CTA 버튼·microcopy·result-preview 한 줄을 전부 걷어내고, 브랜드 → 짧은 지시문("생각하지 말고, 지금의 나와 가까운 쪽을 골라보세요.") → 실제 Q1 문항 → 2×2 선택 카드(`HeroFirstQuestion`, 신규) → "16개 유형에 넣지 않아요"(삭제 아님, 선택 영역 아래로 이동) 순서로 바꿨습니다. `TasteHeroBackdrop`(등고선 배경 SVG)은 그대로 재사용했습니다 — 새 SVG 컴포넌트를 추가하지 않았습니다.
- **답변 데이터 안전성 — 로직 공유 구조**: Landing의 REAL Q1 카드를 고른 시점과 `TopicQuiz.tsx`에서 같은 문항에 답할 때 서로 다른 모양의 데이터가 만들어질 위험을 없애기 위해, `TopicQuiz.tsx`의 `commitAnswer`가 하던 순수 변환 로직을 `src/map-decision-v1/engine/quiz-answer.ts`(신규)의 `applyQuizAnswer`/`pruneFromStep`으로 옮기고, `TopicQuiz.tsx`는 이 함수를 호출하도록 바꿨습니다(동작 자체는 이전과 완전히 동일 — 줄 그대로 이동). 같은 이유로 `TopicQuiz.tsx`의 `useAutoAdvance` 훅(선택 즉시 강조 후 약 250ms 뒤 자동 전환)도 `src/map-decision-v1/hooks/use-auto-advance.ts`(신규)로 옮겨 `Landing.tsx`와 `TopicQuiz.tsx` 둘 다 재사용합니다. `Landing.tsx`가 `TopicQuiz.tsx`를 직접 import하지 않도록(이미 `TopicQuiz.tsx`가 `Brand`를 가져오려 `Landing.tsx`를 import하고 있어, 반대 방향으로 또 import하면 순환 참조가 생김) 공유 코드를 두 개의 새 파일로 분리했습니다.
- **`MapDecisionProduct.tsx`의 `startTasteFirstAnswer`(신규)**: Hero에서 카드를 고르면 이 함수가 `createSession("taste", undefined, session)`(기존 `start()`와 같은 패턴 — `preserveCompletedResults`로 다른 주제 완료 결과 보존)로 세션을 만들고, `applyQuizAnswer`로 그 답을 곧바로 기록한 뒤 `quizStep: 1`, `stage: "conversation"`으로 세팅합니다. `ProfileStep`(`stage: "profile"`)을 거치지 않고 바로 `TopicQuiz`가 Q2(`tasteRecent`)부터 이어받습니다. `hero_choice` 이벤트는 이 함수 안에서 발생합니다.
- **taste 한정 ProfileStep 후치**: taste만 퀴즈(Q1~Q20+마무리 질문)를 전부 마친 뒤 결과 화면 대신 `ProfileStep`을 한 번 거치고, 완료·건너뛰기 후 결과 생성으로 이어집니다. 구현: `MapDecisionProduct.tsx`에서 taste의 `TopicQuiz`에만 `onFinish={goProfileAfterQuiz}`(신규, `stage: "profile"`로 전환)를 넘기고 나머지 5개 주제는 기존 `onFinish={goResult}` 그대로입니다. `ProfileStep` 렌더 지점에서 `isPostQuizProfile = topic.inputMode === "quiz" && (session.quizStep ?? 0) > 필수문항수`를 계산해, 참이면 `onContinue`를 `goResult`로, 아니면 기존처럼 `goConversation`으로 분기합니다 — 새 세션 필드를 추가하지 않고 이미 있는 `quizStep`만으로 "이번 profile 화면이 퀴즈 전인지 후인지"를 구분합니다. `ProfileStep.tsx` 자체(질문 3개·건너뛰기 동작)는 수정하지 않았습니다.
  - **알려진 한계**: 이 후치는 taste가 `MapDecisionProduct.tsx`의 `start()`(그리드 클릭·`NextMapPrompt`의 "다음 주제로" 클릭 등)로 시작되는 기존 경로에는 적용되지 않습니다 — taste는 이제 "다른 MAP" 그리드에 없지만(FIRST CLICK MVP부터), `NextMapPrompt`가 아직 taste를 완료하지 않은 사용자에게 taste를 추천할 수는 있습니다(`VIRAL_TOPIC_IDS`는 그대로). 이 경로로 taste에 들어오면 `start()`가 여전히 퀴즈 "전" `ProfileStep`을 먼저 보여주고(기존 동작 그대로), 퀴즈를 마치면 위 후치 로직이 다시 한번 `ProfileStep`으로 보냅니다 — 즉 이 드문 경로에서는 프로필 질문을 두 번(퀴즈 전 1번, 퀴즈 후 1번) 마주칠 수 있습니다. 두 번째 화면은 첫 번째에서 이미 답했거나 건너뛴 값이 그대로 채워진 채로 뜨므로("다음"만 누르면 통과) 데이터 손실이나 기능 오류는 없고, 화면이 한 번 더 뜨는 UX 중복입니다. 이번 PR 범위에서는 `start()`나 `NextMapPrompt`를 손대지 않기로 했으므로 고치지 않고 사실로만 기록합니다.
- **`hero_choice`(신규 이벤트)**: `{ topicId: "taste", axisId: "tasteMode" }`만 전송(옵션 라벨·인덱스 없음). `MapDecisionProduct.tsx`의 `startTasteFirstAnswer` 안, 세션을 실제로 만드는 시점에 발생 — taste의 FIRST ACTION 계측점입니다. 히어로에서는 더 이상 `topic_select`를 찍지 않습니다(이전에는 히어로 CTA 클릭 시 `topic_select`를 찍었으나, CTA 자체가 없어졌습니다) — `topic_select`는 이제 "다른 MAP" 그리드 카드를 고를 때만 발생합니다(`handleGridStart`, 변경 없음).
- **`quiz_start` 정의 변경(taste만)**: `TopicQuiz.tsx`에 `QUIZ_START_STEP_BY_TOPIC`(신규, `{ taste: 1 }`, 나머지 주제는 미등록 시 기본값 0)을 추가해, 어느 `quizStep`에서 이벤트를 찍을지 주제별로 정합니다. taste는 히어로가 Q1을 이미 답으로 받아 `TopicQuiz`가 `quizStep: 1`(Q2)부터 마운트되므로 `step === 0` 조건이 그 세션에서 영원히 참이 될 수 없었던 구멍을 막았습니다 — `step === quizStartStep`이 1일 때 한 번만 찍도록 바꿨습니다. `/?start=taste` 딥링크처럼 히어로를 거치지 않고 `quizStep 0`으로 들어온 taste 세션도, 그 안에서 Q1을 답해 `step`이 1이 되는 순간(=실질적으로 "Q2에 처음 진입") 정상적으로 한 번만 찍힙니다 — 별도 세션 플래그 없이 이 규칙 하나로 두 진입 경로를 함께 처리합니다. 나머지 5개 주제는 `QUIZ_START_STEP_BY_TOPIC`에 없어 기존과 같은 `step === 0` 조건 그대로입니다. `useRef` 가드(StrictMode 중복 방지)는 기존 그대로 유지했습니다.
- **`quiz_complete`·`result_view`**: 정의·구현 위치 모두 변경 없음(FIRST CLICK MVP 절 참고). ProfileStep 완료는 `quiz_complete`로 보지 않습니다 — `quiz_complete`는 여전히 `ClosingStep.onSubmit` 안에서만 발생합니다.
- **손대지 않은 것**(지시받은 대로): taste 문항·option label·축 순서·문항 수·채점, `ideal-type-tags.ts`, `TAG_CATEGORIES`, 각 생성기 SYSTEM_PROMPT, 결과 스키마/타입/블록, `NextMapPrompt` 로직, 생성 effort·캐시·레이트리밋, `/r/{id}`, 동적 OG, Cross-MAP, 로그인, DB, adaptive 문항, 나머지 5개 주제의 `ProfileStep` 순서(모두 기존 "Landing → ProfileStep → TopicQuiz" 그대로), `ProfileStep.tsx` 내부(질문 3개·문구·건너뛰기 동작).
- **검증**: Playwright로 taste 전체 플로우(Landing REAL Q1 선택 → Q2 도달 → 20문항 완주 → ProfileStep 진입 → 건너뛰기 → 결과 생성 대기 화면 진입)를 실제로 끝까지 클릭해 확인했습니다(AI 실제 호출은 발생하지 않음 — 결과 생성 대기 화면까지만 확인, 이 샌드박스는 프로덕션 AI 키가 없습니다). 나머지 5개 주제(travelStyle·friendship·selfIntro·idealType·work)도 "Landing → ProfileStep → Q1" 흐름이 그대로 작동하는지 회귀 확인했습니다 — 5개 전부 정상.

## 다음 액션

1. **알려진 기술 부채 우선순위 판단** — 위 "알려진 기술 부채" 목록 중 어느 것부터 정리할지 결정(항목 4·7은 해소 확인됨, 항목 8·9는 이번에 새로 추가됨, 나머지는 여전히 열려 있음).
2. **selfIntro의 재해석 축을 다른 다섯 주제 수준으로 명시할지 판단** — 위 "오늘(8/6) 진행된 작업" 참고. 지금은 selfIntro만 전용 라벨이 없는 상태입니다.
3. **`docs/NASOGAE_DESIGN.md`의 설계 시점 수치(필수 34+심화 6=40문항, 목표 소요 시간 7~8분)가 실제 구현(2026-08-09 기준 필수 34문항, 심화 없음)과 다르다는 점을 인지** — 문서 자체에는 "구현 후 실제와 다른 점" 안내가 추가돼 있습니다. 문항 수(34)는 이번 갱신 시점 기준 우연히 설계 시점 수치와 같아졌지만, 심화 6문항이 없다는 구조 차이는 여전합니다. 소요 시간을 다시 측정해 갱신할지는 별도 판단이 필요합니다.
4. **위 "발견된 죽은 코드" 목록 중 남은 항목(`DecisionStep`, `progressHint`, `quizDepth` 배선)의 삭제 여부 판단** — `entryChips`·`IconButton`/`Input`/`Modal`·`VoiceProvider`는 PR #205로 이미 삭제됐습니다(위 항목 참고). 남은 세 가지는 재사용 가능성·과거 데이터 호환 이유로 이번에도 범위에서 제외됐습니다.
5. **`generation-timing.ts` 66행 근처의 낡은 "90초" 주석을 45초로 고칠지 판단** — 코드 동작 자체는 정상이라 급하지 않지만, 다음에 이 파일을 만지는 사람이 혼동할 수 있습니다.
6. **랜딩의 `TOPIC_META` 소요 시간 표시를 실측치(생성 100~135초 포함)로 갱신할지 판단** — 지금은 문항 수 기반 추정치만 보여주고 생성 대기 시간은 전혀 반영하지 않습니다. 위 "프로덕션 실측 데이터" 항목 참고.
