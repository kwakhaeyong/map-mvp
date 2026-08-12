"use client";

// DEV-ONLY PROTOTYPE — production과 완전히 분리된 실험 라우트.
// EXPERIENCE REINVENTION 지시에 따라 "질문을 보여준다 → 카드를 고른다 →
// 진행바가 움직인다"라는 기존 설문 틀 자체를 버리고, 세 가지 구조적으로
// 다른 경험 모델을 나란히 만들어 비교한다. 문항 문구·선택지 문구는
// topics.ts의 taste 축 원문을 그대로 복사했다(한 글자도 새로 쓰지 않음).
// 여기서 실제로 바뀐 건 "그 문항을 어떤 공간/구조로 보여주는가"뿐이다.
//
// production 코드(Landing.tsx, TopicQuiz.tsx)는 이 파일에서 전혀
// import하지 않는다 — 실험이 production 컴포넌트 구조에 묶이면 안
// 된다는 지시(§19)를 따른 것이다. 이 라우트는 오너가 A/B/C 중 하나를
// 고르기 전까지 어떤 production 화면에도 연결되지 않는다.

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

type LabOption = { label: string; description?: string };
type LabAxis = {
  id: string;
  question: string;
  options: LabOption[];
  isReflection?: boolean;
  placeholder?: string;
};

