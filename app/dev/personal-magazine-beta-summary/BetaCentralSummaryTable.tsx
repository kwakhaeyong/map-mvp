import type { BetaParticipantRow } from "../../../src/data/personalMagazineBetaStore";

// CENTRAL BETA DATA TABLE(2026-08) — §9/§13. Server Component에서 이미
// 계산된 rows를 받아 그대로 그리기만 한다("use client" 아님, 이 파일
// 자체에는 상호작용이 없다). §14 — R>=4를 "성공"으로 판단하는 등의
// business judgment는 여기 없다. 평균·비율 계산도 판단이 아니라 그냥
// 산술이다(오너/GPT가 그 위에서 판단한다).

function formatAvg(values: number[]): string {
  if (values.length === 0) return "—";
  const avg = values.reduce((sum, v) => sum + v, 0) / values.length;
  return avg.toFixed(1);
}

function formatRate(count: number, total: number): string {
  if (total === 0) return "—";
  return `${count} / ${total} (${Math.round((count / total) * 100)}%)`;
}

function YesNo({ value }: { value: boolean }) {
  return <span className={value ? "text-text-primary" : "text-text-muted"}>{value ? "YES" : "NO"}</span>;
}

export function BetaCentralSummaryTable({ rows }: { rows: BetaParticipantRow[] | null }) {
  if (rows === null) {
    return (
      <div>
        <p className="text-xs font-black uppercase tracking-[0.14em] text-text-muted">DEV ONLY · NOT PUBLIC</p>
        <h1 className="mt-3 text-2xl font-black text-text-primary">CENTRAL BETA DATA</h1>
        <p className="mt-4 text-sm font-bold text-error">
          중앙 저장소(Upstash Redis)에 연결할 수 없습니다. UPSTASH_REDIS_REST_URL/UPSTASH_REDIS_REST_TOKEN 환경변수가 설정되어 있는지 확인하세요.
        </p>
      </div>
    );
  }

  const resonanceValues = rows.map((r) => r.resonance).filter((v): v is number => v !== null);
  const desireValues = rows.map((r) => r.desire).filter((v): v is number => v !== null);
  const continuationValues = rows.map((r) => r.continuation).filter((v): v is number => v !== null);
  const total = rows.length;
  const savedCount = rows.filter((r) => r.saved).length;
  const shareAttemptedCount = rows.filter((r) => r.shareAttempted !== null).length;
  const shareSucceededCount = rows.filter((r) => r.shareSucceeded).length;
  const shareFallbackCount = rows.filter((r) => r.shareFallbackDownloaded).length;
  const viewedCount = rows.filter((r) => r.viewedMyMagazine).length;
  const nextSelectedCount = rows.filter((r) => r.nextChapterSelected !== null).length;
  const nextConfirmedCount = rows.filter((r) => r.nextChapterConfirmed !== null).length;

  return (
    <div>
      <p className="text-xs font-black uppercase tracking-[0.14em] text-text-muted">DEV ONLY · NOT PUBLIC</p>
      <h1 className="mt-3 text-2xl font-black text-text-primary">CENTRAL BETA DATA</h1>
      <p className="mt-2 text-sm font-bold text-text-secondary">
        모든 참가자의 익명 R-D-C + 행동 데이터입니다(중앙 저장소 기준). 5명 테스트에서는 통계적 의미를 주장하지 않습니다 — 방향성 판단용입니다.
      </p>

      {total === 0 ? (
        <p className="mt-8 text-sm font-bold text-text-muted">아직 수집된 참가자가 없습니다.</p>
      ) : (
        <>
          <div className="mt-8 grid grid-cols-2 gap-x-6 gap-y-3 border-y border-border-strong py-6 sm:grid-cols-3">
            <SummaryStat label="테스터 수" value={String(total)} />
            <SummaryStat label="평균 R" value={formatAvg(resonanceValues)} />
            <SummaryStat label="평균 D" value={formatAvg(desireValues)} />
            <SummaryStat label="평균 C" value={formatAvg(continuationValues)} />
            <SummaryStat label="Save rate" value={formatRate(savedCount, total)} />
            <SummaryStat label="Share attempt rate" value={formatRate(shareAttemptedCount, total)} />
            <SummaryStat label="Share success rate" value={formatRate(shareSucceededCount, total)} />
            <SummaryStat label="Share fallback rate" value={formatRate(shareFallbackCount, total)} />
            <SummaryStat label="My Magazine view rate" value={formatRate(viewedCount, total)} />
            <SummaryStat label="Next Chapter selection rate" value={formatRate(nextSelectedCount, total)} />
            <SummaryStat label="Next Chapter confirmation rate" value={formatRate(nextConfirmedCount, total)} />
          </div>

          <div className="mt-10 overflow-x-auto">
            <table className="w-full min-w-[760px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-border-strong text-[10px] font-black uppercase tracking-[0.08em] text-text-muted">
                  <th className="py-2 pr-4">Participant</th>
                  <th className="py-2 pr-4">R</th>
                  <th className="py-2 pr-4">D</th>
                  <th className="py-2 pr-4">C</th>
                  <th className="py-2 pr-4">Saved</th>
                  <th className="py-2 pr-4">Shared</th>
                  <th className="py-2 pr-4">Viewed Magazine</th>
                  <th className="py-2 pr-4">Next Selected</th>
                  <th className="py-2 pr-4">Next Confirmed</th>
                  <th className="py-2">Comment</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.participantId} className="border-b border-border font-bold text-text-primary">
                    <td className="py-2.5 pr-4 font-mono text-xs text-text-secondary">{row.participantId}</td>
                    <td className="py-2.5 pr-4">{row.resonance ?? "—"}</td>
                    <td className="py-2.5 pr-4">{row.desire ?? "—"}</td>
                    <td className="py-2.5 pr-4">{row.continuation ?? "—"}</td>
                    <td className="py-2.5 pr-4">
                      <YesNo value={row.saved} />
                    </td>
                    <td className="py-2.5 pr-4">
                      {row.shareSucceeded ? "YES (native)" : row.shareFallbackDownloaded ? "YES (fallback)" : row.shareAttempted ? "ATTEMPTED" : "NO"}
                    </td>
                    <td className="py-2.5 pr-4">
                      <YesNo value={row.viewedMyMagazine} />
                    </td>
                    <td className="py-2.5 pr-4">{row.nextChapterSelected ? row.nextChapterSelected.toUpperCase() : "—"}</td>
                    <td className="py-2.5 pr-4">
                      <YesNo value={row.nextChapterConfirmed !== null} />
                    </td>
                    <td className="max-w-[16rem] py-2.5 text-xs font-semibold text-text-secondary">{row.mostLikeMe ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

function SummaryStat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] font-black uppercase tracking-[0.08em] text-text-muted">{label}</p>
      <p className="mt-1 font-mono text-lg font-black text-text-primary">{value}</p>
    </div>
  );
}
