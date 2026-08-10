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

const AGE_RANGE_OPTIONS = ["14세 미만", "10대", "20대", "30대", "40대 이상"] as const;
const OCCUPATION_STATUS_OPTIONS = ["학생", "직장인", "그 외"] as const;
const GENDER_OPTIONS = ["여성", "남성", "기타·밝히지 않음"] as const;

// 14세 미만을 선택해도 이용을 막지 않는다 — 서비스에 실제 나이 확인·
// 차단 로직이 없고(개인정보처리방침 §7은 선언문일 뿐), 이 필드는
// "이용 가능 여부"를 가르는 게이트가 아니라 결과 문장의 표현 수위를
// 다듬는 참고 자료일 뿐이기 때문이다. 대신 보호자 동반 이용만 짧게
// 안내한다.
const UNDER_14_NOTICE = "보호자와 함께 이용해주세요.";

// work(일할 때의 나)는 직장 경험을 전제로 한 문항이 대부분이라, 학생이
// 고르면 답하기 어려운 문항을 많이 만난다. 여기서도 차단하지 않는다 —
// "다른 주제 고르기"와 "그래도 계속하기" 둘 다 정상적인 선택지로 제시하고,
// 계속하기를 고르면 그대로 진행된다.
const WORK_STUDENT_NOTICE = "'일할 때의 나'는 직장 경험을 전제로 한 문항이 많아요. 다른 주제를 골라볼까요?";

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
  onChooseDifferentTopic,
}: {
  session: MapSession;
  setSession: Dispatch<SetStateAction<MapSession>>;
  onContinue: () => void;
  onReset: () => void;
  // "다른 주제 고르기"(work+학생 안내) 전용. onReset과 달리 세션을
  // 통째로 지우지 않고 랜딩으로만 돌아간다 — 방금 답한 profile을 그대로
  // 들고 가서, 다음 주제를 고를 때 프로필 질문을 또 물어보지 않는다.
  onChooseDifferentTopic: () => void;
}) {
  const profile = session.profile ?? {};
  const showWorkStudentNotice = session.topicId === "work" && profile.occupationStatus === "학생";
  // 아무것도 고르지 않은 첫 화면에는 "건너뛰기" 링크가 하나도 보이지
  // 않는다(값이 있을 때만 나타나는 취소용 링크라서) — 그 상태에서 진행
  // 버튼을 누르면 곧 건너뛰기라는 걸 라벨로 알려준다.
  const hasAnyProfileValue = Boolean(profile.ageRange || profile.occupationStatus || profile.gender);

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

        {showWorkStudentNotice ? (
          <div className="flex flex-col gap-3 rounded-large border border-border bg-surface-elevated p-4">
            <p className="break-keep text-sm font-semibold leading-6 text-text-secondary">{WORK_STUDENT_NOTICE}</p>
            <div className="flex flex-col gap-2">
              <Button type="button" variant="primary" size="lg" onClick={onChooseDifferentTopic}>
                다른 주제 고르기
              </Button>
              <Button type="button" variant="secondary" size="lg" onClick={onContinue}>
                그래도 계속하기
              </Button>
            </div>
          </div>
        ) : (
          <Button type="button" variant="primary" size="lg" onClick={onContinue} className="self-stretch">
            {hasAnyProfileValue ? "다음" : "건너뛰고 시작하기"}
          </Button>
        )}
      </section>
    </main>
  );
}