// topics.ts taste 축 원문 그대로(문항 20개 전부, 옵션 라벨/설명 원문 유지).
// 실제 태그 매핑/스코어링 로직은 가져오지 않는다 — 이 prototype은
// "경험의 구조"만 검증하면 되고, 결과 계산은 이번 라운드 범위 밖이다.
const LAB_AXES: LabAxis[] = [
  {
    id: "tasteMode",
    question: "혼자 있는 시간에 나는 주로 뭘 해?",
    options: [
      { label: "보는 편", description: "영상·이미지를 소비하는 편이다" },
      { label: "듣는 편", description: "음악·팟캐스트를 켜두는 편이다" },
      { label: "읽는 편", description: "글을 읽는 편이다" },
      { label: "만드는 편", description: "직접 뭔가를 하는 편이다" },
    ],
  },
  {
    id: "tasteRecent",
    question: "최근 일주일, 실제로 시간을 가장 많이 쓴 건?",
    options: [
      { label: "영상 보기", description: "드라마·짧은 영상·영화 등" },
      { label: "음악 듣기", description: "플레이리스트를 켜두는 시간" },
      { label: "게임하기", description: "모바일·PC·콘솔 등" },
      { label: "SNS 보기", description: "피드를 넘기는 시간" },
      { label: "책·글 읽기", description: "종이든 화면이든" },
      { label: "직접 하는 취미", description: "운동·요리·그림·악기 등" },
    ],
  },
  {
    id: "tasteDepth",
    question: "좋아하는 게 생기면 나는 어느 쪽이야?",
    options: [
      { label: "끝까지 파는 편", description: "하나를 깊게 파고드는 편이다" },
      { label: "여러 개를 얕게 즐기는 편", description: "넓게 훑는 편이다" },
    ],
  },
  {
    id: "tasteDiscover",
    question: "새로운 걸 알게 되는 경로는 주로 어디야?",
    options: [
      { label: "알고리즘 추천", description: "앱이 띄워주는 걸 따라가는 편이다" },
      { label: "사람 추천", description: "친구나 아는 사람이 알려주는 편이다" },
      { label: "직접 찾아보는 편", description: "검색하고 뒤져보는 편이다" },
      { label: "우연히 마주치는 편", description: "딱히 찾지 않아도 걸리는 편이다" },
    ],
  },
  {
    id: "tasteMoney",
    question: "여윳돈이 생기면 실제로 어디에 썼어?",
    options: [
      { label: "먹는 데", description: "맛있는 거 사 먹는 데 썼다" },
      { label: "경험에", description: "공연·전시·여행 같은 데 썼다" },
      { label: "물건에", description: "사고 싶던 걸 샀다" },
      { label: "안 쓰고 남겼다", description: "모아두는 편이다" },
    ],
  },
  {
    id: "tasteMood",
    question: "끌리는 분위기는?",
    options: [
      { label: "밝고 경쾌한", description: "기분이 올라가는 느낌" },
      { label: "잔잔하고 차분한", description: "마음이 가라앉는 느낌" },
      { label: "어둡고 깊은", description: "묵직하게 남는 느낌" },
      { label: "낯설고 실험적인", description: "본 적 없는 느낌" },
      { label: "따뜻하고 익숙한", description: "편안한 느낌" },
      { label: "강렬하고 빠른", description: "몰아치는 느낌" },
    ],
  },
  {
    id: "tasteStory",
    question: "이야기에서 제일 중요한 건?",
    options: [
      { label: "인물이 매력적인 것", description: "사람에 빠져드는 편이다" },
      { label: "이야기가 잘 짜인 것", description: "구성이 중요한 편이다" },
      { label: "분위기와 미장센", description: "느낌이 중요한 편이다" },
      { label: "남기는 메시지", description: "생각할 거리가 중요한 편이다" },
    ],
  },
  {
    id: "tasteSpace",
    question: "편하게 느껴지는 공간은?",
    options: [
      { label: "조용한 곳", description: "소리가 적은 곳" },
      { label: "적당히 북적이는 곳", description: "사람 소리가 배경이 되는 곳" },
      { label: "정돈된 곳", description: "깔끔하게 정리된 곳" },
      { label: "물건이 많은 곳", description: "뭔가 가득한 곳" },
      { label: "자연이 보이는 곳", description: "창밖에 초록이 있는 곳" },
      { label: "익숙한 내 자리", description: "늘 가던 곳" },
    ],
  },
  {
    id: "tasteFood",
    question: "음식 앞에서 나는 어떤 편이야?",
    options: [
      { label: "늘 먹던 걸 시키는 편", description: "실패하지 않는 선택을 하는 편이다" },
      { label: "새로운 걸 시도하는 편", description: "안 먹어본 걸 고르는 편이다" },
      { label: "남이 추천한 걸 따르는 편", description: "평이 좋은 걸 고르는 편이다" },
      { label: "그때 기분 따라 정하는 편", description: "즉흥적인 편이다" },
    ],
  },
  {
    id: "tasteAesthetic",
    question: "눈이 가는 스타일은?",
    options: [
      { label: "미니멀한", description: "덜어낸 것" },
      { label: "화려한", description: "채워진 것" },
      { label: "빈티지한", description: "오래된 것" },
      { label: "자연스러운", description: "꾸미지 않은 것" },
      { label: "정갈한", description: "반듯한 것" },
      { label: "개성 강한", description: "튀는 것" },
    ],
  },
  {
    id: "lifestyle",
    question: "평소 생활에서, 나와 더 가까운 모습은?",
    options: [
      { label: "집순이·집돌이", description: "집에서 보내는 시간이 제일 편하다" },
      { label: "액티브·야외파", description: "밖에서 몸을 움직이는 걸 좋아한다" },
      { label: "취미 공유", description: "좋아하는 걸 남과 같이 하려는 편이다" },
      { label: "각자 시간 존중", description: "따로 보내는 시간도 자연스럽다" },
      { label: "여행 좋아하는", description: "떠나는 것 자체를 즐긴다" },
      { label: "규칙적인 생활", description: "일상의 리듬이 안정적인 편이다" },
    ],
  },
  {
    id: "tasteShare",
    question: "좋아하는 걸 남한테 얘기하는 편이야?",
    options: [
      { label: "자주 추천하는 편", description: "알리고 싶은 편이다" },
      { label: "물어보면 말하는 편", description: "먼저 꺼내진 않는 편이다" },
      { label: "혼자 간직하는 편", description: "내 것으로 두고 싶은 편이다" },
      { label: "알려지면 오히려 식는 편", description: "많이 알려지면 흥미가 떨어지는 편이다" },
    ],
  },
  {
    id: "tastePopular",
    question: "남들이 다 좋아하는 것, 나는 어느 쪽이었어?",
    options: [
      { label: "나도 좋으면 같이 좋아한 편", description: "유행을 따라간 편이다" },
      { label: "오히려 거리를 둔 편", description: "몰리면 빠지는 편이다" },
    ],
  },
  {
    id: "tasteRepeat",
    question: "좋아하는 걸 다시 볼 때 나는 어떤 편이야?",
    options: [
      { label: "여러 번 반복하는 편", description: "같은 걸 계속 보는 편이다" },
      { label: "한 번이면 충분한 편", description: "다시 안 보는 편이다" },
      { label: "시간이 지나 다시 찾는 편", description: "한참 뒤에 돌아오는 편이다" },
      { label: "애초에 끝까지 안 보는 편", description: "중간에 그만두는 편이다" },
    ],
  },
  {
    id: "tasteGuilty",
    question: "남들에게 말하긴 좀 그런데 실제로 좋아하는 게 있어?",
    options: [
      { label: "있다, 대놓고 즐긴다", description: "숨기지 않는 편이다" },
      { label: "있지만 티는 안 낸다", description: "혼자만 즐기는 편이다" },
      { label: "딱히 없다", description: "숨길 만한 게 없는 편이다" },
      { label: "예전엔 있었는데 이젠 아니다", description: "지금은 신경 안 쓰는 편이다" },
    ],
  },
  {
    id: "tasteChange",
    question: "예전과 비교하면 내 취향은?",
    options: [
      { label: "거의 그대로인 편", description: "오래 좋아한 게 계속 간다" },
      { label: "조금씩 넓어진 편", description: "예전 것에 더해지는 편이다" },
      { label: "완전히 바뀐 편", description: "예전에 좋아하던 게 지금은 아니다" },
      { label: "계속 바뀌는 편", description: "한 곳에 오래 머물지 않는 편이다" },
    ],
  },
  {
    id: "reflectionTaste",
    question: "최근에 뭔가에 푹 빠졌던 게 언제였어요?\n그게 뭐였고 왜 좋았는지 적어주세요",
    placeholder: "예: 작년 겨울에 뜨개질에 빠져서 두 달 동안 계속했는데, 손으로 뭔가 남는 게 좋았어요",
    options: [],
    isReflection: true,
  },
  {
    id: "tasteWhy",
    question: "나한테 취향은 어떤 의미야?",
    options: [
      { label: "나를 설명하는 것", description: "내가 어떤 사람인지 보여준다" },
      { label: "쉬는 방법", description: "숨 돌리는 시간이다" },
      { label: "사람과 이어지는 통로", description: "같이 좋아할 사람을 만난다" },
      { label: "계속 배우는 것", description: "알수록 재밌어진다" },
      { label: "그냥 습관", description: "딱히 의미는 없다" },
      { label: "스트레스를 푸는 법", description: "버티게 해주는 것이다" },
    ],
  },
  {
    id: "tasteIdeal",
    question: "취향이 잘 맞는 사람과 만나면 어때?",
    options: [
      { label: "제일 편하다", description: "말이 통해서 좋다" },
      { label: "좋긴 한데 필수는 아니다", description: "다른 게 더 중요하다" },
      { label: "오히려 다른 게 재밌다", description: "새로운 걸 알게 돼서 좋다" },
      { label: "취향 얘기를 잘 안 한다", description: "그런 대화를 잘 안 하는 편이다" },
    ],
  },
  {
    id: "tasteSelfView",
    question: "나는 취향이 뚜렷한 사람인 것 같아?",
    options: [
      { label: "그런 편인 것 같다", description: "좋아하는 게 분명하다고 느낀다" },
      { label: "잘 모르겠다", description: "딱히 뚜렷하지 않다고 느낀다" },
    ],
  },
];

