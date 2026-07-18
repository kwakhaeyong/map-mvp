# MAP MVP

MAP Decision은 사용자의 생각과 고민을 대화로 끌어내어, 글이 아니라 시각화된 지도(MAP)로 보여주는 의사결정 시각화 AI 플랫폼입니다.

> 정답을 대신 주는 AI가 아니라, 내 생각이 보이게 만드는 AI.

## 기준 문서 (Source of Truth)

이 README는 개요만 담습니다. 제품 정의와 화면 규칙은 아래 두 문서를 기준으로 삼으세요:

- [`docs/MAP_CONSTITUTION.md`](docs/MAP_CONSTITUTION.md) — 제품 정체성, AI/대화/저장 원칙
- [`docs/MAP_DESIGN_SYSTEM.md`](docs/MAP_DESIGN_SYSTEM.md) — 디자인 토큰, 타이포, Golden Screens 규칙

개발 시 지켜야 할 절차와 제약은 [`CLAUDE.md`](CLAUDE.md), [`AGENTS.md`](AGENTS.md)를 참고하세요.

## 실제로 운영 중인 코드

이 저장소에서 실제로 배포되는 서비스 코드는 **`src/map-decision-v1`** 하나입니다.

```text
app/
  page.tsx                  랜딩 페이지 진입점
  result/page.tsx           결과(Result) 페이지 진입점
  components/MapDecisionApp.tsx   src/map-decision-v1의 MapDecisionProduct를 렌더링

src/map-decision-v1/
  components/
    Landing.tsx              랜딩 화면
    Conversation.tsx         대화 + 라이브 MAP 화면
    Result.tsx                결과 MAP 화면
    MapCanvas.tsx             MAP 시각화 캔버스
    MapDecisionProduct.tsx    화면 전환을 담당하는 최상위 컴포넌트
    ui/primitives.tsx         공유 UI 프리미티브 (버튼/카드/노드 등)
  engine/
    session.ts                세션 생성/진행 로직
    local-conversation-provider.ts  로컬(결정론적) 대화 응답 생성
    thinking-extractor.ts     대화에서 구조(사실/감정/가치/옵션 등) 추출
    topics.ts                 토픽 정의
    integration-providers.ts  외부 AI 연동을 위한 인터페이스
  storage/session-storage.ts  로컬 자동저장
  voice/use-web-speech.ts     Web Speech API 연동
  types/index.ts              세션/노드/관계 타입 정의
```

## 정리된 실험 코드

과거 여러 시점에 시도된 "대화 → 인사이트 → 스토리 → MAP" 아키텍처 실험(`map-os`, `conversation-engine`, `discovery-engine`, `story-engine`, `map-engine`)은 어디서도 사용되지 않는 고립된 코드였으며, 정리 PR을 통해 삭제했습니다. 필요하면 git 히스토리에서 확인할 수 있습니다.

## 개발 명령

```bash
npm run dev            # 로컬 개발 서버
npm run build           # 프로덕션 빌드
npm run typecheck       # 타입 검사
npm run harness:check   # 필수 문서/브랜딩 가드
npm run design:check    # 디자인 토큰(raw 색상값 금지) 가드
npm run visual:test     # Playwright 시각 회귀 테스트
```
