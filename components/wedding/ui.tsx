import type { ReactNode } from "react";

// Shared building blocks in the workspace palette. Large text and 48px tap targets for parents.

export const inputClass =
  "min-h-12 w-full rounded-xl border border-[#cfd8d0] bg-white px-4 text-base text-[#20352f] placeholder:text-[#8a978f] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#426c5a]";

export const primaryButtonClass =
  "inline-flex min-h-12 items-center justify-center rounded-xl bg-[#315b4b] px-5 text-base font-bold text-white hover:bg-[#264a3c] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#426c5a] disabled:opacity-60";

export const secondaryButtonClass =
  "inline-flex min-h-12 items-center justify-center rounded-xl border border-[#cfd8d0] bg-white px-4 text-base font-semibold text-[#294b40] hover:bg-[#f1f3ee] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#426c5a]";

export const quietButtonClass =
  "inline-flex min-h-11 items-center justify-center rounded-lg px-3 text-sm font-semibold text-[#6b4a3a] hover:bg-[#f6ece6] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#426c5a]";

export function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-[24px] border border-[#e2e4dc] bg-white p-6 sm:p-7 ${className}`}
    >
      {children}
    </section>
  );
}

export function CardTitle({ children }: { children: ReactNode }) {
  return <h2 className="text-xl font-bold text-[#20352f]">{children}</h2>;
}

export function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: ReactNode;
  hint?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-base font-semibold text-[#2d4a3f]">
        {label}
      </span>
      {children}
      {hint && (
        <span className="mt-1 block text-sm text-[#66756c]">{hint}</span>
      )}
    </label>
  );
}

export function Badge({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "neutral" | "good" | "warn" | "info";
}) {
  const tones = {
    neutral: "bg-[#eef0eb] text-[#4b5c53]",
    good: "bg-[#e3efe6] text-[#24553f]",
    warn: "bg-[#f8e7dc] text-[#8a3f1d]",
    info: "bg-[#e7ecf5] text-[#2f4a78]",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-sm font-semibold ${tones[tone]}`}
    >
      {children}
    </span>
  );
}

export function EmptyState({
  title,
  children,
}: {
  title: string;
  children?: ReactNode;
}) {
  return (
    <div className="rounded-[24px] border border-dashed border-[#bdc9bf] bg-white/70 px-6 py-10 text-center">
      <p className="text-lg font-semibold text-[#29483c]">{title}</p>
      {children && (
        <div className="mx-auto mt-2 max-w-xl text-base text-[#52635a]">
          {children}
        </div>
      )}
    </div>
  );
}

export function FormMessage({
  error,
  message,
}: {
  error?: string;
  message?: string;
}) {
  if (error) {
    return (
      <p
        role="alert"
        className="rounded-xl bg-[#f8e7dc] px-4 py-3 text-base text-[#8a3f1d]"
      >
        {error}
      </p>
    );
  }
  if (message) {
    return (
      <p
        role="status"
        className="rounded-xl bg-[#e3efe6] px-4 py-3 text-base text-[#24553f]"
      >
        {message}
      </p>
    );
  }
  return null;
}
