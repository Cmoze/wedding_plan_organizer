"use client";

import { useRef, useState, useTransition } from "react";
import { importGuestCsvAction, type FormState } from "@/app/actions";
import {
  GUEST_FIELDS,
  parseGuestCsv,
  type ColumnMapping,
  type GuestField,
} from "@/lib/db/guest-csv";
import {
  Card,
  CardTitle,
  Field,
  FormMessage,
  inputClass,
  primaryButtonClass,
} from "@/components/wedding/ui";

const MAX_FILE_BYTES = 750_000;
const GUEST_COLUMNS = Object.entries(GUEST_FIELDS) as [GuestField, string][];

export function GuestCsvImport({ weddingId }: { weddingId: string }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [csvText, setCsvText] = useState("");
  const [fileName, setFileName] = useState("");
  const [mapping, setMapping] = useState<ColumnMapping>([]);
  const [parseError, setParseError] = useState<string>();
  const [preview, setPreview] = useState<ReturnType<typeof parseGuestCsv>>();
  const [state, setState] = useState<FormState>({});
  const [pending, startTransition] = useTransition();
  const guestCount =
    preview?.households.reduce(
      (sum, household) => sum + household.guests.length,
      0,
    ) ?? 0;

  async function readFile(file?: File) {
    setState({});
    setParseError(undefined);
    setPreview(undefined);
    setCsvText("");
    setFileName("");
    setMapping([]);
    if (!file) return;
    if (!file.name.toLowerCase().endsWith(".csv")) {
      setParseError("Choose a .csv file.");
      return;
    }
    if (file.size > MAX_FILE_BYTES) {
      setParseError("This file is too large. Choose a CSV under 750 KB.");
      return;
    }

    try {
      const text = await file.text();
      const parsed = parseGuestCsv(text);
      if (parsed.headers.length === 0) {
        setParseError("The CSV file is empty.");
        return;
      }
      setCsvText(text);
      setFileName(file.name);
      setMapping(parsed.mapping);
      setPreview(parsed);
    } catch {
      setParseError(
        "We couldn't read this file as a CSV. Check the file and try again.",
      );
    }
  }

  function changeMapping(index: number, value: string) {
    const next = [...mapping];
    next[index] = value === "" ? null : (value as GuestField);
    setMapping(next);
    setPreview(parseGuestCsv(csvText, next));
    setState({});
  }

  return (
    <Card>
      <CardTitle>Import guests from a spreadsheet</CardTitle>
      <p className="mt-1 text-base text-[#695b60]">
        Choose a CSV file. We&apos;ll preview the names and group guests by
        household before adding anyone. The file needs a header row.
      </p>
      <p className="mt-2 text-sm text-[#806c74]">
        Imports add new invitations; they don&apos;t merge with or update guests
        already on this list.
      </p>
      <div className="mt-4 max-w-xl">
        <Field
          label="CSV file"
          hint="Up to 750 KB. Your spreadsheet stays in this browser until you import it."
        >
          <input
            ref={fileRef}
            type="file"
            accept=".csv,text/csv"
            aria-describedby="guest-csv-help"
            onChange={(event) => void readFile(event.currentTarget.files?.[0])}
            className={`${inputClass} file:mr-4 file:rounded-lg file:border-0 file:bg-[#f4e7eb] file:px-3 file:py-2 file:font-semibold file:text-[#6f1d37]`}
          />
        </Field>
        <p id="guest-csv-help" className="mt-2 text-sm text-[#806c74]">
          You can match columns such as name, email, address, RSVP, meal, and
          household.
        </p>
      </div>

      {parseError && <FormMessage error={parseError} />}
      {fileName && preview && (
        <div className="mt-6 space-y-5">
          <div>
            <h3 className="text-lg font-semibold text-[#35151f]">
              Preview: {fileName}
            </h3>
            <p className="mt-1 text-base text-[#695b60]">
              {guestCount} {guestCount === 1 ? "guest" : "guests"} in{" "}
              {preview.households.length}{" "}
              {preview.households.length === 1 ? "invitation" : "invitations"}
              {preview.skipped.length > 0 &&
                ` · ${preview.skipped.length} row${preview.skipped.length === 1 ? "" : "s"} will be skipped`}
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-[#4b2734]">Match the columns</h4>
            <p className="mb-3 text-sm text-[#806c74]">
              We guessed from the headers. Change any match that looks wrong;
              columns set to Ignore won&apos;t be imported.
            </p>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {preview.headers.map((header, index) => (
                <Field
                  key={`${header}-${index}`}
                  label={header || `Column ${index + 1}`}
                >
                  <select
                    value={mapping[index] ?? ""}
                    onChange={(event) =>
                      changeMapping(index, event.target.value)
                    }
                    className={inputClass}
                  >
                    <option value="">Ignore this column</option>
                    {GUEST_COLUMNS.map(([field, label]) => (
                      <option
                        key={field}
                        value={field}
                        disabled={mapping.some(
                          (mapped, mappedIndex) =>
                            mappedIndex !== index && mapped === field,
                        )}
                      >
                        {label}
                      </option>
                    ))}
                  </select>
                </Field>
              ))}
            </div>
          </div>

          {preview.households.length > 0 ? (
            <div className="overflow-x-auto rounded-xl border border-[#eadfe2]">
              <table className="w-full min-w-[620px] text-left text-sm">
                <thead className="bg-[#fbf3f5] text-[#4b2734]">
                  <tr>
                    <th scope="col" className="px-3 py-2 font-semibold">
                      Guest
                    </th>
                    <th scope="col" className="px-3 py-2 font-semibold">
                      Invitation / address
                    </th>
                    <th scope="col" className="px-3 py-2 font-semibold">
                      Email
                    </th>
                    <th scope="col" className="px-3 py-2 font-semibold">
                      RSVP / meal
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f0e8ea]">
                  {preview.households
                    .flatMap((household) =>
                      household.guests.map((guest) => ({
                        guest,
                        household,
                      })),
                    )
                    .slice(0, 12)
                    .map(({ guest, household }, index) => (
                      <tr
                        key={`${guest.first_name}-${guest.last_name}-${index}`}
                      >
                        <td className="px-3 py-2 font-medium">
                          {[guest.first_name, guest.last_name]
                            .filter(Boolean)
                            .join(" ")}
                        </td>
                        <td className="px-3 py-2">
                          {household.name}
                          <span className="block text-xs text-[#806c74]">
                            {[
                              household.address_line1,
                              household.city,
                              household.region,
                              household.postal_code,
                            ]
                              .filter(Boolean)
                              .join(", ") || "No address"}
                          </span>
                        </td>
                        <td className="px-3 py-2">{guest.email || "—"}</td>
                        <td className="px-3 py-2">
                          {guest.rsvp}
                          {guest.meal_choice && (
                            <span className="block text-xs text-[#806c74]">
                              {guest.meal_choice}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
              {guestCount > 12 && (
                <p className="border-t border-[#eadfe2] px-3 py-2 text-sm text-[#806c74]">
                  Showing the first 12 guests of {guestCount}.
                </p>
              )}
            </div>
          ) : (
            <p className="rounded-xl bg-[#f8e7dc] px-4 py-3 text-base text-[#8a3f1d]">
              No guests have a usable name yet. Match a column to Full name or
              First name to continue.
            </p>
          )}

          {preview.skipped.length > 0 && (
            <details className="rounded-xl border border-[#eadfe2] p-4">
              <summary className="min-h-11 cursor-pointer font-semibold text-[#6f1d37]">
                Rows to skip ({preview.skipped.length})
              </summary>
              <ul className="mt-2 space-y-1 text-sm text-[#695b60]">
                {preview.skipped.slice(0, 10).map((row) => (
                  <li key={row.row}>
                    Row {row.row}: {row.reason}
                  </li>
                ))}
                {preview.skipped.length > 10 && (
                  <li>And {preview.skipped.length - 10} more.</li>
                )}
              </ul>
            </details>
          )}

          {preview.households.length > 0 && (
            <form
              className="space-y-3"
              onSubmit={(event) => {
                event.preventDefault();
                const form = new FormData(event.currentTarget);
                startTransition(async () => {
                  const result = await importGuestCsvAction(state, form);
                  setState(result);
                  if (!result.error) {
                    setCsvText("");
                    setFileName("");
                    setMapping([]);
                    setPreview(undefined);
                    if (fileRef.current) fileRef.current.value = "";
                  }
                });
              }}
            >
              <input type="hidden" name="weddingId" value={weddingId} />
              <input type="hidden" name="csvText" value={csvText} />
              <input
                type="hidden"
                name="mapping"
                value={JSON.stringify(mapping)}
              />
              <button
                type="submit"
                disabled={pending}
                className={primaryButtonClass}
              >
                {pending
                  ? "Importing..."
                  : `Import ${guestCount} ${guestCount === 1 ? "guest" : "guests"}`}
              </button>
            </form>
          )}
        </div>
      )}
      <div className="mt-4">
        <FormMessage error={state.error} message={state.message} />
      </div>
    </Card>
  );
}
