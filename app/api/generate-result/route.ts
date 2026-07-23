import { NextRequest, NextResponse } from "next/server";
import { generateFinalResult } from "../../../src/map-decision-v1/engine/final-result-generator";
import { FinalResult, MapSession } from "../../../src/map-decision-v1/types";

type RequestBody = { session: MapSession };
type SuccessResponse = { result: FinalResult };
type BlockedResponse = { blocked: true; reason: string; message: string };

function isRequestBody(value: unknown): value is RequestBody {
  if (typeof value !== "object" || value === null) return false;
  const candidate = value as Partial<RequestBody>;
  return typeof candidate.session === "object" && candidate.session !== null;
}

export async function POST(request: NextRequest) {
  const body: unknown = await request.json().catch(() => null);
  if (!isRequestBody(body)) {
    return NextResponse.json(
      { blocked: true, reason: "invalid_request", message: "요청 형식이 올바르지 않아요." } satisfies BlockedResponse,
      { status: 400 },
    );
  }

  const result = await generateFinalResult(body.session);
  if (!result) {
    return NextResponse.json(
      { blocked: true, reason: "generation_failed", message: "지금은 결과를 생성할 수 없어요. 잠시 후 다시 시도해 주세요." } satisfies BlockedResponse,
      { status: 502 },
    );
  }

  return NextResponse.json({ result } satisfies SuccessResponse);
}
