"use client";

import { ReactNode, useState } from "react";
import { Button, Card } from "./ui/primitives";

type DeleteStatus = "idle" | "confirming" | "deleting" | "deleted" | "error";

// 링크를 아는 사람이 곧 그 데이터의 주인이라는 전제라 별도 인증 없이
// 지울 수 있다 — 그만큼 실수로 누르는 사고를 코드로 최대한 막아야
// 한다. 이 화면의 다른 되돌릴 수 없는 동작(TopicQuiz.tsx의 나가기 등)은
// window.confirm()을 쓰지만, 여기서는 화면 안에서 확인 단계를 보여주는
// 방식을 택했다 — 삭제 확인 절차 자체가 눈에 보여야 하는 화면(모바일
// 인앱 브라우저마다 제각각으로 생기는 네이티브 confirm() 대화상자보다
// 일관된 모양을 보장한다)이기 때문이다.
export function DeleteShareSection({ id, children }: { id: string; children: ReactNode }) {
  const [status, setStatus] = useState<DeleteStatus>("idle");

  const handleDelete = async () => {
    setStatus("deleting");
    try {
      const response = await fetch(`/api/share/${id}`, { method: "DELETE" });
      if (!response.ok) {
        setStatus("error");
        return;
      }
      setStatus("deleted");
    } catch {
      setStatus("error");
    }
  };

  if (status === "deleted") {
    return (
      <Card className="flex flex-col items-center gap-2 py-10 text-center">
        <p className="text-sm font-extrabold text-text-secondary">이 링크를 삭제했어요.</p>
        <p className="text-xs font-semibold text-text-muted">이제 이 주소로는 카드를 볼 수 없어요.</p>
      </Card>
    );
  }

  return (
    <>
      {children}
      <div className="mt-6 flex flex-col items-center gap-2">
        {status === "confirming" ? (
          <div className="flex flex-col items-center gap-2 text-center">
            <p className="text-xs font-semibold text-text-secondary">삭제하면 되돌릴 수 없어요. 정말 삭제할까요?</p>
            <div className="flex gap-2">
              <Button variant="danger" size="sm" onClick={handleDelete} disabled={status !== "confirming"} className="text-xs">
                삭제할게요
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setStatus("idle")} className="text-xs text-text-muted">
                취소
              </Button>
            </div>
          </div>
        ) : (
          <Button variant="ghost" size="sm" onClick={() => setStatus("confirming")} disabled={status === "deleting"} className="text-xs text-text-muted">
            {status === "deleting" ? "삭제하는 중이에요..." : "이 링크 삭제하기"}
          </Button>
        )}
        {status === "error" ? <p className="text-xs font-semibold text-error">삭제하지 못했어요. 잠시 후 다시 시도해 주세요.</p> : null}
      </div>
    </>
  );
}
