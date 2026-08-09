"use client";

import { Dispatch, SetStateAction } from "react";
import { now } from "../engine/session";
import { MapSession } from "../types";
import { Brand } from "./Landing";
import { Button } from "./ui/primitives";

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

type ProfileFieldKey = "ageRange" | "occupationStatus" | "gender";

const AGE_RANGE_OPTIONS = ["14세 미만", "10대", "20대 초반", "20대 후반", "30대 이상"] as const;
const OCCUPATION_STATUS_OPTIONS = ["학생", "직장인", "그 외"] as const;
const GENDER_OPTIONS = ["여성", "남성", "기타·밝히지 않음"] as const;

// 14세 미만을 선택해도 이용을 막지 않는다 — 서비스에 실제 나이 확인·
// 차단 로직이 없고(개인정보처리방침 §7은 선언문일 뿐), 이 필드는
// "이용 가능 여부"를 가르는 게이트가 아니라 결과 문장의 표현 수위를
// 다듬는 참고 자료일 뿐이기 때문이다. 대신 보호자 동반 이용만 짧게
// 안내한다.
const UNDER_14_NOTICE = "보호자와 함께 이용해주세요.";

// 세 질문 모두 같은 모양이라 하나의 컴포넌트로 만든다 — 탭 한 번으로
// 바로 선택되고(별도 "확인" 버튼 없음), 이미 고른 항목을 다시 누르면
// 건너뛴 것과 같은 상태(선택 해제)로 돌아간다. "건너뛰기" 링크는 값이
// 있을 때만 보여줘 굳이 누를 이유가 없을 땐 화면을 어지럽히지 않는다.
function ProfileQuestion({
  label,
  options,
  value,
  onSelect,
  onSkip,
}: {
  label: string;
  options: readonly string[];
  value?: string;
  onSelect: (option: string) => void;
  onSkip: () => void;
}) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-base font-black tracking-[-0.02em]">{label}</h2>
        {value ? (
          <button type="button" onClick={onSkip} className="text-xs font-bold text-text-muted hover:text-text-primary">
            건너뛰기
          </button>
        ) : null}
      </div>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const isSelected = value === option;
          return (
            <button
              key={option}
              type="button"
              onClick={() => (isSelected ? onSkip() : onSelect(option))}
              className={cx(
                "rounded-pill border px-4 py-2 text-sm font-extrabold tracking-[-0.01em] transition-all duration-normal ease-emphasized",
                isSelected
                  ? "border-primary bg-primary text-primary-foreground shadow-subtle"
                  : "border-border bg-surface text-text-primary hover:-translate-y-0.5 hover:border-border-strong hover:bg-primary hover:text-primary-foreground hover:shadow-floating",
              )}
            >
              {option}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function ProfileStep({
  session,
  setSession,
  onContinue,
  onReset,
}: {
  session: MapSession;
  setSession: Dispatch<SetStateAction<MapSession>>;
  onContinue: () => void;
  onReset: () => void;
}) {
  const profile = session.profile ?? {};

  const setField = (field: ProfileFieldKey, value: string | undefined) => {
    setSession((current) => ({ ...current, profile: { ...current.profile, [field]: value }, updatedAt: now() }));
  };

  return (
    <main className="min-h-screen px-4 py-4 text-text-primary sm:px-6 lg:px-8">
      <header className="map-container flex items-center justify-between rounded-pill border border-border bg-surface px-4 py-3 shadow-floating backdrop-blur-xl">
        <Brand />
        <button type="button" onClick={onReset} className="text-xs font-black text-text-muted hover:text-text-primary">
          나가기
        </button>
      </header>

      <section className="map-container flex flex-col gap-8 pb-10 pt-8">
        <div className="flex flex-col gap-2">
          <h1 className="text-balance break-keep text-xl font-black leading-8 tracking-[-0.03em]">시작하기 전에, 몇 가지만요</h1>
          <p className="break-keep text-sm font-semibold leading-6 text-text-secondary">
            결과 문장의 표현을 자연스럽게 맞추는 데만 참고해요. 원하지 않으면 그냥 넘어가도 괜찮아요.
          </p>
        </div>

        <ProfileQuestion
          label="나이대가 어떻게 되세요?"
          options={AGE_RANGE_OPTIONS}
          value={profile.ageRange}
          onSelect={(option) => setField("ageRange", option)}
          onSkip={() => setField("ageRange", undefined)}
        />
        {profile.ageRange === "14세 미만" ? (
          <div className="rounded-large border border-border bg-surface-elevated p-4 text-sm font-semibold leading-6 text-text-secondary">
            {UNDER_14_NOTICE}
          </div>
        ) : null}

        <ProfileQuestion
          label="지금 나는"
          options={OCCUPATION_STATUS_OPTIONS}
          value={profile.occupationStatus}
          onSelect={(option) => setField("occupationStatus", option)}
          onSkip={() => setField("occupationStatus", undefined)}
        />

        <ProfileQuestion
          label="성별"
          options={GENDER_OPTIONS}
          value={profile.gender}
          onSelect={(option) => setField("gender", option)}
          onSkip={() => setField("gender", undefined)}
        />

        <Button type="button" variant="primary" size="lg" onClick={onContinue} className="self-stretch">
          다음
        </Button>
      </section>
    </main>
  );
}
