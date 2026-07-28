#!/usr/bin/env python3
"""초대장 컨셉 card.png의 세리프(Noto Serif KR)를 KS X 1001 상용
2,350자 + 라틴/기본 문장부호 범위로 서브셋한다.

이상형 결과 문장은 AI가 자유롭게 쓰는 한국어 산문이라, 이론상으로는
KS X 1001 밖의 희귀 음절(예: 고어체 조합)이 나올 가능성이 0은 아니다.
그래서 card.png 렌더링 쪽(ideal-type-card-image.tsx)에서 이 세리프
+ Pretendard를 폴백으로 함께 넘긴다 — 세리프에 없는 글자만 Pretendard로
자동 대체되고, 두부(tofu) 빈 박스가 나오는 일은 없다.

KS X 1001 2,350자 목록은 외부 파일 없이, 파이썬 표준 라이브러리의
euc_kr 코덱으로 그 표준이 정의하는 실제 조합(행 0xB0~0xC8)을 그대로
디코딩해서 구한다 — 임의로 고른 목록이 아니라 표준 자체에서 도출한
값이라 정확하다(직접 실행해서 정확히 2,350자가 나오는 것을 확인함).

사용법:
    python3 scripts/subset-noto-serif-kr.py <가변폰트.ttf 경로>

가변 폰트 원본은 google/fonts 저장소(ofl/notoserifkr/NotoSerifKR[wght].ttf,
SIL Open Font License)에서 받은 것을 인자로 넘긴다 — 이 스크립트 자체는
네트워크에 접근하지 않는다(재현성 때문에 다운로드는 별도로 한 번만 하고
그 결과를 인자로 넘기는 방식을 택했다).
"""
import subprocess
import sys
from pathlib import Path

OUTPUT_DIR = Path(__file__).resolve().parent.parent / "assets/fonts/noto-serif-kr"


def ks_x_1001_hangul_syllables() -> str:
    chars = set()
    for lead in range(0xB0, 0xC9):
        for trail in range(0xA1, 0xFF):
            try:
                decoded = bytes([lead, trail]).decode("euc_kr")
            except UnicodeDecodeError:
                continue
            if len(decoded) == 1 and 0xAC00 <= ord(decoded) <= 0xD7A3:
                chars.add(decoded)
    assert len(chars) == 2350, f"expected 2350 KS X 1001 syllables, got {len(chars)}"
    return "".join(sorted(chars))


def unicode_ranges() -> str:
    # 한글 완성형 2,350자 + 라틴/문장부호(제목·본문에 섞여 나오는 영문·숫자·
    # 구두점 대비) + 자모/호환 자모(만약을 대비한 최소 범위)
    hangul = ks_x_1001_hangul_syllables()
    ranges = ["U+0020-007E", "U+00A0-00FF", "U+2000-206F", "U+3000-303F", "U+1100-11FF", "U+3130-318F"]
    return ",".join(ranges) + "," + ",".join(f"U+{ord(c):04X}" for c in hangul)


def instance_and_subset(variable_font: Path, weight: int, output_name: str) -> None:
    instanced = output_name.replace(".ttf", "-instanced.ttf")
    subprocess.run(
        [sys.executable, "-m", "fontTools.varLib.instancer", "-o", instanced, str(variable_font), f"wght={weight}"],
        check=True,
    )
    subprocess.run(
        [
            sys.executable,
            "-m",
            "fontTools.subset",
            instanced,
            f"--output-file={OUTPUT_DIR / output_name}",
            f"--unicodes={unicode_ranges()}",
            "--layout-features=*",
            "--glyph-names",
            "--symbol-cmap",
            "--legacy-cmap",
            "--notdef-glyph",
            "--notdef-outline",
            "--recommended-glyphs",
            "--name-IDs=*",
            "--name-legacy",
            "--name-languages=*",
        ],
        check=True,
    )
    Path(instanced).unlink()


def main() -> None:
    if len(sys.argv) != 2:
        print(f"usage: {sys.argv[0]} <NotoSerifKR-variable.ttf>", file=sys.stderr)
        sys.exit(1)
    variable_font = Path(sys.argv[1])
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    instance_and_subset(variable_font, 400, "NotoSerifKR-Regular.ttf")
    instance_and_subset(variable_font, 700, "NotoSerifKR-Bold.ttf")
    for name in ("NotoSerifKR-Regular.ttf", "NotoSerifKR-Bold.ttf"):
        size = (OUTPUT_DIR / name).stat().st_size
        print(f"{name}: {size:,} bytes")


if __name__ == "__main__":
    main()