const TOTAL = LAB_AXES.length;

// 화면 캡처(Q5/Q10/Q15/Q20)를 위해 이전 문항들에 결정적(deterministic)
// 더미 답을 채워 넣는다 — 실제 사용자 입력이 아니라 "여기까지 왔다면
// 화면이 어떻게 보이는가"를 재현하기 위한 장치일 뿐이다.
function seedAnswerIndex(stepIndex: number, optionCount: number) {
  return (stepIndex * 2 + 1) % optionCount;
}

type Concept = "A" | "B" | "C";

function useLabState() {
  const router = useRouter();
  const params = useSearchParams();
  const concept = (params.get("concept") as Concept) ?? "A";
  const stepParam = params.get("step");
  const initialStep = stepParam ? Math.max(0, Math.min(TOTAL - 1, parseInt(stepParam, 10) - 1)) : 0;

  const [stepIndex, setStepIndex] = useState(initialStep);
  const [answers, setAnswers] = useState<(number | string | null)[]>(() =>
    LAB_AXES.map((axis, i) => {
      if (i >= initialStep) return null;
      if (axis.isReflection) return "뜨개질에 빠져서 두 달 동안 계속했다";
      return seedAnswerIndex(i, axis.options.length);
    }),
  );

  useEffect(() => {
    setStepIndex(initialStep);
    setAnswers(
      LAB_AXES.map((axis, i) => {
        if (i >= initialStep) return null;
        if (axis.isReflection) return "뜨개질에 빠져서 두 달 동안 계속했다";
        return seedAnswerIndex(i, axis.options.length);
      }),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialStep, concept]);

  const setConcept = useCallback(
    (next: Concept) => {
      const sp = new URLSearchParams(params.toString());
      sp.set("concept", next);
      router.replace(`/dev/quiz-experience-lab?${sp.toString()}`);
    },
    [params, router],
  );

  const jumpTo = useCallback(
    (stepNumber: number) => {
      const sp = new URLSearchParams(params.toString());
      sp.set("concept", concept);
      sp.set("step", String(stepNumber));
      router.replace(`/dev/quiz-experience-lab?${sp.toString()}`);
    },
    [params, router, concept],
  );

  const answer = useCallback(
    (value: number | string) => {
      setAnswers((prev) => {
        const next = [...prev];
        next[stepIndex] = value;
        return next;
      });
      window.setTimeout(() => {
        setStepIndex((i) => Math.min(TOTAL - 1, i + 1));
      }, 220);
    },
    [stepIndex],
  );

  return { concept, setConcept, stepIndex, answers, answer, jumpTo };
}

// ── 공통 dev 툴바(실험 조작용 — 세 concept 어디에도 속하지 않는 화면 밖 UI) ──
function LabToolbar({
  concept,
  setConcept,
  stepIndex,
  jumpTo,
}: {
  concept: Concept;
  setConcept: (c: Concept) => void;
  stepIndex: number;
  jumpTo: (n: number) => void;
}) {
  const jumps = [1, 2, 5, 10, 15, 17, 20];
  return (
    <div className="sticky top-0 z-50 border-b border-dashed border-border-strong bg-background-subtle/95 px-3 py-2 backdrop-blur">
      <div className="mx-auto flex max-w-md flex-wrap items-center gap-2 text-[11px] font-bold">
        <span className="rounded-pill bg-primary px-2 py-1 text-primary-foreground">DEV LAB</span>
        {(["A", "B", "C"] as Concept[]).map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setConcept(c)}
            className={`rounded-pill border px-2.5 py-1 ${
              concept === c ? "border-primary bg-primary text-primary-foreground" : "border-border text-text-secondary"
            }`}
          >
            Concept {c}
          </button>
        ))}
        <span className="mx-1 text-text-muted">|</span>
        {jumps.map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => jumpTo(n)}
            className={`rounded-pill border px-2 py-1 ${
              stepIndex + 1 === n ? "border-primary text-primary" : "border-border text-text-muted"
            }`}
          >
            {n === 17 ? "서술형" : `Q${n}`}
          </button>
        ))}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
