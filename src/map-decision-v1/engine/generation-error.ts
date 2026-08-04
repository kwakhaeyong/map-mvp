import Anthropic from "@anthropic-ai/sdk";

// 생성 실패의 원인이 "서버·인프라 쪽"인지 "입력·출력 내용 쪽"인지 판정한다.
// rate-limit.ts의 세션당 실패 상한(MAX_FAILED_GENERATIONS_PER_SESSION)이
// 이 값을 보고 gen-fail 카운터를 올릴지 정한다 — 우리 쪽 문제(API 키
// 미설정, Anthropic 5xx/과부하, 네트워크·타임아웃)로 실패했는데 그걸
// 사용자 탓으로 세면, 완주에 7~8분 걸리는 퀴즈를 다 마친 사용자가 서버
// 사정으로 두어 번 실패한 것만으로 아무 결과도 못 받고 차단된다(실제로
// 프리뷰 환경에서 API 키 미설정으로 이 사고가 났다).
//
// true(서버 탓) → 카운트하지 않는다. false(입력/출력 내용 탓) → 카운트한다.
//
// 400(BadRequestError)만 예외로 false(카운트)를 준다 — 우리가 Anthropic에
// 보내는 요청은 시스템 프롬프트·스키마가 고정 문자열이라, 400이 날 수
// 있는 유일한 변수는 사용자가 채운 답변(특히 자유 서술)의 총 길이가
// 모델 컨텍스트 한도를 넘기는 경우다. 이걸 "서버 탓"으로 빼주면 극단적
// 으로 긴 입력을 반복 제출해 매번 400을 유도하는 방식으로 실패 상한을
// 무한정 우회할 수 있다 — 세션/IP 슬롯은 실패 시 항상 되돌려주므로(
// releaseGenerationSlotOnFailure), 실패 상한이 사실상 "같은 세션에서
// 반복 호출"을 막는 유일한 장치다.
//
// empty response(빈 응답)·스키마 검증 실패는 이 함수를 거치지 않는다 —
// catch(error)로 안 잡히는, API 호출은 성공했지만 내용이 이상한
// 경우라 호출부에서 직접 카운트 처리한다(항상 카운트).
export function isServerSideGenerationError(error: unknown): boolean {
  // APIConnectionError는 status가 없다 — 네트워크 단절, DNS 실패,
  // APIConnectionTimeoutError(타임아웃)까지 전부 이 클래스(또는 그
  // 하위 클래스)로 온다. 요청 내용과 무관하게 인프라 사정이라 항상
  // 서버 탓으로 본다.
  if (error instanceof Anthropic.APIConnectionError) return true;
  if (error instanceof Anthropic.APIError) {
    if (error.status === 400) return false;
    // 401(키 미설정/무효)·403(권한 없음)·404/409/422(우리 쪽 요청 구성
    // 문제)·429(Anthropic 레이트리밋)·5xx(529 과부하 포함) 전부 계정·
    // 설정·인프라 문제이지, 이 사용자가 무엇을 입력했든 똑같이 났을
    // 문제다.
    return true;
  }
  // Anthropic 에러가 아닌, 분류할 수 없는 예외 — 판단이 애매하면
  // 카운트하지 않는 쪽(서버 탓 취급)으로 둔다.
  return true;
}
