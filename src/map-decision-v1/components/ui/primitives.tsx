import type { ButtonHTMLAttributes, HTMLAttributes, InputHTMLAttributes, TextareaHTMLAttributes, ReactNode } from "react";

type Variant = "default" | "primary" | "secondary" | "ghost" | "danger" | "outline";
type Size = "sm" | "md" | "lg";

const cx = (...classes: Array<string | false | null | undefined>) => classes.filter(Boolean).join(" ");

const focus = "focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-focus";
const disabled = "disabled:pointer-events-none disabled:opacity-55";
const buttonVariants: Record<Variant, string> = {
  default: "border border-border bg-surface-elevated text-text-primary shadow-subtle hover:-translate-y-0.5 hover:border-border-strong hover:shadow-floating",
  primary: "border border-primary bg-primary text-primary-foreground shadow-subtle hover:-translate-y-0.5 hover:bg-primary-hover hover:shadow-floating",
  secondary: "border border-border bg-surface text-text-primary shadow-subtle hover:-translate-y-0.5 hover:border-border-strong hover:bg-surface-elevated hover:shadow-floating",
  ghost: "border border-transparent bg-transparent text-text-secondary hover:bg-surface hover:text-text-primary",
  danger: "border border-error-soft-border bg-risk text-text-primary hover:-translate-y-0.5 hover:border-error hover:shadow-floating",
  // 채우지 않고 테두리만 브랜드 색을 써서 "보조 기능"으로 톤을 낮추되
  // 완전히 존재감을 지우지는 않는다(VoiceButton이 건너뛰기의 대안임을
  // 알아차릴 수는 있어야 한다). primary처럼 꽉 찬 배경이 아니라서
  // "다음" 같은 진짜 주요 액션과 시각적으로 경쟁하지 않는다.
  // hover:bg-primary/10은 이 커스텀 색엔 슬래시 투명도 클래스가 생성되지
  // 않아(design:check#116) 항상 투명했다 — ink-wash 토큰(= primarySoftFill,
  // 이미 이상형 카드에서 쓰는 값)을 그대로 재사용한다.
  outline: "border-2 border-primary bg-transparent text-primary hover:-translate-y-0.5 hover:bg-ink-wash",
};
const buttonSizes: Record<Size, string> = {
  sm: "min-h-9 px-4 text-sm",
  md: "min-h-11 px-5 text-sm",
  lg: "min-h-14 px-6 text-base",
};

export function Button({ variant = "default", size = "md", loading, className, children, ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: Size; loading?: boolean }) {
  return <button className={cx("inline-flex items-center justify-center gap-2 rounded-pill font-extrabold tracking-[-0.01em] transition-all duration-normal ease-emphasized active:translate-y-0 active:scale-[.985]", focus, disabled, buttonVariants[variant], buttonSizes[size], className)} disabled={props.disabled || loading} {...props}>{loading ? "정리 중..." : children}</button>;
}

export function IconButton({ label, className, ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { label: string }) {
  return <button aria-label={label} className={cx("grid size-11 place-items-center rounded-pill border border-border bg-surface text-text-primary shadow-subtle transition-all duration-normal ease-emphasized hover:-translate-y-0.5 hover:bg-surface-elevated hover:shadow-floating active:translate-y-0 active:scale-95", focus, disabled, className)} {...props} />;
}

export function Surface({ elevated, className, ...props }: HTMLAttributes<HTMLDivElement> & { elevated?: boolean }) {
  return <div className={cx("border border-border backdrop-blur-xl transition-shadow duration-normal ease-standard", elevated ? "bg-surface-elevated shadow-floating" : "bg-surface shadow-subtle", className)} {...props} />;
}

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <Surface elevated className={cx("rounded-large p-5 sm:p-6", className)} {...props} />;
}

export function Badge({ tone = "default", className, ...props }: HTMLAttributes<HTMLSpanElement> & { tone?: "default" | "fact" | "feeling" | "value" | "option" | "uncertainty" | "risk" | "action" | "success" | "error" }) {
  const tones = { default: "bg-surface text-text-secondary", fact: "bg-fact", feeling: "bg-feeling", value: "bg-value", option: "bg-option", uncertainty: "bg-uncertainty", risk: "bg-risk", action: "bg-action", success: "bg-option text-success", error: "bg-risk text-error" };
  return <span className={cx("inline-flex items-center rounded-pill border border-border/60 px-3 py-1 text-xs font-extrabold tracking-[-0.01em]", tones[tone], className)} {...props} />;
}

