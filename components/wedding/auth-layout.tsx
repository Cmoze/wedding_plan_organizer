import { Heart } from "lucide-react";
import type { ReactNode } from "react";

export function AuthLayout({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f6f5f0] px-5 py-12 text-[#20352f]">
      <div className="w-full max-w-lg">
        <div className="mb-8 flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#315b4b] text-white">
            <Heart className="h-5 w-5 fill-current" aria-hidden="true" />
          </span>
          <span>
            <span className="block text-base leading-5 font-bold">
              Together
            </span>
            <span className="block text-sm leading-5 text-[#66756c]">
              Wedding planning
            </span>
          </span>
        </div>
        <div className="rounded-[28px] border border-[#e2e4dc] bg-white p-7 shadow-sm sm:p-9">
          <h1 className="text-3xl font-semibold tracking-[-0.025em]">
            {title}
          </h1>
          <p className="mt-2 mb-7 text-lg text-[#52635a]">{description}</p>
          {children}
        </div>
      </div>
    </main>
  );
}
