"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ComponentProps } from "react";

/** The app's laptop layout (sidebar) starts at Tailwind's `lg`. */
const WIDE = "(min-width: 1024px)";

/**
 * A Tasks filter link. Its href ends in `#task-list`, so on a phone a tap jumps down to the
 * list, which starts two screens below the filters (spec 002 row 9). On a laptop the list is
 * close by, so the jump would only hide the summary: there it changes the filter in place.
 */
export function TaskFilterLink({
  href,
  onClick,
  ...props
}: ComponentProps<typeof Link> & { href: string }) {
  const router = useRouter();
  return (
    <Link
      href={href}
      onClick={(e) => {
        onClick?.(e);
        if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey) return;
        if (!window.matchMedia(WIDE).matches) return;
        e.preventDefault();
        router.push(href.split("#")[0], { scroll: false });
      }}
      {...props}
    />
  );
}
