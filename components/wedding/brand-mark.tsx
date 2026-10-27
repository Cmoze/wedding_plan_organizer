/** A small T monogram set inside a fine ring, crowned with a champagne-cut diamond. */
export function BrandMark({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      viewBox="0 0 48 48"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="24" cy="29" r="15.2" stroke="#D9BC8E" strokeWidth="2.15" />
      <path
        d="M18.5 10 21 5.5h6L29.5 10 24 17l-5.5-7Z"
        fill="#FFF9F6"
        stroke="#D9BC8E"
        strokeLinejoin="round"
        strokeWidth="1.5"
      />
      <path
        d="M18.5 10h11M21 5.5 24 17l3-11.5M24 17v2.3"
        stroke="#C79BA9"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1"
      />
      <path
        d="M17.5 21h13M24 21v13m-3 0h6"
        stroke="#FFF9F6"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2.3"
      />
      <path
        d="m18 15-1.4 2.1m13.4-2.1 1.4 2.1"
        stroke="#D9BC8E"
        strokeLinecap="round"
        strokeWidth="1.2"
      />
    </svg>
  );
}
