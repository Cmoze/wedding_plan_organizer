"use client";

import { Camera, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { createClient } from "@/lib/db/supabase/browser";
import { removeCouplePhoto, setCouplePhoto } from "@/lib/db/weddings";

const MAX_BYTES = 10 * 1024 * 1024;

export function CouplePhoto({
  weddingId,
  photoUrl,
  names,
  canEdit,
}: {
  weddingId: string;
  photoUrl: string | null;
  names: string;
  canEdit: boolean;
}) {
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();

  if (!photoUrl && !canEdit) return null;

  const run = (work: () => Promise<unknown>) => {
    setError(undefined);
    startTransition(async () => {
      try {
        await work();
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Something went wrong");
      }
    });
  };

  const upload = (file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith("image/"))
      return setError("Pick a photo (JPG, PNG or HEIC).");
    if (file.size > MAX_BYTES)
      return setError("That photo is over 10 MB. Try a smaller one.");
    run(() => setCouplePhoto(createClient(), weddingId, file));
  };

  const frame =
    "relative flex aspect-[4/3] w-40 shrink-0 items-center justify-center overflow-hidden rounded-2xl min-[480px]:w-52 sm:w-64 sm:rounded-3xl lg:w-96";

  return (
    <div className="flex shrink-0 flex-col items-center gap-2">
      {photoUrl ? (
        <div className={`${frame} shadow-lg ring-1 ring-white/25`}>
          {/* Signed URL from private storage; next/image would need the Supabase host configured. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={photoUrl}
            alt={`Photo of ${names}`}
            className="h-full w-full object-cover"
          />
          {pending && <Spinner />}
        </div>
      ) : (
        <button
          type="button"
          onClick={() => input.current?.click()}
          disabled={pending}
          className={`${frame} flex-col gap-1 border-2 border-dashed border-white/45 text-sm font-semibold text-[#f3e8ec] hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white`}
        >
          <Camera className="h-6 w-6" aria-hidden="true" />
          Add photo
          {pending && <Spinner />}
        </button>
      )}
      {canEdit && photoUrl && (
        <div className="flex gap-1 text-sm font-semibold">
          <button
            type="button"
            onClick={() => input.current?.click()}
            disabled={pending}
            className="min-h-9 rounded-full px-3 text-[#f3e8ec] hover:bg-white/10"
          >
            Change
          </button>
          <button
            type="button"
            onClick={() =>
              run(() => removeCouplePhoto(createClient(), weddingId))
            }
            disabled={pending}
            className="min-h-9 rounded-full px-3 text-[#f3e8ec] hover:bg-white/10"
          >
            Remove
          </button>
        </div>
      )}
      {canEdit && (
        <input
          ref={input}
          type="file"
          accept="image/*"
          className="hidden"
          aria-label="Choose a photo of the couple"
          onChange={(e) => {
            upload(e.target.files?.[0]);
            e.target.value = "";
          }}
        />
      )}
      {error && (
        <p role="alert" className="max-w-40 text-center text-sm text-[#ffd9e2]">
          {error}
        </p>
      )}
    </div>
  );
}

function Spinner() {
  return (
    <span className="absolute inset-0 flex items-center justify-center bg-black/40">
      <Loader2
        className="h-7 w-7 animate-spin text-white"
        aria-label="Saving photo"
      />
    </span>
  );
}
