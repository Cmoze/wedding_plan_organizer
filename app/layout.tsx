import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  // Matches the "Together / Wedding planning" brand in the app; a page can set its own title
  // ("RSVP") and it shows as "RSVP · Together".
  title: {
    default: "Together · Wedding planning",
    template: "%s · Together",
  },
  description:
    "Plan your wedding together with shared tasks, dates, guests, and budget details.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