// CONCEPT A — FIELD MAP
// 질문 화면 자체가 하나의 field. 선택지는 카드가 아니라 field 안의
// 위치(position marker)다. 답하면 그 위치에 trace가 남고, 이후 문항의
// field 배경에 지금까지의 trace가 옅게 누적된다. 축/좌표값/차트 눈금은
// 절대 노출하지 않는다 — irregular한 유기적 배치로만 표현한다.
// ════════════════════════════════════════════════════════════════════

type FieldPoint = { x: number; y: number };

function fieldPositions(stepIndex: number, count: number): FieldPoint[] {
  // 결정적 pseudo-random — 문항마다 다른 배치지만 재현 가능해야
  // 스크린샷 캡처가 안정적이다. 그리드가 아니라 유기적으로 흩어지도록
  // 골든 앵글 회전을 섞는다.
  const points: FieldPoint[] = [];
  let seed = stepIndex * 37 + 11;
  for (let i = 0; i < count; i++) {
    seed = (seed * 9301 + 49297) % 233280;
    const r1 = seed / 233280;
    seed = (seed * 9301 + 49297) % 233280;
    const r2 = seed / 233280;
    const angle = (i / count) * Math.PI * 2 + r1 * 0.9 + stepIndex * 0.4;
    const radius = 26 + r2 * 20;
    const x = 50 + Math.cos(angle) * radius * 1.05;
    const y = 48 + Math.sin(angle) * radius * 0.82;
    points.push({ x: Math.max(12, Math.min(88, x)), y: Math.max(14, Math.min(80, y)) });
  }
  return points;
}

