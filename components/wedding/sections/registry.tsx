import { ExternalLink, Gift, Trash2 } from "lucide-react";
import { deleteRegistryLinkAction } from "@/app/actions";
import { RegistryLinkForm } from "@/components/wedding/client-forms";
import type { WeddingContext } from "@/components/wedding/context";
import {
  Card,
  CardTitle,
  EmptyState,
  quietButtonClass,
} from "@/components/wedding/ui";
import { getRegistryLinks } from "@/lib/db/registry";

export async function RegistrySection({ ctx }: { ctx: WeddingContext }) {
  const links = await getRegistryLinks(ctx.db, ctx.wedding.id);

  return (
    <div className="mt-10 space-y-6">
      {links.length === 0 ? (
        <EmptyState title="No registries yet">
          {ctx.canEdit
            ? "Add the link to each store's registry so guests and family can find them all here."
            : "Once the couple adds their registries, the links will show up here."}
        </EmptyState>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2">
          {links.map((link) => (
            <li
              key={link.id}
              className="flex flex-col rounded-[24px] border border-[#e2e4dc] bg-white p-6"
            >
              <div className="flex items-start gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#f3f0e5] text-[#785e35]">
                  <Gift className="h-5 w-5" aria-hidden="true" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-xl font-bold">{link.store_name}</p>
                  <p className="truncate text-base text-[#66756c]">
                    {hostOf(link.url)}
                  </p>
                </div>
                {ctx.canEdit && (
                  <form action={deleteRegistryLinkAction}>
                    <input type="hidden" name="linkId" value={link.id} />
                    <button
                      type="submit"
                      aria-label={`Remove ${link.store_name} registry`}
                      className={quietButtonClass}
                    >
                      <Trash2 className="h-5 w-5" aria-hidden="true" />
                    </button>
                  </form>
                )}
              </div>
              {link.notes && (
                <p className="mt-3 text-base text-[#52635a]">{link.notes}</p>
              )}
              <a
                href={link.url}
                target="_blank"
                rel="noreferrer"
                className="mt-5 inline-flex min-h-12 items-center justify-center gap-2 self-start rounded-xl bg-[#315b4b] px-5 text-base font-bold text-white hover:bg-[#264a3c] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#426c5a]"
              >
                Open registry
                <ExternalLink className="h-4 w-4" aria-hidden="true" />
              </a>
            </li>
          ))}
        </ul>
      )}

      {ctx.canEdit && (
        <Card>
          <CardTitle>Add a registry</CardTitle>
          <RegistryLinkForm weddingId={ctx.wedding.id} />
        </Card>
      )}
    </div>
  );
}

function hostOf(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}
