import { MapNode, MapRelation, MapSession, NodeKind, RelationKind } from "../types";
import { createId, now } from "./session";

export const nodeLabels: Record<NodeKind, string> = {
  topic: "핵심 주제", trigger: "계기", fact: "사실", emotion: "감정", person: "사람", value: "가치", reason: "이유", constraint: "제약", option: "선택지", benefit: "장점", risk: "리스크", missing: "확인할 정보", direction: "방향", action: "행동", correction: "수정된 이해",
};

export function inferNodeKind(text: string, existing: MapNode[]): NodeKind {
  const normalized = text.toLowerCase();
  if (!existing.some((node) => node.kind === "topic")) return "topic";
  if (/회사|학교|기간|월급|비용|성적|조건|상황|현재|이미/.test(normalized)) return "fact";
  if (/불안|걱정|답답|좋|싫|무섭|기대|아쉽|후회|편해|힘들|설레|지침/.test(normalized)) return "emotion";
  if (/성장|자유|안정|돈|시간|관계|건강|경험|커리어|가치|배움|자율/.test(normalized)) return "value";
  if (/선택|방법|하거나|또는|갈까|살까|할까|남|옮|시작|유학|여행|자취|고백/.test(normalized)) return "option";
  if (/좋은 점|장점|얻|도움|가능성|기회|넓/.test(normalized)) return "benefit";
  if (/리스크|위험|부담|비용|잃|문제|단점|불확실|손해/.test(normalized)) return "risk";
  if (/확인|모르|알아보|정보|조건|물어|검증|찾아/.test(normalized)) return "missing";
  if (/오늘|내일|이번 주|24시간|먼저|예약|보내|정리|검색|연락|작성/.test(normalized)) return "action";
  if (/때문|왜냐|이유|느낌|계기|반복/.test(normalized)) return "reason";
  return existing.length < 2 ? "trigger" : existing.length < 5 ? "reason" : "direction";
}

export function relationFor(kind: NodeKind): RelationKind {
  if (kind === "option") return "대안";
  if (kind === "benefit") return "장점";
  if (kind === "risk") return "리스크";
  if (kind === "missing") return "확인 필요";
  if (kind === "action") return "다음 행동";
  if (kind === "emotion") return "영향";
  return "원인";
}

export function extractThinking(text: string, session: MapSession, correction = false): { nodes: MapNode[]; relations: MapRelation[] } {
  const pieces = text.split(/[\n.!?。]|그리고|하지만|반대로|,/).map((piece) => piece.trim()).filter((piece) => piece.length > 1).slice(0, 4);
  const nodes = (pieces.length ? pieces : [text]).map((piece) => {
    const kind = correction ? "correction" : inferNodeKind(piece, session.nodes);
    return { id: createId("node"), kind, label: nodeLabels[kind], text: piece, confidence: correction ? "confirmed" : "user", createdAt: now() } satisfies MapNode;
  });
  const center = session.nodes.find((node) => node.kind === "topic")?.id || nodes.find((node) => node.kind === "topic")?.id;
  const relations = nodes.filter((node) => center && node.id !== center).map((node) => ({
    id: createId("rel"),
    from: center!,
    to: node.id,
    kind: relationFor(node.kind),
    strength: node.kind === "risk" || node.kind === "missing" ? "dotted" : node.kind === "value" || node.kind === "action" ? "accent" : "solid",
  } satisfies MapRelation));
  return { nodes, relations };
}
