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
const KNOWN_OPACITY_DEBT = {
  // #92 자기성찰 다크 블록 — 오너 지시로 이번 스코프에서 의도적으로 제외.
  "src/map-decision-v1/components/IdealTypeResultBlocks.tsx": [
    "text-primary-foreground/70",
    "bg-primary-foreground/15",
    "border-primary-foreground/15",
    "border-primary-foreground/25",
    "text-primary-foreground/90",
  ],
  // SelfIntroResultBlocks.tsx가 위 IdealTypeResultBlocks.tsx의 자기성찰
  // 다크 블록을 그대로 복제하면서(#stage2) 같은 빚도 함께 들어왔다 — 새
  // 파일이라 이 목록에 없어 검사가 새 위반으로 잡아냈을 뿐, 실제로는
  // 위 항목과 동일한 기존 결정을 그대로 따른 것이다.
  "src/map-decision-v1/components/SelfIntroResultBlocks.tsx": [
    "text-primary-foreground/70",
    "bg-primary-foreground/15",
    "border-primary-foreground/15",
    "border-primary-foreground/25",
    "text-primary-foreground/90",
  ],
  // 퀴즈 화면 — 테스트 세션 중 화면 변경 금지로 이번 스코프에서 제외.
  "src/map-decision-v1/components/TopicQuiz.tsx": ["text-primary-foreground/80", "bg-primary-foreground/20"],
  // 진로(career) 자유 대화 화면 — 이번 스코프(이상형)에서 제외.
  "src/map-decision-v1/components/Conversation.tsx": ["bg-background/90", "bg-uncertainty/10", "border-uncertainty/50", "bg-primary/5"],
  "src/map-decision-v1/components/FinalResultBlocks.tsx": ["border-primary/40"],
  // 랜딩(시작) 화면 — 이번 스코프 밖.
  "src/map-decision-v1/components/Landing.tsx": ["bg-surface/60", "border-primary/40"],
  // 공용 컴포넌트 — Badge/Button은 퀴즈 화면과 공유해서 이번엔 건드리지 않음.
  "src/map-decision-v1/components/ui/primitives.tsx": ["border-error/30", "bg-primary/20", "border-border/60"],
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
