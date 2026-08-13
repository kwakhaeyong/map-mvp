# PERSONAL MAGAZINE — KEEP / 유료화 방향 메모 (2026-08, 개발 참고용)

이 문서는 오너와 논의한 유료화 방향을 **코드로 구현하지 않고** 글로만
남겨두는 아키텍처 메모다. 지금 시점에는 결제 기능을 절대 구현하지
않는다 — 이 문서에 적힌 내용은 전부 "나중에 이렇게 갈 수 있다"는
방향성이지, 지금 만들어야 할 작업 목록이 아니다.

## 1. 핵심 원칙 — DISCOVER → CREATE → COMPLETE → KEEP

```
DISCOVER   (둘러본다, 다른 사람의 Magazine을 구경한다)
  ↓
CREATE     (질문에 답하며 내 챕터를 만든다)
  ↓
COMPLETE   (챕터가 완성된다, 공유할 수 있다)
  ↓
KEEP       (내 것으로 소유한다 — 여기서부터 유료)
```

핵심 문장(오너 표현 그대로):

> 보기는 무료. 공유도 무료. 간직하는 순간부터 유료.

### 등급 구분

| 등급 | 포함 범위 |
|---|---|
| FREE | Experience(체험) + Preview(미리보기) + Share(공유) |
| PAID DIGITAL | Own(소유) + Full Issue(전체 호) + High Resolution(고해상도) + PDF/Download |
| PAID PHYSICAL | Keep(간직) + Frame(액자) + Premium Print(고급 인쇄) + Printed Magazine(실물 잡지) |

무료 사용자도 만들고 공유하는 경험 전체를 문제없이 쓸 수 있어야 한다.
유료는 "더 잘 보이게" 하는 게 아니라 "내 것으로 만들어 간직하게" 하는
지점에서 시작한다.

## 2. 향후 KEEP 상품 후보 (documentation 전용, 구현 아님)

```
DIGITAL ISSUE       — PDF / E-매거진 형태로 소장
COVER FRAME         — 표지 이미지를 액자용으로 인쇄
PREMIUM PRINT       — 고급지에 인쇄한 한 페이지/스프레드
PRINTED MAGAZINE    — 완성된 Magazine 전체를 실물 책자로 인쇄
ISSUE BOX           — 여러 호를 모아 보관하는 박스
CARD DECK           — 챕터별 카드 세트
```

현재 우선순위로 논의된 것은 **Cover Frame · Printed Magazine ·
Premium Print** 세 가지다. 나머지(ISSUE BOX, CARD DECK)는 더 먼
미래의 아이디어로만 남겨둔다.

## 3. Preview / Ownership 자산 분리 원칙 (향후 아키텍처 TODO)

장기적으로 무료 사용자에게 보여주는 **Preview asset**과 유료
소유자에게 주는 **Owned asset**은 서로 다른 파일/해상도로 분리해야
한다.

```
PREVIEW ASSET (무료로 보여지는 것)
- 상대적으로 낮은 해상도
- 브랜드가 보이는, 공유하기 좋은 형태
- 선택적으로 editorial watermark(워터마크) 포함 가능

OWNED ASSET (유료로 소유한 것)
- 고해상도 원본
- 워터마크 없음
- 다운로드 가능
- 인쇄 가능
```

**전제**: 웹 화면 캡처(스크린샷)를 완전히 막을 수 있다는 가정으로
설계하지 않는다. 대신 애초에 고해상도 원본을 무료 Preview 화면에
그대로 노출하지 않는 구조 — 즉 "원본은 처음부터 다른 곳(유료
경로)에만 존재한다"는 방향을 향후 아키텍처 TODO로 남겨둔다.

**지금 하지 않는 것**: DRM, 스크린샷 방지, 워터마크 자동 삽입
파이프라인 — 전부 구현하지 않는다. 지금 단계는 이 원칙을 기록해
두는 것까지다.

## 4. 이 문서의 위치

이 문서는 `docs/MAP_CONSTITUTION.md` / `docs/MAP_DESIGN_SYSTEM.md`와
달리 **PERSONAL MAGAZINE 프로토타입(`/dev/personal-magazine-*`
라우트들) 전용 참고 메모**다. 현재 운영 중인 서비스
(`src/map-decision-v1`)의 정책이나 가격 정책을 바꾸지 않는다.
