import { readFileSync } from "node:fs";

// 이상형 퀴즈의 5개 시각적 선택 문항(hairStyle/hairColor/clothingStyle/
// accessory/colorImpression)이 topics.ts에서 갖고 있는 옵션 라벨을 전부
// engine/ideal-type-silhouette.ts의 라벨→부품 매핑 테이블이 알고 있는지
// 빌드 시점에 확인한다. 하나라도 빠지면 실루엣 렌더링이 조용히 기본값
// (또는 그림 생략)으로 떨어진다 — PR #79가 겪은 문제(라벨이 바뀌었는데
// 매핑 테이블은 그대로라 타입 에러 없이 계속 통과됨)를 여기서 막는다.

const TOPICS_PATH = "src/map-decision-v1/engine/topics.ts";
const SILHOUETTE_PATH = "src/map-decision-v1/engine/ideal-type-silhouette.ts";

const AXIS_TO_TABLE = {
  hairStyle: "HAIR_STYLE_LABEL_TO_KEY",
  hairColor: "HAIR_COLOR_LABEL_TO_KEY",
  clothingStyle: "CLOTHING_STYLE_LABEL_TO_KEY",
  accessory: "ACCESSORY_LABEL_TO_KEY",
  colorImpression: "COLOR_IMPRESSION_LABEL_TO_KEY",
};

function extractOptionsBlock(source, axisId) {
  const idMarker = `id: "${axisId}"`;
  const idIndex = source.indexOf(idMarker);
  if (idIndex === -1) throw new Error(`topics.ts에서 축 "${axisId}"를 찾을 수 없습니다.`);
  const optionsStart = source.indexOf("options: [", idIndex);
  if (optionsStart === -1) throw new Error(`축 "${axisId}"의 options 배열을 찾을 수 없습니다.`);
  const bracketStart = source.indexOf("[", optionsStart);
  let depth = 0;
  let end = -1;
  for (let i = bracketStart; i < source.length; i++) {
    if (source[i] === "[") depth++;
    else if (source[i] === "]") {
      depth--;
      if (depth === 0) {
        end = i;
        break;
      }
    }
  }
  if (end === -1) throw new Error(`축 "${axisId}"의 options 배열이 닫히지 않았습니다.`);
  return source.slice(bracketStart, end + 1);
}

function extractLabels(optionsBlock) {
  return [...optionsBlock.matchAll(/label:\s*"([^"]+)"/g)].map((match) => match[1]);
}

function extractMappingKeys(source, tableName) {
  const constMarker = `${tableName}: Record<string,`;
  const constIndex = source.indexOf(constMarker);
  if (constIndex === -1) throw new Error(`ideal-type-silhouette.ts에서 "${tableName}" 테이블을 찾을 수 없습니다.`);
  const braceStart = source.indexOf("{", constIndex);
  let depth = 0;
  let end = -1;
  for (let i = braceStart; i < source.length; i++) {
    if (source[i] === "{") depth++;
    else if (source[i] === "}") {
      depth--;
      if (depth === 0) {
        end = i;
        break;
      }
    }
  }
  if (end === -1) throw new Error(`"${tableName}" 테이블이 닫히지 않았습니다.`);
  const block = source.slice(braceStart, end + 1);
  return new Set([...block.matchAll(/"([^"]+)":\s*"[A-Za-z]+"/g)].map((match) => match[1]));
}

const topicsSource = readFileSync(TOPICS_PATH, "utf8");
const silhouetteSource = readFileSync(SILHOUETTE_PATH, "utf8");

const failures = [];

for (const [axisId, tableName] of Object.entries(AXIS_TO_TABLE)) {
  const labels = extractLabels(extractOptionsBlock(topicsSource, axisId));
  if (labels.length === 0) failures.push(`축 "${axisId}"에서 라벨을 하나도 못 찾았습니다(추출 로직 확인 필요).`);
  const mappedKeys = extractMappingKeys(silhouetteSource, tableName);
  const missing = labels.filter((label) => !mappedKeys.has(label));
  if (missing.length > 0) {
    failures.push(`축 "${axisId}"의 옵션 라벨이 ${tableName}에 없습니다: ${missing.map((label) => `"${label}"`).join(", ")}`);
  }
}

if (failures.length > 0) {
  throw new Error(`실루엣 라벨 매핑이 topics.ts와 어긋납니다 — 라벨이 바뀌었으면 engine/ideal-type-silhouette.ts의 매핑 테이블도 같이 고쳐야 합니다.\n${failures.join("\n")}`);
}

console.log("Silhouette label mapping check passed.");
