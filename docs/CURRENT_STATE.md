# 현재 상태 (Current State)

이 문서는 특정 시점의 운영 현황을 기록합니다. 아래 "열려 있는 Draft PR"과 "다음 액션"만 예외적으로 가까운 계획을 담습니다. 그 외는 전부 "지금 실제로 그런 상태"만 적습니다.

마지막 갱신: 2026-08-06. 이번 갱신은 문서 노후화 전수 점검이었습니다 — 코드와 실제로 어긋나 있던 문항 수·심화 구간·결과 블록 구성·공유/궁합 지원 범위를 전부 코드 기준으로 다시 확인해 고쳤고, "열려 있는 Draft PR"·"다음 액션"도 실제 처리 여부를 확인해 갱신했습니다. 이전 갱신까지 "#136·#137은 확인 안 함"으로 남아있던 것도 이번에 확인했습니다(아래 참고).

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
| selfIntro | 나 소개·성격 | 활성 (PR #122·#123 머지 완료, 필수 36문항, 심화 없음 — 심화 경로는 폐지됨) |
| friendship | 친구·인간관계 | 활성 (PR #158~#163 머지 완료, 필수 30문항, 심화 없음) |
| work | 일할 때의 나 | 활성 (PR #167~#170 머지 완료, 필수 30문항, 심화 없음) |
| taste | 취향 | 활성 (PR #172~#175 머지 완료, 필수 20문항, 심화 없음) |
| travelStyle | 여행 스타일 | 활성 (PR #177~#180 머지 완료, 필수 20문항, 심화 없음) |
| freeform | (자유 서술) | 랜딩 카드로 노출되지 않는 숨은 안전망 주제, `implemented: false` |

"준비 중"은 `topics.ts`의 `implemented: false`로 판단합니다. `false`인 주제는 카드를 눌러도 대화가 시작되지 않고 "준비 중" 안내만 뜹니다 — 지금은 랜딩에 노출되는 7개 주제 모두 활성 상태라 해당하는 주제가 없습니다.

**심화(선택) 구간은 6개 완성형 퀴즈 주제 전부에서 폐지됐습니다.** `topics.ts`를 코드로 직접 세어 확인한 결과 6개 주제 모두 `required: false`인 축이 0개입니다 — 처음에는 이상형·나 소개만 필수+심화 구조였고 나머지 넷은 처음부터 전부 필수였는데, 이상형·나 소개도 이후 심화 경로가 제거되며 전부 필수로 통합돼 지금은 예외 없이 전부 필수입니다. 다만 `TopicQuiz.tsx`의 심화 갈림길 코드 자체는 아직 파일에 남아있습니다 — 아래 "발견된 죽은 코드" 참고.

## 결과 화면 레이아웃

- 현재 실제로 구현된 결과 레이아웃은 7종류입니다(`types/index.ts`의 각 Result 타입 필드를 코드로 직접 확인):
  - **진로**(대화형, 기존 4블록+지도 구조, `Result.tsx`)
  - **이상형**(6블록, `IdealTypeCard.tsx`+`IdealTypeResultBlocks.tsx` — criteria/attractionPatterns/matrix/flags/selfReflection(whatYouOffer·whatToImprove)/roadmap)
  - **나소개**(6블록, `SelfIntroCard.tsx`+`SelfIntroResultBlocks.tsx` — coreValues/patterns/matrix/traits/selfReflection(whatYouOffer·whatToImprove)/roadmap)
  - **친구·인간관계**(6블록 — friendCriteria/patterns/matrix/friendTypes/selfReflection(whatYouOffer·whatToImprove)/roadmap)
  - **일할 때의 나**(6블록 — workDrivers/patterns/matrix/workFit/selfReflection(strengths·blindSpots)/roadmap)
  - **취향**(6블록 — tasteCore/patterns/matrix/tasteMap/selfReflection(awareness·blindSpots)/roadmap)
  - **여행 스타일**(4블록 — discovery/matrix/fit/roadmap. 원래 다른 다섯 주제와 같은 6블록이었으나 2026-08-06 오늘 4블록으로 재설계됨 — 아래 "오늘(8/6) 진행된 작업" 참고. selfReflection에 해당하는 블록이 없고 discovery가 그 역할까지 흡수함)
- 이상형·나소개·친구·일·취향 다섯 주제는 카드 렌더링·공유 연결 구조가 유사하지만, **공통 추상화 컴포넌트로 뽑혀 있지는 않습니다** — 각자 별도 파일로 존재하는 병렬 구현입니다. "새 주제 추가 시 재사용 가능한 공통 틀"은 아직 코드로 존재하지 않고, 지금까지는 기존 주제 파일을 복제해 새로 만드는 방식으로 확장했습니다.
- `TopicQuiz.tsx`(퀴즈 입력 UI)는 6개 완성형 퀴즈 주제(이상형·나소개·친구·일·취향·여행 스타일) 전부가 공유합니다 — `topic.id` 기반으로 세션 필드명을 계산하도록 일반화되어 있습니다(PR #123).

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

## 공유 링크 · card.png · 궁합 지원 범위 (코드로 확인, 세 기능의 지원 주제가 서로 다름)

- **공유 링크(`/r/{id}`, `/api/share`)는 7개 주제 전부 지원합니다** — `share-validation.ts`의 `SUPPORTED_SHARE_TOPICS`에 idealType·career·selfIntro·friendship·work·taste·travelStyle이 전부 등록돼 있습니다. 공유 링크는 Upstash Redis에 결과 JSON만 저장(대화 원문·IP·이메일 저장 안 함), 90일 자동 만료, 하루 공유 5회 제한.
- **card.png(초대장 컨셉 이미지, 1080×1350)는 career를 제외한 6개 완성형 퀴즈 주제만 지원합니다** — `app/r/[id]/card.png/route.ts`가 `resultLayoutId`로 분기하는데 career 분기가 없어, career 공유 링크는 card.png를 만들지 못합니다(진로는 원래 카드형이 아니라 지도형 결과라 이 컨셉 자체가 적용되지 않습니다).
- **친구와의 궁합 비교(#107, `engine/compatibility.ts`)는 이상형 결과 전용입니다.** `app/r/[id]/match/page.tsx`의 `extractIdealTypeTags()`가 `resultLayoutId !== "idealType"`이면 곧바로 비교를 포기하고 "친구 결과를 찾을 수 없어요"로 안내합니다 — 나소개를 포함한 나머지 6개 주제는 궁합 화면 진입 자체가 안 됩니다. `compareTags()` 함수 자체는 태그 형식만 맞으면 어떤 주제의 태그든 비교할 수 있게 짜여 있지만(주제를 가리지 않음), 실제로 그 함수를 호출하는 화면 진입 경로가 이상형 하나로만 연결돼 있습니다.
- 궁합 비교(`compareTags`)는 태그 4축이 양쪽 모두 전부 있을 때만("status: ok") 성립합니다. 한쪽이라도 축이 비어 있으면("status: incomplete") "지금은 두 결과를 비교할 수 없어요. 새로 만든 결과끼리는 비교할 수 있어요."로 중립적으로 안내합니다(PR #133). 어느 쪽 축이 비었는지는 사용자에게 노출하지 않고 서버 로그(`[compatibility] comparison incomplete — ...`)에만 남깁니다.
- 태그 체계(`engine/ideal-type-tags.ts`)는 카테고리 4개·태그 총 64개로 고정돼 있습니다(6개 완성형 퀴즈 주제가 공유). 2026-08-06 오늘 이 중 7개 태그 문자열이 교체됐습니다 — 아래 "오늘(8/6) 진행된 작업" 참고.

## 진로 결과 화면 (7/29 정리됨)

- 헤더의 중복 버튼 그룹, 프리미엄 내보내기/다른 기기 안내(둘 다 실제 결제·로그인 연동 없는 목업 문구였음), 결과 화면 상단 방사형 지도(MapCanvas)를 제거했습니다(PR #121). 하단 액션 바(#120에서 접힌 형태로 축소)로 버튼 기능이 통합돼 있습니다.
- ★단, 대화 중 화면(`Conversation.tsx`)에는 방사형 지도(`MapCanvas`)가 여전히 3곳(컴팩트 모드, 전체 모드, 결과 프리뷰 모드)에서 렌더링됩니다 — #121이 정리한 것은 "결과 화면(`Result.tsx`)"뿐이고, 대화가 진행 중인 화면 자체는 범위 밖이었습니다. 아래 "알려진 기술 부채" 참고.

## 결과 생성 멱등 캐시 (PR #135, 락 제거 PR #136 머지 완료)

- 같은 사람이 같은 답변으로 결과 생성을 다시 요청하면(백그라운드 전환 후 페이지 리로드 등) Upstash Redis 캐시에서 이미 만든 결과를 바로 돌려주고, 레이트리밋 슬롯(`reserveGenerationSlot`)을 소모하지 않습니다. 캐시 키는 대화·퀴즈 답변을 정규화해 SHA-256으로 해시한 값(`gen-cache:{topic}:{hash}`)이라 추측 불가능하고, `session.startedAt` 같은 값은 쓰지 않습니다. TTL은 30분(`GENERATION_CACHE_TTL_SECONDS`).
- PR #135는 원래 동시 요청 중복 방지용 락(`acquireGenerationLockOrWaitForCache` 등)을 포함한 채로 자동 머지됐었습니다 — 이 락은 대기 상한이 9초인데 실제 생성은 보통 1~2분 걸려서, 통상적인 생성 시간에는 중복 방지가 사실상 작동하지 않는 설계 결함이 있었습니다. **이 락 코드는 후속 수정 PR #136(커밋 `7bccc6d`)으로 이미 제거돼 지금 main·프로덕션에는 남아있지 않습니다.**

## 레이트리밋 (Upstash Redis)

- 생성 API(`/api/generate-result`, `/api/generate-idealtype-result`, `/api/generate-self-intro-result`)는 Upstash Redis 원자적 연산으로 세션당 5회(`MAX_GENERATIONS_PER_SESSION`)·IP당 하루 10회(`DAILY_GENERATION_LIMIT`)·서비스 전체 하루 상한(`DAILY_GLOBAL_GENERATION_LIMIT`, 기본 300, 환경변수로 재배포 없이 조절 가능, PR #126)을 겁니다.
- 생성 실패 시도 자체에도 세션당 2회(`MAX_FAILED_GENERATIONS_PER_SESSION`) 상한이 있습니다("failure_limit") — 항상 실패하는 입력으로 무제한 호출하는 것을 막기 위함입니다.
- 전체 하루 상한 키(`gen-slot:global:{KST 날짜}`)는 `.github/workflows/daily-limit-alert.yml`이 그대로 읽습니다 — 바뀌지 않았습니다.
- Redis 연결 정보가 없으면(장애 포함) **막는 쪽(fail-closed)**으로 설계돼 있습니다 — 레이트리밋 없이 생성을 허용하면 이 기능의 목적(비용 방어) 자체가 무너지기 때문입니다. 위의 결과 생성 캐시(PR #135)는 이와 반대로 fail-open(Redis 장애 시 캐시를 건너뛰고 기존 동작 유지)이며, 레이트리밋의 fail-closed 동작 자체는 건드리지 않았습니다.
- `session.startedAt`은 세션별 한도의 키로만 쓰입니다(날짜 판단에는 서버 시간만 사용) — 위조 시 세션당 5회 한도만 우회 가능하고, IP 하루 10회·전체 300회 한도는 영향받지 않습니다.
- 세션 시작(`registerSessionStart`, `/api/extract-nodes`) 한도만 여전히 인메모리입니다 — AI 호출 비용이 없는 가벼운 동작이라 의도적으로 남겨둔 것입니다.

## 생성 실패 진단 로그 (PR #132)

- 결과 생성이 실패하면 사용자에게는 항상 같은 문구("지금은 카드를 만들 수 없어요...")가 뜹니다 — 원인이 API 키 미설정/Redis 미설정/failure_limit 도달/스키마 검증 실패/응답 비어있음/Claude API 에러 중 무엇이든 화면상으로는 구분되지 않습니다(의도적 — 원인을 노출하면 공격자에게 내부 상태를 알려주는 셈이라 그대로 둠).
- 다만 서버 로그로는 구분 가능합니다 — `[ideal-type-generator]`/`[self-intro-generator]`/`[redis-client]`/`[rate-limit]` 접두어로 원인별 로그가 남습니다(검색어 목록은 PR #132 본문 참고). 개인정보(IP, 원본 세션 키, 프롬프트, 답변 내용)는 로그에 남기지 않습니다.

## CI / 브랜치 보호 · 머지 방식

- `.github/workflows/quality-gate.yml`("MAP Quality Gate")이 모든 PR에서 `typecheck`, `harness:check`, `design:check`, `build`를 순서대로 실행하며, GitHub의 필수 상태 체크로 등록되어 있습니다.
- `.github/workflows/auto-merge.yml`("Guarded Auto Merge")이 Quality Gate 성공 시 **Draft가 아닌 모든 PR을 브랜치 이름과 무관하게 자동으로 `main`에 스쿼시 머지**합니다(`--squash --delete-branch`). Draft PR은 절대 자동 머지되지 않습니다 — 오너가 확인할 유일한 사람 검증 기회는 Ready로 전환하기 전, 직접 화면을 보는 것뿐입니다.
- `main`은 PR을 통해서만 반영됩니다.
- 그 외 워크플로: `.github/workflows/daily-limit-alert.yml`(30분마다 전체 하루 생성 상한 임박 여부 확인), `.github/workflows/health-check.yml`(1시간마다 프로덕션 단순 응답 확인), `.github/workflows/production-smoke.yml`(main 푸시·머지 직후 + 6시간마다 더 폭넓은 프로덕션 확인, 실패 시 GitHub 이슈 자동 생성).

## 배포 · 모니터링

- `main`에 머지되면 Vercel이 자동으로 프로덕션(`mapdecision.com`, Vercel 프로젝트 `map-mvp-46zk`)에 배포합니다.
- 어떤 API 라우트에도 Vercel `maxDuration`이 지정되어 있지 않습니다(`vercel.json` 없음, 각 `route.ts`에 `export const maxDuration`도 없음) — 즉 함수 실행시간 상한은 Vercel 플랜의 기본값을 그대로 따릅니다. 이 저장소 안에서는 그 기본값이 정확히 몇 초인지 확인할 수 없습니다(아래 "코드 외 확인 필요" 참고).
- `.github/workflows/production-smoke.yml`이 `main` 푸시·머지 직후·6시간마다 프로덕션 정상 응답을 확인하고, 실패 시 GitHub 이슈를 자동 생성합니다.
- 이 개발 샌드박스는 네트워크 프록시로 `mapdecision.com`에 직접 접근이 막혀 있어, 배포 확인은 GitHub Actions 결과(간접 증거)로만 합니다.

## 열려 있는 Draft PR

이전 갱신까지 여기 남아있던 #136·#137은 각각 `7bccc6d`(PR #136 머지 커밋), `04e5a95`(PR #137 머지 커밋)로 이미 오래전에 main에 머지됐습니다 — git 로그로 확인. 이번 갱신 시점(2026-08-06) 기준으로 이 문서가 추적해야 할 별도의 열려 있는 Draft PR은 없습니다.

## 알려진 기술 부채

1. **`design:check`의 `KNOWN_OPACITY_DEBT`에 등록된 기존 raw opacity 위반이 아직 남아있습니다** (`scripts/design-check.mjs`) — `TopicQuiz.tsx`(2건), `Conversation.tsx`(4건), `FinalResultBlocks.tsx`(1건), `Landing.tsx`(2건), `components/ui/primitives.tsx`(3건). 새 위반은 게이트가 막지만, 이 목록에 있는 기존 위반은 통과합니다. 목록에서 항목이 빠지는 것 자체가 "고쳤다"는 뜻이 되도록 설계돼 있습니다.
2. **생성 실패 6가지 원인이 사용자에게는 전부 같은 문구로 보입니다.** PR #132로 서버 로그는 원인별로 구분되게 됐지만(위 항목 참고), 사용자 화면 문구 자체는 의도적으로 그대로입니다.
3. **`/api/share`가 클라이언트가 보낸 `result`를 형태(shape)만 검증하고 그대로 저장합니다** (`share-validation.ts`의 `validateSharePayload` → `SUPPORTED_SHARE_TOPICS[topicId](result)`는 타입·필드 존재 여부만 확인하는 구조 검증기이지, 내용이 실제로 AI가 생성한 것인지는 확인하지 않습니다). 즉 구조만 맞으면 임의의 텍스트를 담아 공유 링크를 만들 수 있습니다.
4. **어떤 API 라우트에도 Vercel `maxDuration`이 지정돼 있지 않습니다.** 위 "배포·모니터링" 참고.
5. **`Conversation.tsx`(진로 대화 중 화면)에 방사형 지도(`MapCanvas`)가 3곳 남아있습니다.** 결과 화면(`Result.tsx`)의 지도는 PR #121로 제거됐지만, 대화 진행 중 화면 자체는 범위 밖이었습니다.
6. **결과 레이아웃이 주제마다 병렬 구현입니다.** 공통 추상화가 없어, 주제가 늘어날수록 같은 종류의 파일(제너레이터·결과 블록·카드 컴포넌트)이 반복해서 생깁니다.
7. ~~PR #135의 락 제거가 아직 main에 반영되지 않았습니다.~~ **해소됨 — PR #136이 머지되어(커밋 `7bccc6d`) 락 코드가 제거됐습니다.**

## 발견된 죽은 코드

2026-08-06 문서 노후화 점검 중 코드로 확인한, 실행되지 않는 코드입니다. 삭제는 하지 않았습니다 — 삭제 여부는 별도 판단이 필요합니다.

1. **`TopicQuiz.tsx`의 `DecisionStep`(심화 갈림길 화면)** — `resolvePhase()`가 `optionalAxes.length === 0`이면 `kind: "decision"`을 절대 반환하지 않도록 짜여 있는데, 지금 6개 완성형 퀴즈 주제 전부 `optionalAxes`가 항상 빈 배열입니다(심화 구간 전면 폐지). 즉 `DecisionStep`을 렌더링하는 분기 자체에 도달할 방법이 없습니다.
2. **`TopicQuiz.tsx`의 `progressHint`** — `phase.kind === "required" && phase.index === 0 && optionalAxes.length > 0`일 때만 값이 채워지는데, 위와 같은 이유로 이 조건이 항상 거짓이라 `progressHint`는 항상 `null`이고 화면에도 그려지지 않습니다.
3. **`topics.ts`의 `entryChips` 필드** — 7개 주제 전부에 값이 채워져 있지만(`career`부터 `travelStyle`까지), `src/map-decision-v1`·`app` 어디에서도 이 필드를 읽어 렌더링하는 코드가 없습니다.
4. **`TopicQuiz.tsx`의 `DEPTH_FIELD_BY_TOPIC`와 `MapSession.idealTypeQuizDepth`/`selfIntroQuizDepth`** — 심화 완료 시 이 값을 `"deep"`으로 기록하는 코드(closing 단계의 `if (optionalAxes.length > 0 && depthField)` 분기)가 있지만, 위 1번과 같은 이유로 `optionalAxes.length`가 항상 0이라 이 분기도 절대 실행되지 않습니다. 이 값은 `IdealTypeCard.tsx`·`SelfIntroCard.tsx`를 거쳐 `/api/share`까지 그대로 실려가 `share-store.ts`에 저장되는 구조라 배선 자체는 넓게 퍼져 있는데, 지금 이 시점 이후로 새로 만들어지는 값은 항상 `undefined`만 가능합니다. **완전한 죽은 코드는 아닙니다** — 심화 구간이 있던 시절(폐지 이전)에 만들어진 기존 공유 링크는 90일 TTL이 끝나기 전까지 `quizDepth: "deep"`를 여전히 들고 있을 수 있고, `app/r/[id]/page.tsx`의 "심층 분석 포함" 배지(224행·264행)는 그런 옛 링크에 대해서는 지금도 실제로 그려집니다.
5. `TopicQuiz.tsx` 795~797행의 주석("둘 다 심화 경로를 없애 optionalAxes가 항상 빈 배열이라... 지금은 이상형·나 소개 둘 다")도 이번 점검에서 같이 발견된 문서 노후화입니다 — 지금은 이상형·나 소개만이 아니라 6개 완성형 주제 전부가 이 상태입니다. 이 주석은 파일 상단이 아니라 함수 내부 주석이라 이번 정리 대상(코드 파일 "상단" 설명 주석)에서는 빠졌습니다.

## 오늘(7/31) 머지된 PR 요약 (그 날짜 기준 기록, 그 이후 갱신되지 않음)

- **#131** — 태그 4축(다중 선택, 최대 3개) 중 1순위가 공유 태그를 결정한다는 규칙을 AI 프롬프트(이상형·나소개 SYSTEM_PROMPT)에 명시. 문항·태그 계산 로직은 변경 없음.
- **#132** — 생성 실패 6종 원인에 서버 로그 추가(위 항목 참고). 사용자 문구 변경 없음.
- **#133** — 궁합 비교가 태그 4축 전부 있을 때만 성립하도록 수정, 비교 불가 안내 문구를 원인 단정 없는 중립 표현으로 교체(위 "이상형·나소개 MAP" 항목 참고).
- **#134** — 결과 타이틀·나소개 패턴 블록의 어휘/구조 수렴 문제를 프롬프트로 완화, PR #131이 만든 "1순위" 표현 지시 충돌 해소. 문항·스키마 변경 없음.
- **#135** — 결과 생성 멱등 캐시 도입(위 항목 참고). ★단 락 코드가 포함된 채로 머지됐고, 제거 PR(#136)은 아직 미병합.

이 5개 PR 전부 공통으로: 실제 AI 출력 품질(타이틀 다양성 개선, 1순위 표현 규칙 준수 여부 등)은 이 개발 샌드박스에 `ANTHROPIC_API_KEY`가 없어 검증하지 못했습니다 — 오너가 프로덕션에서 직접 확인해야 합니다.

## 코드 외 확인 필요 (이 저장소 안에서는 확인 불가)

- Vercel 함수 실행시간 상한(`maxDuration`) 플랜 기본값이 정확히 몇 초인지
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

## 다음 액션

1. **알려진 기술 부채 우선순위 판단** — 위 "알려진 기술 부채" 목록 중 어느 것부터 정리할지 결정(항목 7은 이번에 해소 확인됨, 나머지는 여전히 열려 있음).
2. **selfIntro의 재해석 축을 다른 다섯 주제 수준으로 명시할지 판단** — 위 "오늘(8/6) 진행된 작업" 참고. 지금은 selfIntro만 전용 라벨이 없는 상태입니다.
3. **`docs/NASOGAE_DESIGN.md`의 설계 시점 수치(필수 34+심화 6=40문항, 목표 소요 시간 7~8분)가 실제 구현(필수 36, 심화 없음)과 다르다는 점을 인지** — 문서 자체에는 이번에 "구현 후 실제와 다른 점" 안내를 추가했습니다. 소요 시간을 다시 측정해 갱신할지는 별도 판단이 필요합니다.
4. **위 "발견된 죽은 코드" 5건의 삭제 여부 판단** — 이번 점검은 목록화까지만 하고 삭제하지 않았습니다.
