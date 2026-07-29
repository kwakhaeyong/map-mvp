"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "./ui/primitives";

// "이미지로 저장" 버튼 — 인스타 스토리에 올릴 수 있는 PNG(카드)를
// navigator.share()의 파일 공유로 곧장 넘기거나, 그게 안 되는 환경에서는
// 이미지를 화면에 크게 띄워 "길게 눌러 저장"하게 한다.
//
// ★PR #86에서 배운 것: navigator.share()는 사용자 탭으로 생긴 "일시적
// 활성화"가 살아있는 동안 동기적으로 호출해야 공유 시트가 뜬다. 이미지
// 공유는 PNG를 fetch → Blob → File로 바꾸는 과정이 필요한데, 이 fetch를
// 탭 핸들러 안에서 하면(특히 100~200KB대 이미지는 확실히) 활성화가
// 만료돼 시트가 안 뜬다. 그래서 이 훅은 "준비"와 "공유"를 완전히
// 분리한다:
// - 첫 번째 탭: File이 없으면 준비만 시작한다(공유는 시도하지 않는다).
// - 준비가 끝나면 버튼이 다시 눌릴 수 있는 상태로 돌아간다.
// - 두 번째 탭(이제 File이 이미 있음): await 없이 곧장 navigator.share()
//   또는 모달을 연다 — 둘 다 탭 핸들러 안에서 비동기 대기가 없다.
// 이 패턴은 ShareResult.tsx의 링크 재사용(ensureShareUrl)과 동일한
// "첫 탭은 준비, 다음 탭부터 실행" 구조를 그대로 따른다.
export type ImageShareState = "idle" | "preparing-link" | "preparing-image" | "ready" | "error";

export function useImageShare({
  ensureShareUrl,
  buildShareText,
  fileName = "map-decision-card.png",
  shareTitle = "MAP Decision",
}: {
  // useShareResult()가 만든 것을 그대로 받는다 — 별도로 새로 만들면
  // 링크 재사용 캐시가 갈라져서, 이미 "공유" 버튼으로 만든 링크가 있어도
  // "이미지로 저장"이 그걸 못 알아보고 새로 만들 위험이 있다(= 하루
  // 공유 한도가 불필요하게 두 배로 깎임).
  ensureShareUrl: () => Promise<string | null>;
  buildShareText: (shareUrl: string) => string;
  fileName?: string;
  shareTitle?: string;
}) {
  const [imageState, setImageState] = useState<ImageShareState>("idle");
  const [imageError, setImageError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileRef = useRef<File | null>(null);
  const shareTextRef = useRef<string>("");
  const preparingRef = useRef(false);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const prepareImage = async () => {
    if (preparingRef.current || fileRef.current) return;
    preparingRef.current = true;
    setImageError(null);
    try {
      setImageState("preparing-link");
      const shareUrl = await ensureShareUrl();
      if (!shareUrl) {
        // ensureShareUrl 실패 사유(한도 초과 등)는 useShareResult의
        // shareError로 이미 화면에 나온다 — 여기서 또 띄우면 중복이다.
        setImageState("error");
        return;
      }
      shareTextRef.current = buildShareText(shareUrl);
      setImageState("preparing-image");
      const response = await fetch(`${shareUrl}/card.png`);
      if (!response.ok) throw new Error(`card.png ${response.status}`);
      const blob = await response.blob();
      fileRef.current = new File([blob], fileName, { type: "image/png" });
      setPreviewUrl(URL.createObjectURL(blob));
      setImageState("ready");
    } catch {
      setImageError("이미지를 만들지 못했어요. 잠시 후 다시 시도해 주세요.");
      setImageState("error");
    } finally {
      preparingRef.current = false;
    }
  };

  // 버튼의 onClick에 그대로 연결한다. 이 함수는 async 시그니처가 아니다 —
  // File이 이미 준비된 분기에서는 아무것도 await하지 않고 그 안에서 바로
  // navigator.share()를 호출해서, 탭에서 생긴 사용자 활성화가 호출
  // 시점까지 그대로 살아있게 한다.
  const handleTap = () => {
    const file = fileRef.current;
    if (file) {
      const canShareFiles = typeof navigator.canShare === "function" && navigator.canShare({ files: [file] });
      if (canShareFiles) {
        navigator.share({ title: shareTitle, text: shareTextRef.current, files: [file] }).catch(() => {});
      } else {
        setModalOpen(true);
      }
      return;
    }
    void prepareImage();
  };

  return {
    imageState,
    imageError,
    modalOpen,
    previewUrl,
    closeModal: () => setModalOpen(false),
    handleTap,
  };
}

export function ImageSaveModal({ open, previewUrl, onClose }: { open: boolean; previewUrl: string | null; onClose: () => void }) {
  if (!open || !previewUrl) return null;
  return (
    // #116: bg-primary/80이 이 커스텀 색엔 슬래시 투명도 클래스가
    // 생성되지 않아 배경 없이 블러만 적용되고 있었다(흰 텍스트가 거의
    // 안 보이는 문제) — primary-overlay(같은 색의 80% 오버레이 토큰)로
    // 대체한다.
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-primary-overlay p-4 backdrop-blur-sm" role="dialog" aria-modal="true">
      <img src={previewUrl} alt="저장할 카드 이미지" className="max-h-[70dvh] w-auto max-w-full rounded-medium shadow-modal" />
      <p className="text-center text-sm font-extrabold text-primary-foreground">길게 눌러 저장한 뒤 인스타 스토리에 올려보세요</p>
      <Button variant="secondary" size="lg" onClick={onClose}>
        닫기
      </Button>
    </div>
  );
}