export function Input({ error, className, ...props }: InputHTMLAttributes<HTMLInputElement> & { error?: boolean }) {
  return <input className={cx("min-h-11 w-full rounded-medium border bg-surface-elevated px-4 text-text-primary shadow-subtle transition duration-normal ease-standard placeholder:text-text-muted hover:border-border-strong", error ? "border-error" : "border-border", focus, disabled, className)} {...props} />;
}

export function Textarea({ error, className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement> & { error?: boolean }) {
  return <textarea className={cx("min-h-28 w-full resize-y rounded-medium border bg-surface-elevated px-4 py-3 leading-7 text-text-primary shadow-subtle transition duration-normal ease-standard placeholder:text-text-muted hover:border-border-strong", error ? "border-error" : "border-border", focus, disabled, className)} {...props} />;
}

export function VoiceButton({
  listening,
  loading,
  variant = "primary",
  className,
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { listening?: boolean; loading?: boolean; variant?: Variant }) {
  return (
    <span className="relative inline-flex">
      {listening ? <span aria-hidden="true" className="absolute -inset-1.5 -z-10 animate-pulse rounded-pill bg-primary/20" /> : null}
      <Button variant={listening ? "danger" : variant} size="lg" loading={loading} className={className} {...props}>
        {children ?? (listening ? "듣는 중" : "말로 시작")}
      </Button>
    </span>
  );
}

export const MessageBubble = ({ role = "assistant", className, ...props }: HTMLAttributes<HTMLDivElement> & { role?: "user" | "assistant" }) => <div className={cx("message-in max-w-[42rem] rounded-large px-5 py-4 text-sm font-medium leading-7 shadow-subtle", role === "user" ? "ml-auto bg-primary text-primary-foreground" : "bg-surface-elevated text-text-primary shadow-subtle", className)} {...props} />;
export const ReflectionCard = Card;
export const ResponseChip = (props: ButtonHTMLAttributes<HTMLButtonElement>) => <Button variant="secondary" size="sm" {...props} />;
export const CheckpointCard = Card;

export function MapNode({ type = "fact", className, ...props }: HTMLAttributes<HTMLDivElement> & { type?: "topic" | "fact" | "feeling" | "value" | "option" | "uncertainty" | "risk" | "action" }) {
  const tones = { topic: "bg-surface-elevated border-primary", fact: "bg-fact", feeling: "bg-feeling", value: "bg-value", option: "bg-option", uncertainty: "bg-uncertainty", risk: "bg-risk", action: "bg-action" };
  return <div className={cx("map-node rounded-large border border-border px-4 py-3 text-sm font-extrabold text-text-primary shadow-subtle transition-all duration-normal ease-emphasized hover:-translate-y-0.5 hover:shadow-floating", tones[type], className)} {...props} />;
}

export function MapLegend({ items = ["fact", "feeling", "option", "uncertainty", "risk", "action"] }: { items?: Array<"fact" | "feeling" | "option" | "uncertainty" | "risk" | "action"> }) {
  return <div className="flex flex-wrap gap-2">{items.map((item) => <Badge key={item} tone={item}>{item}</Badge>)}</div>;
}

export const Modal = ({ children, className, ...props }: HTMLAttributes<HTMLDivElement> & { children: ReactNode }) => <div role="dialog" aria-modal="true" className={cx("rounded-large border border-border bg-surface-elevated p-6 shadow-modal", className)} {...props}>{children}</div>;
export const BottomSheet = ({ className, ...props }: HTMLAttributes<HTMLDivElement>) => <div className={cx("fixed inset-x-0 bottom-0 rounded-t-large border border-border bg-surface-elevated p-5 shadow-modal", className)} {...props} />;
export const Toast = ({ className, ...props }: HTMLAttributes<HTMLDivElement>) => <div role="status" className={cx("rounded-medium border border-border bg-surface-elevated px-4 py-3 text-sm font-extrabold shadow-floating backdrop-blur-xl", className)} {...props} />;
export const EmptyState = ({ className, ...props }: HTMLAttributes<HTMLDivElement>) => <Card className={cx("text-center text-text-secondary", className)} {...props} />;
export const ResultActionBar = ({ className, ...props }: HTMLAttributes<HTMLDivElement>) => <div className={cx("sticky bottom-4 flex flex-wrap gap-3 rounded-large border border-border bg-surface p-3 shadow-floating backdrop-blur-xl", className)} {...props} />;
