import { Redis } from "@upstash/redis";

// share-store.ts(공유 링크)와 rate-limit.ts(생성 한도)가 같은 Upstash
// Redis 인스턴스를 쓴다 — 연결 설정 로직을 여기 한 곳에만 둔다.
// Vercel 프로젝트에 Upstash를 연결하면 UPSTASH_REDIS_REST_URL/
// UPSTASH_REDIS_REST_TOKEN 환경변수가 자동으로 채워진다. 연결 정보가
// 없으면(로컬 개발, 아직 연결 전인 배포) null을 반환해 호출부가 각자
// "지금은 이 기능을 쓸 수 없어요"로 처리하게 한다.
let client: Redis | null | undefined;

export function getRedisClient(): Redis | null {
  if (client !== undefined) return client;
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) {
    // client가 undefined인 동안만 이 분기를 타므로(위 얼리 리턴), 이 로그는
    // 요청마다가 아니라 프로세스(함수 인스턴스)당 한 번만 찍힌다 — 별도
    // 플래그 없이 기존 메모이제이션 변수를 그대로 재사용한다.
    console.error("[redis-client] UPSTASH_REDIS_REST_URL/UPSTASH_REDIS_REST_TOKEN not set — Redis unavailable");
  }
  // 자동 파이프라이닝(같은 틱 안의 여러 호출을 한 요청으로 묶는 기능)은
  // 끈다 — 호출마다 단순한 단일 명령 요청이 되어 동작을 예측하기 쉽다.
  client = url && token ? new Redis({ url, token, enableAutoPipelining: false }) : null;
  return client;
}
