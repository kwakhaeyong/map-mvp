# MAP Release Automation

## GitHub Actions

- `MAP Quality Gate`: PR마다 typecheck, harness, design check, production build를 실행합니다.
- `Guarded Auto Merge`: Quality Gate 통과 후 `feature/`, `fix/`, `chore/`, `codex/` 브랜치 PR을 squash merge합니다.
- `Production Smoke Check`: main 반영 후 Vercel 배포를 기다린 뒤 `https://mapdecision.com`이 HTTP 200과 `MAP Decision` 문구를 반환하는지 확인합니다. 실패하면 GitHub Issue를 생성합니다.

## n8n

`map-release-monitor.json`을 n8n에 import하고 활성화하면 5분마다 Production URL을 확인합니다.

알림을 받으려면 `Raise deployment alert` 노드의 Error Workflow에 Telegram, Slack 또는 Gmail 알림 노드를 연결하세요. 이 단계는 사용 중인 n8n 인스턴스와 credential이 필요하므로 저장소에서는 credential을 보관하지 않습니다.

## 운영 원칙

ChatGPT에서 “반영하자” 요청 → 작업 브랜치/PR → Quality Gate → 자동 병합 → Vercel Production → Smoke Check 순서로 진행합니다.
