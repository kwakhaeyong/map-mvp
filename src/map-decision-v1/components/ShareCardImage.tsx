"use client";

import { useCallback, useState, type ReactNode } from "react";

// /r/{id} 받는 사람 화면에서만 쓴다. 이미지가 뜨기 전에도 레이아웃이
// 흔들리지 않게 카드의 실제 비율(초대장 컨셉 기준 1080x1350, 4:5)로
// 자리를 미리 확보하고,
// 생성이 실패해도(캐시 만료 후 재생성 실패 등) 깨진 이미지 아이콘 대신
// fallback(타이틀·한줄 설명·태그 텍스트)으로 조용히 전환한다 — 카드
// 안에 같은 내용이 있어서 평소엔 fallback을 안 보여주는 게 맞고,
// 이미지가 실제로 없을 때만 그 내용을 텍스트로 대신 보여준다.
//
// card.png는 폰트 렌더링 때문에 즉시 뜨지 않는다(최선의 경우도 1초
// 안팎). 그동안 빈 사각형만 보이면 안 되므로, 로딩 중에는 이 카드와
// 똑같은 4:5 비율 박스 위에 종이 톤 배경 + 타이틀 텍스트만 얹은
// placeholder를 겹쳐 보여준다(태그·한줄설명은 넣지 않는다 — 카드
// 완성본과의 차이를 분명히 하기 위함). placeholder는 절대 위치라
// 카드 <img>와 같은 부모 박스 안에서 자리를 차지하지 않으므로, onLoad로
// 감출 때 레이아웃이 흔들리지 않는다.
export function ShareCardImage({ src, alt, title, fallback }: { src: string; alt: string; title: string; fallback: ReactNode }) {
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);

  // 서버가 이미 <img> 태그를 그려서 내려보내므로, 브라우저는 React가
  // 하이드레이션을 마치고 onLoad/onError를 붙이기도 전에 이미지 요청을
  // 시작한다. 요청이 아주 빨리 끝나거나 실패하면 그 네이티브 이벤트가
  // 리스너가 붙기 전에 이미 지나가버려 onLoad/onError가 한 번도 안
  // 불릴 수 있다 — ref가 붙는 시점에 이미 끝나 있는지(complete)도 같이
  // 확인해서 이 경우도 잡는다.
  const checkAlreadyResolved = useCallback((node: HTMLImageElement | null) => {
    if (node && node.complete) {
      if (node.naturalWidth === 0) setFailed(true);
      else setLoaded(true);
    }
  }, []);

  if (failed) return <>{fallback}</>;
  return (
    <div className="relative mx-auto aspect-[1080/1350] w-4/5">
      {!loaded ? (
        <div className="absolute inset-0 flex items-center justify-center rounded-large border border-border bg-background p-6 shadow-floating">
          <h1 className="text-balance break-keep text-center text-2xl font-black leading-8 tracking-[-0.03em] text-text-primary">{title}</h1>
        </div>
      ) : null}
      <img
        ref={checkAlreadyResolved}
        src={src}
        alt={alt}
        loading="eager"
        decoding="async"
        className={`h-full w-full rounded-large border border-border object-cover shadow-floating ${loaded ? "opacity-100" : "opacity-0"}`}
        onLoad={() => setLoaded(true)}
        onError={() => setFailed(true)}
      />
    </div>
  );
}