function ConceptAField({
  stepIndex,
  answers,
  onAnswer,
}: {
  stepIndex: number;
  answers: (number | string | null)[];
  onAnswer: (v: number | string) => void;
}) {
  const axis = LAB_AXES[stepIndex];
  const positions = useMemo(() => fieldPositions(stepIndex, Math.max(axis.options.length, 1)), [stepIndex, axis.options.length]);

  // 지금까지 답한 문항들의 trace 좌표(각 문항 field의 "대표 좌표" —
  // 실제로 고른 옵션의 위치를 그 문항 당시의 field 좌표계로 재계산).
  const traces = useMemo(() => {
    const pts: FieldPoint[] = [];
    for (let i = 0; i < stepIndex; i++) {
      const a = LAB_AXES[i];
      const ans = answers[i];
      if (a.isReflection || typeof ans !== "number") continue;
      const p = fieldPositions(i, a.options.length)[ans];
      if (p) pts.push(p);
    }
    return pts;
  }, [stepIndex, answers]);

  const answeredCount = traces.length;
  const [justPicked, setJustPicked] = useState<number | null>(null);

  if (axis.isReflection) {
    return (
      <div className="flex min-h-[70vh] flex-col justify-center gap-5 px-5 py-8">
        <div className="relative mx-auto flex size-16 items-center justify-center">
          <div className="absolute inset-0 rounded-full bg-primary opacity-[0.08]" />
          <div className="size-2.5 rounded-full bg-primary" />
        </div>
        <p className="text-center font-serif text-[11px] font-bold uppercase tracking-[0.16em] text-primary">내 말로 남기는 한 줄</p>
        <h2 className="text-balance break-keep text-center text-xl font-black leading-8 tracking-[-0.03em]">{axis.question}</h2>
        <textarea
          autoFocus
          placeholder={axis.placeholder}
          rows={3}
          className="min-h-24 w-full rounded-medium border border-border bg-surface-elevated px-4 py-3 text-sm outline-none transition-colors duration-normal focus:border-primary"
        />
        <button
          type="button"
          onClick={() => onAnswer("텍스트 입력됨")}
          className="mx-auto rounded-pill bg-primary px-6 py-3 text-sm font-bold text-primary-foreground"
        >
          다음
        </button>
      </div>
    );
  }

  return (
    <div className="flex min-h-[70vh] flex-col gap-4 px-4 py-6">
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-bold text-text-muted">{answeredCount}개의 흔적이 쌓였어요</p>
        <MiniTerritory traces={traces} total={TOTAL} />
      </div>
      <h2 className="text-balance break-keep px-1 text-lg font-black leading-7 tracking-[-0.02em]">{axis.question}</h2>
      <div className="relative aspect-[4/5] w-full overflow-hidden rounded-large border border-border bg-surface-elevated">
        <svg viewBox="0 0 100 100" className="absolute inset-0 size-full" aria-hidden="true">
          <defs>
            <filter id="fieldBlur"><feGaussianBlur stdDeviation="6" /></filter>
          </defs>
          {/* 배경 안개 — 지금까지 답한 만큼 옅게 넓어지는 영역 */}
          <circle cx="50" cy="50" r={18 + answeredCount * 1.6} className="fill-primary" fillOpacity={0.05} filter="url(#fieldBlur)" />
          {/* 누적 trace 경로 */}
          {traces.length >= 2 ? (
            <polyline
              points={traces.map((p) => `${p.x},${p.y}`).join(" ")}
              className="fill-none stroke-primary"
              strokeOpacity={0.28}
              strokeWidth={0.8}
            />
          ) : null}
          {traces.map((p, i) => (
            <circle key={i} cx={p.x} cy={p.y} r={1.1} className="fill-primary" fillOpacity={0.45} />
          ))}
        </svg>
        {positions.map((p, i) => {
          const opt = axis.options[i];
          const picked = justPicked === i;
          return (
            <button
              key={opt.label}
              type="button"
              onClick={() => {
                setJustPicked(i);
                onAnswer(i);
              }}
              style={{ left: `${p.x}%`, top: `${p.y}%` }}
              className={`absolute flex min-h-16 min-w-16 max-w-[42%] -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center gap-0.5 rounded-full border-2 bg-surface-elevated px-3 py-2 text-center shadow-subtle transition-all duration-normal ease-emphasized ${
                picked ? "scale-110 border-primary bg-primary text-primary-foreground" : "border-primary-border-soft hover:scale-105 hover:border-primary"
              }`}
            >
              <span className="text-[13px] font-extrabold leading-tight">{opt.label}</span>
            </button>
          );
        })}
      </div>
      <p className="px-1 text-center text-[11px] font-medium text-text-muted">{stepIndex + 1} / {TOTAL}</p>
    </div>
  );
}

