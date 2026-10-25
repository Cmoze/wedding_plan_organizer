"use client";

import { Check, Copy, Download, ExternalLink } from "lucide-react";
import QRCode from "qrcode";
import { useEffect, useState, useSyncExternalStore } from "react";
import { secondaryButtonClass } from "@/components/wedding/ui";
import { rsvpUrl } from "@/lib/db/rsvp";

/** The site's origin in the browser, "" while rendering on the server. */
function useOrigin() {
  return useSyncExternalStore(
    () => () => {},
    () => window.location.origin,
    () => "",
  );
}

/** The RSVP link as a QR code to print on invitations, with copy and download buttons. */
export function RsvpQr({ weddingId }: { weddingId: string }) {
  const origin = useOrigin();
  const link = origin ? rsvpUrl(origin, weddingId) : "";
  const [qr, setQr] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!link) return;
    let cancelled = false;
    QRCode.toDataURL(link, {
      width: 600,
      margin: 2,
      color: { dark: "#35151f", light: "#ffffff" },
    }).then((url) => !cancelled && setQr(url));
    return () => {
      cancelled = true;
    };
  }, [link]);

  return (
    <div className="mt-4 flex flex-col gap-5 sm:flex-row sm:items-center">
      <div className="h-44 w-44 shrink-0 overflow-hidden rounded-2xl border border-[#eadfe2] bg-white">
        {qr && (
          // eslint-disable-next-line @next/next/no-img-element -- a generated data: URL
          <img
            src={qr}
            alt="QR code that opens the RSVP form"
            className="h-full w-full"
          />
        )}
      </div>
      <div className="min-w-0 space-y-3">
        <p className="text-sm break-all text-[#806c74]">{link}</p>
        <div className="flex flex-wrap gap-2">
          {qr && (
            <a
              href={qr}
              download="rsvp-qr-code.png"
              className={secondaryButtonClass}
            >
              <Download className="mr-2 h-5 w-5" aria-hidden="true" />
              Download QR code
            </a>
          )}
          <button
            type="button"
            className={secondaryButtonClass}
            disabled={!link}
            onClick={async () => {
              await navigator.clipboard.writeText(link);
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
            }}
          >
            {copied ? (
              <Check className="mr-2 h-5 w-5" aria-hidden="true" />
            ) : (
              <Copy className="mr-2 h-5 w-5" aria-hidden="true" />
            )}
            {copied ? "Copied" : "Copy link"}
          </button>
          {link && (
            <a
              href={link}
              target="_blank"
              rel="noreferrer"
              className={secondaryButtonClass}
            >
              <ExternalLink className="mr-2 h-5 w-5" aria-hidden="true" />
              Preview form
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
