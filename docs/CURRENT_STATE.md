# 현재 상태 (Current State)

이 문서는 특정 시점의 운영 현황을 기록합니다. 아래 "열려 있는 Draft PR"과 "다음 액션"만 예외적으로 가까운 계획을 담습니다. 그 외는 전부 "지금 실제로 그런 상태"만 적습니다.

마지막 갱신: 2026-07-29 (오늘 머지된 PR #94~#121 반영).

## 코드

- 실제로 운영되는 서비스 코드는 **`src/map-decision-v1`** 하나뿐입니다.
- `src/map-os`, `src/conversation-engine`, `src/discovery-engine`, `src/story-engine`, `src/map-engine`는 **삭제되지 않고 그대로 남아있는 죽은 코드**입니다. 어디서도 사용되지 않으며, 참고·재사용하지 마세요. 삭제는 오너 승인 후 별도 정리 PR에서 진행합니다.

## 제품 정의 기준 문서

- 제품이 무엇인지/무엇이 아닌지에 대한 기준 문서는 **`docs/MAP_CONSTITUTION.md`**, **`docs/MAP_DESIGN_SYSTEM.md`**입니다. `README.md`는 기준 문서가 아니며 실제 구현과 맞지 않습니다.
- `docs/NASOGAE_DESIGN.md` — "나 소개·성격" 주제의 설계 문서(PR #122, 아직 Draft). 이상형과 태그 4축을 동일하게 재사용하는 이유와 문항 설계 원칙을 담고 있습니다.

## 랜딩 주제 9개 현황

| topicId | 표시 이름 | 상태 |
|---|---|---|
| career | 진로·커리어 | 활성 |
| idealType | 이상형 | 활성 |
| selfIntro | 나 소개·성격 | 코드는 구현됨(PR #123, Draft) — main에는 아직 없음 |
| loveStyle | 연애 스타일 | 준비 중(껍데기만) |
| compatibility | 궁합 | 준비 중(껍데기만). ★랜딩의 이 주제와 #107이 만든 "친구와의 궁합" 기능은 서로 다릅니다 — #107은 이상형 결과 화면에 붙은 기능(태그 4개 코드 비교)이고, 이 카드는 완주형 대화/퀴즈 주제로 아직 문항이 없습니다. |
| taste | 취향 | 준비 중(껍데기만) |
| travelStyle | 여행 스타일 | 준비 중(껍데기만) |
| jobChange | 이직 | 준비 중(껍데기만) |
| bigDecision | 큰 결정·소비/재무 | 준비 중(껍데기만) |
| freeform | (자유 서술) | 랜딩 카드로 노출되지 않는 숨은 안전망 주제 |

"준비 중"은 `topics.ts`의 `implemented: false`로 판단합니다. `false`인 주제는 카드를 눌러도 대화가 시작되지 않고 "준비 중" 안내만 뜹니다.

## 결과 화면 레이아웃

- 현재 실제로 구현된 결과 레이아웃은 3종류입니다: 진로(기존 4블록+지도 구조, `Result.tsx`), 이상형(7요소 시각 블록, `IdealTypeCard.tsx`+`IdealTypeResultBlocks.tsx`), 나소개(6블록, `SelfIntroCard.tsx`+`SelfIntroResultBlocks.tsx`, PR #123 Draft).
- 이상형과 나소개는 카드 렌더링·공유 연결 구조가 유사하지만, **공통 추상화 컴포넌트로 뽑혀 있지는 않습니다** — 각자 별도 파일로 존재하는 병렬 구현입니다. "새 주제 추가 시 재사용 가능한 공통 틀"은 아직 코드로 존재하지 않고, 지금까지는 이상형 파일을 복제해 새로 만드는 방식으로 확장했습니다.
- `TopicQuiz.tsx`(퀴즈 입력 UI)는 이상형과 나소개가 실제로 공유합니다 — `topic.id` 기반으로 세션 필드명을 계산하도록 일반화되어 있습니다(PR #123).

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

## 이상형 MAP + 공유 링크 + 궁합 (완료된 트랙)

- 퀴즈(필수 34 + 심화 6), 결과 7요소 시각 블록, 이미지 저장, 익명 공유 링크(`/r/{id}`), card.png(초대장 컨셉, 1080×1350), 친구와의 궁합 비교(#107, 태그 4개 코드 비교) 전부 머지·배포 완료 상태입니다.
- 공유 링크는 Upstash Redis에 결과 JSON만 저장(대화 원문·IP·이메일 저장 안 함), 90일 자동 만료, 하루 공유 5회 제한.

## 진로 결과 화면 (오늘 정리됨)

- 헤더의 중복 버튼 그룹, 프리미엄 내보내기/다른 기기 안내(둘 다 실제 결제·로그인 연동 없는 목업 문구였음), 결과 화면 상단 방사형 지도(MapCanvas)를 제거했습니다(PR #121). 하단 액션 바(#120에서 접힌 형태로 축소)로 버튼 기능이 통합돼 있습니다.

## 레이트리밋 (Upstash Redis, 이미 완료)

- 생성 API(`/api/generate-result`, `/api/generate-idealtype-result`, `/api/generate-self-intro-result`)는 Upstash Redis 원자적 `INCR`+`EXPIRE`로 세션당 5회·IP당 하루 10회·서비스 전체 하루 상한(`DAILY_GLOBAL_GENERATION_LIMIT`, 기본 300)을 겁니다.
- 전체 하루 상한 키(`gen-slot:global:{KST 날짜}`)는 `.github/workflows/daily-limit-alert.yml`이 그대로 읽습니다 — 바뀌지 않았습니다.
- Redis 연결 정보가 없으면(장애 포함) **막는 쪽(fail-closed)**으로 설계돼 있습니다 — 레이트리밋 없이 생성을 허용하면 이 기능의 목적(비용 방어) 자체가 무너지기 때문입니다.
- `session.startedAt`은 세션별 한도의 키로만 쓰입니다(날짜 판단에는 서버 시간만 사용) — 위조 시 세션당 5회 한도만 우회 가능하고, IP 하루 10회·전체 300회 한도는 영향받지 않습니다.
- 세션 시작(`registerSessionStart`, `/api/extract-nodes`) 한도만 여전히 인메모리입니다 — AI 호출 비용이 없는 가벼운 동작이라 의도적으로 남겨둔 것입니다.
- 동시 요청 정확성은 이전에 Playwright로 확인된 바 있습니다(15개 동시 요청·상한 6 조건에서 정확히 6개만 통과).

## CI / 브랜치 보호 · 머지 방식

- `.github/workflows/quality-gate.yml`("MAP Quality Gate")이 모든 PR에서 `typecheck`, `harness:check`, `design:check`, `build`를 실행하며, GitHub의 필수 상태 체크로 등록되어 있습니다.
- `.github/workflows/auto-merge.yml`("Guarded Auto Merge")이 Quality Gate 성공 시 **Draft가 아닌 모든 PR을 브랜치 이름과 무관하게 자동으로 `main`에 스쿼시 머지**합니다(`--squash --delete-branch`). Draft PR은 절대 자동 머지되지 않습니다 — 오너가 확인할 유일한 사람 검증 기회는 Ready로 전환하기 전, 직접 화면을 보는 것뿐입니다.
- `main`은 PR을 통해서만 반영됩니다.

## 배포 · 모니터링

- `main`에 머지되면 Vercel이 자동으로 프로덕션(`mapdecision.com`, Vercel 프로젝트 `map-mvp-46zk`)에 배포합니다.
- `.github/workflows/production-smoke.yml`이 `main` 푸시·머지 직후·6시간마다 프로덕션 정상 응답을 확인하고, 실패 시 GitHub 이슈를 자동 생성합니다.
- 이 개발 샌드박스는 네트워크 프록시로 `mapdecision.com`에 직접 접근이 막혀 있어, 배포 확인은 GitHub Actions 결과(간접 증거)로만 합니다.

## 열려 있는 Draft PR

| PR | 제목 | 비고 |
|---|---|---|
| #122 | 나 소개·성격 설계 문서 | 코드 변경 없음, 문서만 |
| #123 | 나 소개·성격 주제 구현 | `TopicQuiz.tsx`를 건드린 판단 사항 있음(PR 본문 참고), 실제 AI 생성 미검증 |
| #124 | 이용약관 만 14세 미만 조항 보강 | 법률 자문 아님, 변호사 검토 필요 |

## 알려진 미해결 리스크

1. **PR #123(나소개)의 실제 AI 생성 결과가 검증되지 않았습니다.** 이 개발 환경에 `ANTHROPIC_API_KEY`가 없어 문장 품질·태그 정확도를 확인한 적이 없습니다. 화면 구조(모의 데이터)만 확인했습니다.
2. **결과 레이아웃이 주제마다 병렬 구현입니다.** 공통 추상화가 없어, 주제가 늘어날수록 같은 종류의 파일(제너레이터·결과 블록·카드 컴포넌트)이 반복해서 생깁니다.
3. **개인정보처리방침이 나소개 주제의 데이터 처리를 아직 명시적으로 반영하지 않았습니다** — 이상형과 동일한 공유 인프라를 재사용하므로 실질적 처리 방식은 같지만, 문서상 "나소개" 언급은 없습니다.
4. **브랜치 정리가 부분적으로만 진행됐습니다.** main에 이미 머지된 것으로 확인된 브랜치 26개를 삭제하려 했으나, 이 개발 샌드박스의 git 프록시가 삭제 푸시(delete-ref)를 403으로 거부해 실행하지 못했습니다. 삭제 대상 목록은 확인해뒀으니 오너가 GitHub 웹에서 직접 삭제하거나, 다른 환경에서 `git push origin --delete <branch>`를 실행해야 합니다.
5. **랜딩 이모지 교체는 후보만 제시된 상태입니다.** 코드는 바뀌지 않았습니다 — 오너가 후보 중 하나를 고르면 별도 PR로 구현합니다.
6. **이용약관 만 14세 조항(PR #124)이 변호사 검토 전입니다.** Draft 상태 유지 중.

## 다음 액션

1. **PR #122/#123/#124 오너 확인** — Ready 전환 여부, 특히 #123의 `TopicQuiz.tsx` 판단 사항 승인 여부.
2. **브랜치 삭제 실행** — 위 리스크 4번. 삭제 대상 26개 목록은 확보돼 있습니다.
3. **랜딩 이모지 대체안 선택** — 제시된 후보 중 하나를 고르면 구현.
4. **나소개 실제 생성 품질 확인** — 오너가 프로덕션 또는 API 키가 있는 환경에서 직접 확인.
