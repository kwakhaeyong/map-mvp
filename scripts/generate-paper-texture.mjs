// 초대장 컨셉 card.png 배경에 쓰는 아주 옅은 종이 질감 타일을 코드로
// 만든다. 외부에서 텍스처 이미지를 내려받지 않는다(저작권 문제를
// 피하려고 — 이 파일이 유일한 출처다). 결과물은 assets/textures/
// paper-noise.png에 저장되고, ideal-type-card-image.tsx가 이 파일을
// data URI로 읽어 satori의 backgroundImage로 타일링한다.
//
// "질감이 있다"고 눈에 띄면 이미 과한 것 — 타일 하나하나는 진하지
// 않은 잉크색(네이비) 반점을 아주 낮은 불투명도(2~9/255)로만 찍는다.
// 단순 픽셀별 랜덤(화이트 노이즈)은 TV 잡음처럼 거칠어 보여서, 3번
// 겹쳐 평균낸 값을 써서 결을 부드럽게 만든다.
import { statSync } from "node:fs";
import path from "node:path";
import sharp from "sharp";

const TILE_SIZE = 48;
const INK_RGB = [21, 33, 59]; // CARD_COLORS.primary(#15213b)와 동일
const MIN_ALPHA = 2;
const MAX_ALPHA = 9;

function smoothedRandom() {
  // 랜덤 3개를 평균 내 극단값(너무 진하거나 너무 옅은 반점)의 빈도를
  // 줄인다 — 중심으로 몰리는 분포가 더 균일한 결로 보인다.
  return (Math.random() + Math.random() + Math.random()) / 3;
}

function buildTile() {
  const channels = 4;
  const buffer = Buffer.alloc(TILE_SIZE * TILE_SIZE * channels);
  for (let i = 0; i < TILE_SIZE * TILE_SIZE; i++) {
    const alpha = Math.round(MIN_ALPHA + smoothedRandom() * (MAX_ALPHA - MIN_ALPHA));
    const offset = i * channels;
    buffer[offset] = INK_RGB[0];
    buffer[offset + 1] = INK_RGB[1];
    buffer[offset + 2] = INK_RGB[2];
    buffer[offset + 3] = alpha;
  }
  return buffer;
}

async function main() {
  const raw = buildTile();
  const outputPath = path.join(process.cwd(), "assets/textures/paper-noise.png");
  await sharp(raw, { raw: { width: TILE_SIZE, height: TILE_SIZE, channels: 4 } })
    .png({ compressionLevel: 9, palette: true })
    .toFile(outputPath);
  const { size } = statSync(outputPath);
  console.log(`paper-noise.png 생성 완료: ${size} bytes (${TILE_SIZE}x${TILE_SIZE})`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