function MiniTerritory({ traces, total }: { traces: FieldPoint[]; total: number }) {
  const ratio = traces.length / total;
  return (
    <div className="relative size-9 overflow-hidden rounded-medium border border-border bg-background-subtle" aria-hidden="true">
      <svg viewBox="0 0 100 100" className="size-full">
        <circle cx="50" cy="50" r={10 + ratio * 45} className="fill-primary" fillOpacity={0.18} />
        {traces.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r={2} className="fill-primary" />
        ))}
      </svg>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
// CONCEPT B — PATH / JOURNEY
// 답할 때마다 경로가 조금씩 이어진다. 각 질문은 "다음 위치를 고르는
// 장면"으로 표현되고, Q10 이상에서는 지나온 길이 위쪽에 남아 있다.
// 게임 보드/레벨/보상 요소는 넣지 않는다 — 순수하게 "이동"의 은유만.
// ════════════════════════════════════════════════════════════════════

function pathWaypoint(stepIndex: number, chosen: number | null) {
  let seed = stepIndex * 53 + 7;
  seed = (seed * 9301 + 49297) % 233280;
  const drift = ((seed / 233280) - 0.5) * 30;
  const chosenDrift = chosen === null ? 0 : (chosen - 1.5) * 10;
  return { x: 50 + drift * 0.4 + chosenDrift, y: 100 - stepIndex * 9 };
}

