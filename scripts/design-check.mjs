import { readFileSync } from "node:fs";
import { execSync } from "node:child_process";

// ★#116에서 발견: 브레이스 확장({ts,tsx,css})은 셸 기능이라 git의
// pathspec 매칭에선 적용되지 않는다 — 즉 이 파일이 생긴 이래로
// 이 스크립트는 대상 파일을 단 한 개도 찾지 못하고 있었다(design:check가
// 실제로는 아무것도 검사하지 않고 항상 통과만 시킨 상태였다). git으로
// app/·src/ 아래 전체 추적 파일만 받아오고, 확장자 필터링은 JS에서
// 직접 한다.
const files = execSync("git ls-files -- app src", { encoding: "utf8" })
  .trim()
  .split("\n")
  .filter((file) => /\.(ts|tsx|css)$/.test(file));

// 주석 안 내용은 실제 코드가 아니다 — "#116" 같은 이슈 번호나, 버그를
// 설명하며 예시로 적은 클래스명("bg-primary/10" 등)까지 위반으로
// 잡으면 안 된다. "://"(URL)는 주석 시작이 아니므로 보존한다. JSX
// 주석({/* ... */})처럼 여러 줄에 걸치는 블록 주석도 있어서, 파일
// 전체를 먼저 훑어 블록 주석을 지우고(줄 번호가 안 밀리게 줄바꿈
// 개수는 남긴다) 그다음 줄 단위로 // 주석을 지운다.
function stripComments(fileContent) {
  const withoutBlockComments = fileContent.replace(/\/\*[\s\S]*?\*\//g, (match) => "\n".repeat((match.match(/\n/g) ?? []).length));
  return withoutBlockComments.split("\n").map((line) => {
    const commentStart = line.search(/(?<!:)\/\//);
    return commentStart === -1 ? line : line.slice(0, commentStart);
  });
}

const tokenFiles = new Set([
  "src/styles/design-tokens.css",
  "app/globals.css",
  "tailwind.config.ts",
  "src/map-decision-v1/engine/ideal-type-card-colors.ts",
]);
const rawColor = /(?:#[0-9a-fA-F]{3,8}\b|rgba?\(|hsla?\()/;
const offenders = [];
for (const file of files) {
  if (tokenFiles.has(file)) continue;
  const lines = stripComments(readFileSync(file, "utf8"));
  lines.forEach((line, index) => {
    if (rawColor.test(line)) offenders.push(`${file}:${index + 1}`);
  });
}
if (offenders.length) throw new Error(`Raw color values outside token/global files:\n${offenders.join("\n")}`);

// #116: tailwind.config.ts의 커스텀 색(전부 var(--color-x) 형태)엔
// Tailwind가 bg-primary/10 같은 슬래시 투명도 유틸리티를 생성해주지
// 못한다 — 클래스는 그대로 있고 빌드도 통과하지만 실제로는 항상
// 투명하게 렌더링되는, 조용히 실패하는 버그다. 새 슬래시 클래스가
// 또 추가되는 걸 여기서 막는다. 새 커스텀 색 토큰을 tailwind.config.ts에
// 추가하면 아래 목록도 같이 갱신해야 한다.
const CUSTOM_COLOR_TOKENS = [
  "background(-subtle)?",
  "surface(-elevated)?",
  "border(-strong)?",
  "text-primary",
  "text-secondary",
  "text-muted",
  "primary(-hover|-foreground)?",
  "focus",
  "fact",
  "feeling",
  "value",
  "option",
  "uncertainty",
  "risk",
  "action",
  "success",
  "error",
];
const opacityClass = new RegExp(`(?:bg|text|border|fill|stroke|ring|divide|outline|from|to|via|decoration|caret|accent)-(?:${CUSTOM_COLOR_TOKENS.join("|")})/\\d+`, "g");

// 이미 존재하던(이번 #116 스코프 밖) 위반은 당장 고치지 않고 여기 등록만
// 해둔다 — 등록되지 않은 새 위반만 실패시킨다. 목록에서 항목을 지우는
// 것 자체가 "이 부분도 고쳤다"는 뜻이 되게 한다.
//
// 12개 중 6개를 실제로 고쳐서 목록에서 뺐다(design-tokens.css의
// primary-foreground-soft/wash 등 기존 토큰과, 이번에 새로 추가한
// error-soft-border/primary-border-soft 토큰으로 교체) — 전부 (a) 이미
// 어두운/칠해진 배경 위의 보조 텍스트·아이콘을 살짝 옅게 하거나(원래도
// 그 배경 위에서만 보이는 디테일이라 색 자체가 새로 생기지 않음),
// (b) hover 전용이라 기본 화면 스크린샷에는 아예 안 보이거나,
// (c) 앱 어디서도 쓰이지 않는 죽은 코드 경로라 실제 시각 변화가 없는
// 경우다. 남은 6개는 전부 "지금 화면에 안 보이던 색이 새로 뚜렷하게
// 보이기 시작하는" 경우라 진로·퀴즈·랜딩 화면 톤을 눈에 띄게 바꾸지
// 말라는 이번 지시에 따라 그대로 남겨둔다 — 아래 각 줄 참고.
const KNOWN_OPACITY_DEBT = {
  // 진로(career) 자유 대화 화면. bg-background/90은 sticky 헤더의 배경
  // 채움(현재는 blur만 있고 채움이 아예 없어 사실상 투명) — 실제로
  // 고치면 스크롤마다 항상 보이는 헤더 전체가 크림색으로 뚜렷하게
  // 채워져 톤이 눈에 띄게 바뀐다. bg-uncertainty/10·border-uncertainty/50은
  // 되묻기(follow-up) 힌트 박스 배경·테두리 한 쌍(하나만 고치면 배경
  // 없이 테두리만/테두리 없이 배경만 남아 더 어색해져 항상 같이 남긴다)
  // — 지금은 아예 안 보이는 박스가 새로 노란빛 카드로 나타나는 변화라
  // 마찬가지로 눈에 띈다.
  "src/map-decision-v1/components/Conversation.tsx": ["bg-background/90", "bg-uncertainty/10", "border-uncertainty/50"],
  // 진로 결과 화면의 "핵심 메시지·통찰" 카드 강조 테두리 — 지금은 다른
  // 카드와 똑같은 회색 테두리로 보이는데, 고치면 이 카드만 남색 테두리로
  // 도드라져서 눈에 띄는 변화가 된다.
  "src/map-decision-v1/components/FinalResultBlocks.tsx": ["border-primary/40"],
  // 랜딩(시작) 화면의 "딱 맞는 게 없나요?" 안전망 카드 배경 — hover
  // 테두리(border-primary/40)는 이번에 고쳤지만, 이 배경은 기본 상태에서
  // 항상 보이는 값이라 지금의 "테두리만 있고 배경은 없는" 모습에서
  // 옅은 흰색 카드로 눈에 띄게 바뀐다.
  "src/map-decision-v1/components/Landing.tsx": ["bg-surface/60"],
  // Badge(border-border/60)는 이상형·나소개·진로·랜딩·공유 화면 전체에서
  // 공유하는 컴포넌트라, 고치면 모든 화면의 모든 배지에 테두리가 동시에
  // 새로 생긴다 — 12개 중 가장 넓은 범위로 눈에 띄는 변화라 이번에도
  // 제외한다. bg-primary/20은 VoiceButton이 음성 인식 중에 보여주는
  // 펄스 글로우 배경(지금은 애니메이션은 돌지만 채움이 없어 안 보임) —
  // 퀴즈·진로 화면의 음성 입력 중에만 나타나는 상태라 마찬가지로
  // 이번 스코프 밖으로 남긴다.
  "src/map-decision-v1/components/ui/primitives.tsx": ["bg-primary/20", "border-border/60"],
};

const opacityOffenders = [];
for (const file of files) {
  const debt = new Set(KNOWN_OPACITY_DEBT[file] ?? []);
  const lines = stripComments(readFileSync(file, "utf8"));
  lines.forEach((line, index) => {
    for (const match of line.matchAll(opacityClass)) {
      if (debt.has(match[0])) continue;
      opacityOffenders.push(`${file}:${index + 1}: ${match[0]}`);
    }
  });
}
if (opacityOffenders.length) {
  throw new Error(
    `커스텀 색 토큰에 슬래시 투명도 클래스가 있습니다(#116 — Tailwind가 이 색들엔 해당 유틸리티를 생성하지 못해 조용히 투명해집니다). SVG는 fillOpacity 속성을, HTML은 design-tokens.css에 새 토큰을 추가하는 방식을 쓰세요:\n${opacityOffenders.join("\n")}`,
  );
}

console.log("Design check passed.");
