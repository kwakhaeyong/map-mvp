"use client";

import { useState } from "react";
import { createSession } from "../../src/map-decision-v1/engine/session";
import { MapSession, MapOutputType } from "../../src/map-decision-v1/types";
import { Result } from "../../src/map-decision-v1/components/Result";

function sampleResult(): MapSession {
  const session = createSession("이직할까?");
  return {
    ...session,
    stage: "result",
    preferredMapType: "decision",
    messages: [...session.messages, { id: "route-user", role: "user", text: "성장감은 줄었지만 생활비와 팀 분위기는 안정적이라 바로 움직이기 망설여져요.", timestamp: session.startedAt }],
    nodes: [
      ...session.nodes,
      { id: "route-fact", kind: "fact", label: "내가 말한 상황", text: "성장감은 줄었지만 팀 분위기는 안정적", confidence: "user", createdAt: session.startedAt },
      { id: "route-value", kind: "value", label: "중요한 기준", text: "성장과 안정의 균형", confidence: "confirmed", createdAt: session.startedAt },
      { id: "route-option", kind: "option", label: "가능한 방향", text: "바로 퇴사보다 내부 이동과 채용시장 확인", confidence: "ai", createdAt: session.startedAt },
      { id: "route-risk", kind: "risk", label: "걸리는 부분", text: "생활비 공백과 새 조직 적응 부담", confidence: "ai", createdAt: session.startedAt },
      { id: "route-missing", kind: "missing", label: "확인할 내용", text: "관심 회사 조건과 3개월 생활비", confidence: "ai", createdAt: session.startedAt },
      { id: "route-action", kind: "action", label: "다음 행동", text: "이번 주 안에 채용공고 3개와 내부 이동 가능성을 확인하기", confidence: "ai", createdAt: session.startedAt },
    ],
    relations: [
      { id: "route-rel-1", from: "topic", to: "route-fact", kind: "원인", strength: "solid" },
      { id: "route-rel-2", from: "topic", to: "route-value", kind: "영향", strength: "accent" },
      { id: "route-rel-3", from: "topic", to: "route-option", kind: "대안", strength: "solid" },
      { id: "route-rel-4", from: "topic", to: "route-risk", kind: "리스크", strength: "dotted" },
      { id: "route-rel-5", from: "topic", to: "route-missing", kind: "확인 필요", strength: "dotted" },
      { id: "route-rel-6", from: "topic", to: "route-action", kind: "다음 행동", strength: "accent" },
    ],
  };
}

export default function ResultPage() {
  const [session, setSession] = useState<MapSession>(() => sampleResult());
  const selectType = (type: MapOutputType) => setSession((current) => ({ ...current, preferredMapType: type }));
  return <Result session={session} onContinue={() => setSession((current) => ({ ...current, stage: "conversation" }))} onReset={() => setSession(sampleResult())} onSelectType={selectType} onRealStart={() => setSession(createSession())} />;
}
