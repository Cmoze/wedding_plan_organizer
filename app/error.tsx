"use client";

import { primaryButtonClass } from "@/components/wedding/ui";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#faf7f4] px-5 text-[#35151f]">
      <div className="max-w-lg rounded-[28px] border border-[#eadfe2] bg-white p-8 text-center">
        <h1 className="text-2xl font-semibold">Something went wrong</h1>
        <p className="mt-3 text-lg text-[#695b60]">
          {error.message || "That didn't work. Please try again."}
        </p>
        <button
          type="button"
          onClick={reset}
          className={`${primaryButtonClass} mt-6`}
        >
          Try again
        </button>
      </div>
    </main>
  );
}