function ConceptBPath({
  stepIndex,
  answers,
  onAnswer,
}: {
  stepIndex: number;
  answers: (number | string | null)[];
  onAnswer: (v: number | string) => void;
}) {
  const axis = LAB_AXES[stepIndex];
  const waypoints = useMemo(() => {
    const pts: { x: number; y: number }[] = [{ x: 50, y: 100 }];
    for (let i = 0; i <= stepIndex; i++) {
      const ans = answers[i];
      const chosen = typeof ans === "number" ? ans : null;
      pts.push(pathWaypoint(i, chosen));
    }
    return pts;
  }, [stepIndex, answers]);

  const pathD = "M " + waypoints.map((p) => `${p.x} ${p.y}`).join(" L ");
  const traveled = stepIndex;

  if (axis.isReflection) {
    return (
      <div className="flex min-h-[70vh] flex-col gap-5 px-5 py-6">
        <RouteStrip pathD={pathD} viewTop={waypoints[waypoints.length - 1]?.y ?? 100} restStop />
        <p className="text-center font-serif text-[11px] font-bold uppercase tracking-[0.16em] text-primary">내 말로 남기는 한 줄</p>
        <h2 className="text-balance break-keep text-center text-xl font-black leading-8 tracking-[-0.03em]">{axis.question}</h2>
        <p className="text-center text-xs font-semibold text-text-muted">여기서 잠시 멈춰 지금까지 걸어온 길에 대해 적어요</p>
        <textarea
          autoFocus
          placeholder={axis.placeholder}
          rows={3}
          className="min-h-24 w-full rounded-medium border border-border bg-surface-elevated px-4 py-3 text-sm outline-none transition-colors duration-normal focus:border-primary"
        />
        <button
          type="button"
          onClick={() => onAnswer("텍스트 입력됨")}
          className="mx-auto rounded-pill bg-primary px-6 py-3 text-sm font-bold text-primary-foreground"
        >
          다음
        </button>
      </div>
    );
  }

  const count = axis.options.length;
  // 갈림길처럼 보이도록 좌우/높이를 모두 흩어 배치한다 — 균일한 격자가
  // 되지 않도록 index마다 x·y를 함께 어긋나게 한다(§7: 카드 그리드 금지).
  const forkLayout = axis.options.map((_, i) => {
    const xSpread = count <= 2 ? [28, 72] : count <= 4 ? [20, 45, 55, 80] : [18, 35, 50, 25, 65, 82];
    const ySpread = count <= 2 ? [70, 40] : count <= 4 ? [30, 72, 22, 58] : [24, 58, 20, 76, 40, 62];
    return { x: xSpread[i % xSpread.length], y: ySpread[i % ySpread.length] };
  });

  return (
    <div className="flex min-h-[70vh] flex-col gap-4 px-4 py-6">
      <RouteStrip pathD={pathD} viewTop={waypoints[waypoints.length - 1]?.y ?? 100} />
      <p className="px-1 text-[11px] font-bold text-text-muted">여기까지 {traveled}개의 갈림길을 지났어요 · {stepIndex + 1} / {TOTAL}</p>
      <h2 className="text-balance break-keep px-1 text-lg font-black leading-7 tracking-[-0.02em]">{axis.question}</h2>
      <div className="relative min-h-[260px] overflow-hidden rounded-large border border-border bg-surface-elevated">
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 size-full" aria-hidden="true">
          <circle cx="50" cy="94" r={1.6} className="fill-primary" />
          {forkLayout.map((p, i) => (
            <path
              key={i}
              d={`M 50 94 Q ${(50 + p.x) / 2} ${(94 + p.y) / 2 - 8} ${p.x} ${p.y}`}
              className="fill-none stroke-primary"
              strokeOpacity={0.3}
              strokeWidth={0.8}
              strokeDasharray="2 2"
            />
          ))}
        </svg>
        {axis.options.map((opt, i) => {
          const p = forkLayout[i];
          return (
            <button
              key={opt.label}
              type="button"
              onClick={() => onAnswer(i)}
              style={{ left: `${p.x}%`, top: `${p.y}%` }}
              className="absolute flex max-w-[58%] -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-0.5 rounded-medium border-2 border-primary-border-soft bg-background px-3 py-2.5 text-center shadow-subtle transition-all duration-normal ease-emphasized hover:-translate-y-[calc(50%+4px)] hover:border-primary"
            >
              <span className="text-[13px] font-extrabold leading-tight">{opt.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function RouteStrip({ pathD, viewTop, restStop }: { pathD: string; viewTop: number; restStop?: boolean }) {
  return (
    <div className="relative h-40 w-full overflow-hidden rounded-large border border-border bg-background-subtle">
      <svg viewBox={`0 ${Math.max(0, viewTop - 60)} 100 100`} preserveAspectRatio="xMidYMax meet" className="size-full">
        <path d={pathD} className="fill-none stroke-primary" strokeOpacity={0.35} strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round" />
        {restStop ? (
          <circle cx="50" cy={viewTop} r={3.2} className="fill-primary" fillOpacity={0.9} />
        ) : (
          <circle cx="50" cy={viewTop} r={2.4} className="fill-primary" />
        )}
      </svg>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
// CONCEPT C — PERSONAL ARCHIVE
// 질문을 하나씩 넘기는 대신, field note/archive 한 장이 쌓여가는
// 경험. 선택은 editorial choice block(균일한 카드가 아니라 색인 목록
// 형태)으로 하고, 답할 때마다 옆 색인(index)에 짧게 기록된다.
// ════════════════════════════════════════════════════════════════════

function ConceptCArchive({
  stepIndex,
  answers,
  onAnswer,
}: {
  stepIndex: number;
  answers: (number | string | null)[];
  onAnswer: (v: number | string) => void;
}) {
  const axis = LAB_AXES[stepIndex];
  const indexRows = useMemo(() => {
    const rows: { n: number; label: string }[] = [];
    for (let i = 0; i < stepIndex; i++) {
      const a = LAB_AXES[i];
      const ans = answers[i];
      if (a.isReflection) {
        rows.push({ n: i + 1, label: "직접 남긴 기록" });
      } else if (typeof ans === "number") {
        rows.push({ n: i + 1, label: a.options[ans]?.label ?? "" });
      }
    }
    return rows;
  }, [stepIndex, answers]);

  const visibleRows = indexRows.slice(-5);
  const hiddenCount = indexRows.length - visibleRows.length;

  if (axis.isReflection) {
    return (
      <div className="flex min-h-[70vh] flex-col gap-5 bg-background-subtle px-5 py-8">
        <p className="text-center font-serif text-xs italic text-text-muted">FIELD NOTE — 여백에 남기는 글</p>
        <h2 className="text-balance break-keep text-center font-serif text-xl italic leading-8 text-text-primary">{axis.question}</h2>
        <p className="text-center font-serif text-[11px] font-bold uppercase tracking-[0.16em] text-primary">내 말로 남기는 한 줄</p>
        <textarea
          autoFocus
          placeholder={axis.placeholder}
          rows={4}
          style={{
            backgroundImage:
              "repeating-linear-gradient(to bottom, transparent, transparent 27px, var(--color-border) 28px)",
          }}
          className="min-h-28 w-full rounded-small border border-border bg-surface-elevated px-4 py-3 font-serif text-sm leading-[28px] outline-none transition-colors duration-normal focus:border-primary"
        />
        <button
          type="button"
          onClick={() => onAnswer("텍스트 입력됨")}
          className="mx-auto rounded-pill bg-primary px-6 py-3 text-sm font-bold text-primary-foreground"
        >
          기록 남기기
        </button>
      </div>
    );
  }

  return (
    <div className="flex min-h-[70vh] flex-col gap-4 px-4 py-6">
      <div className="flex items-center justify-between">
        <p className="font-serif text-[11px] font-bold uppercase tracking-[0.14em] text-primary">기록 {String(stepIndex + 1).padStart(2, "0")}</p>
        <p className="text-[11px] font-medium text-text-muted">{stepIndex + 1} / {TOTAL}</p>
      </div>
      <h2 className="text-balance break-keep px-0.5 text-lg font-black leading-7 tracking-[-0.02em]">{axis.question}</h2>
      <div className="divide-y divide-border overflow-hidden rounded-large border border-border bg-surface-elevated">
        {axis.options.map((opt, i) => (
          <button
            key={opt.label}
            type="button"
            onClick={() => onAnswer(i)}
            className="flex w-full items-start gap-3 px-4 py-4 text-left transition-colors duration-normal hover:bg-ink-wash"
          >
            <span className="font-serif text-sm font-bold text-primary">{String.fromCharCode(65 + i)}</span>
            <span className="flex-1">
              <span className="block text-sm font-extrabold leading-snug">{opt.label}</span>
              {opt.description ? <span className="block text-xs font-medium text-text-muted">{opt.description}</span> : null}
            </span>
          </button>
        ))}
      </div>
      <div className="mt-1 rounded-medium border border-dashed border-border px-3 py-2.5">
        {hiddenCount > 0 ? <p className="mb-1 text-[11px] font-medium text-text-muted">이전 기록 {hiddenCount}개 더 있음</p> : null}
        {visibleRows.length === 0 ? (
          <p className="text-[11px] font-medium text-text-muted">아직 쌓인 기록이 없어요</p>
        ) : (
          <ul className="space-y-0.5">
            {visibleRows.map((row) => (
              <li key={row.n} className="font-serif text-[11px] text-text-secondary">
                {String(row.n).padStart(2, "0")} · {row.label}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function QuizExperienceLabInner() {
  const { concept, setConcept, stepIndex, answers, answer, jumpTo } = useLabState();

  return (
    <div className="min-h-dvh bg-background text-text-primary">
      <LabToolbar concept={concept} setConcept={setConcept} stepIndex={stepIndex} jumpTo={jumpTo} />
      <div className="mx-auto max-w-md">
        <div className="flex items-center gap-2 px-4 pt-4">
          <div className="flex size-8 items-center justify-center rounded-full border border-border text-xs font-black">M</div>
          <p className="text-sm font-black">MAP Decision</p>
        </div>
        {concept === "A" ? (
          <ConceptAField stepIndex={stepIndex} answers={answers} onAnswer={answer} />
        ) : concept === "B" ? (
          <ConceptBPath stepIndex={stepIndex} answers={answers} onAnswer={answer} />
        ) : (
          <ConceptCArchive stepIndex={stepIndex} answers={answers} onAnswer={answer} />
        )}
      </div>
    </div>
  );
}

export default function QuizExperienceLabPage() {
  return (
    <Suspense fallback={null}>
      <QuizExperienceLabInner />
    </Suspense>
  );
}
