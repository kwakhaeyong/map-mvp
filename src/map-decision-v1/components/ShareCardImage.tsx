"use client";

import { useCallback, useState } from "react";

// /r/{id} 받는 사람 화면에서만 쓴다. 이미지가 뜨기 전에도 레이아웃이
// 흔들리지 않게 카드의 실제 비율(1080x1920)로 자리를 미리 확보하고,
// 생성이 실패해도(캐시 만료 후 재생성 실패 등) 깨진 이미지 아이콘 대신
// 조용히 사라지게 한다 — 이 위에 별도 HTML로 렌더되는 타이틀·한줄
// 설명·태그가 이미 있어서, 이미지가 없어도 화면이 비지 않는다.
export function ShareCardImage({ src }: { src: string }) {
  const [failed, setFailed] = useState(false);

  // 서버가 이미 <img> 태그를 그려서 내려보내므로, 브라우저는 React가
  // 하이드레이션을 마치고 onError를 붙이기도 전에 이미지 요청을 시작한다.
  // 요청이 아주 빨리 실패하면(로컬 네트워크 오류 등) 그 네이티브
  // error 이벤트가 리스너가 붙기 전에 이미 지나가버려 onError가 한 번도
  // 안 불릴 수 있다 — ref가 붙는 시점에 이미 실패가 끝나 있는지
  // (complete && naturalWidth === 0)도 같이 확인해서 이 경우도 잡는다.
  const checkAlreadyFailed = useCallback((node: HTMLImageElement | null) => {
    if (node && node.complete && node.naturalWidth === 0) {
      setFailed(true);
    }
  }, []);

  if (failed) return null;
  return (
    <div className="mx-auto aspect-[1080/1920] w-4/5">
      <img
        ref={checkAlreadyFailed}
        src={src}
        alt="공유된 이상형 카드 이미지"
        loading="eager"
        decoding="async"
        className="h-full w-full rounded-large border border-border object-cover shadow-floating"
        onError={() => setFailed(true)}
      />
    </div>
  );
}
