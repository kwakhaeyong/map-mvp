# 현재 상태 (Current State)

이 문서는 특정 시점의 운영 현황을 기록합니다. 계획이나 예정된 작업은 담지 않습니다.

## 코드

- 실제로 운영되는 서비스 코드는 **`src/map-decision-v1`** 하나뿐입니다.
- 과거에 존재했던 미사용 실험 코드(`src/map-os`, `src/conversation-engine`, `src/discovery-engine`, `src/story-engine`, `src/map-engine`, `app/components/IdealTypeResult.tsx`)는 삭제되었습니다.

## 제품 정의 기준 문서

- 제품이 무엇인지/무엇이 아닌지에 대한 기준 문서는 **`docs/MAP_CONSTITUTION.md`**, **`docs/MAP_DESIGN_SYSTEM.md`**입니다.
- `README.md`는 제품 정의 기준 문서가 아닙니다.

## CI (자동 검사)

- `.github/workflows/quality-gate.yml`이 PR마다 `typecheck`, `harness:check`, `design:check`, `build`를 실행합니다.
- 이 검사는 GitHub 저장소의 필수 상태 체크(required status check)로 등록되어 있습니다.

## 브랜치 보호 / 머지 방식

- `main` 브랜치는 PR을 통해서만 반영할 수 있습니다.
- `chore/` 브랜치는 위 검사를 통과하면 자동으로 머지됩니다.
- `feature/` 브랜치는 오너가 직접 확인한 뒤 수동으로 머지합니다.

## 배포

- Vercel 프로젝트는 **`map-mvp-46zk`** 하나만 사용하며, 도메인 `mapdecision.com`이 여기에 연결되어 있습니다.
- 과거 존재했던 중복 Vercel 프로젝트는 삭제되었습니다.

## 모니터링

- n8n(n8n.io 클라우드)의 "MAP 릴리스 모니터" 워크플로가 1시간마다 `mapdecision.com`의 상태를 확인합니다.
- 비정상 상태가 감지되면 이메일로 알림을 발송합니다.
