import {
  ArrowLeft,
  ExternalLink,
  MessageCircle,
  ThumbsUp,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import {
  addIdeaBoardAction,
  addIdeaCommentAction,
  deleteIdeaItemAction,
  toggleReactionAction,
} from "@/app/actions";
import { IdeaItemForm } from "@/components/wedding/client-forms";
import { userName, type WeddingContext } from "@/components/wedding/context";
import {
  Card,
  CardTitle,
  EmptyState,
  Field,
  inputClass,
  primaryButtonClass,
  quietButtonClass,
  secondaryButtonClass,
} from "@/components/wedding/ui";
import { getComments } from "@/lib/db/comments";
import {
  getIdeaBoards,
  getIdeaItems,
  getIdeaPhotoUrls,
  type IdeaItemWithCounts,
} from "@/lib/db/ideas";

export async function IdeasSection({
  ctx,
  boardId,
}: {
  ctx: WeddingContext;
  boardId?: string;
}) {
  const boards = await getIdeaBoards(ctx.db, ctx.wedding.id);
  const board = boards.find((b) => b.id === boardId);
  if (board) return <BoardView ctx={ctx} board={board} />;

  return (
    <div className="mt-10 space-y-6">
      {boards.length === 0 ? (
        <EmptyState title="No idea boards yet">
          Start one for flowers, cake, dresses, anything.
        </EmptyState>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {boards.map((b) => (
            <li key={b.id}>
              <Link
                href={`/?section=ideas&board=${b.id}`}
                className="block rounded-[24px] border border-[#e2e4dc] bg-white p-6 hover:border-[#9db4a3] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#426c5a]"
              >
                <p className="text-sm font-bold tracking-[0.1em] text-[#785e35] uppercase">
                  {b.category || "Ideas"}
                </p>
                <p className="mt-2 text-xl font-bold">{b.title}</p>
                <p className="mt-1 text-base text-[#52635a]">
                  {b.item_count} {b.item_count === 1 ? "idea" : "ideas"}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}

      <Card>
        <CardTitle>Start a board</CardTitle>
        <form
          action={addIdeaBoardAction}
          className="mt-4 grid gap-4 sm:grid-cols-[1fr_1fr_auto]"
        >
          <input type="hidden" name="weddingId" value={ctx.wedding.id} />
          <Field label="Board name">
            <input
              name="title"
              required
              className={inputClass}
              placeholder="Table settings"
            />
          </Field>
          <Field label="Category">
            <input name="category" className={inputClass} placeholder="Decor" />
          </Field>
          <div className="flex items-end">
            <button type="submit" className={primaryButtonClass}>
              Create board
            </button>
          </div>
        </form>
      </Card>
    </div>
  );
}

async function BoardView({
  ctx,
  board,
}: {
  ctx: WeddingContext;
  board: { id: string; title: string; category: string | null };
}) {
  const items = await getIdeaItems(ctx.db, board.id);
  const [photoUrls, comments] = await Promise.all([
    getIdeaPhotoUrls(
      ctx.db,
      items.flatMap((i) => (i.photo_path ? [i.photo_path] : [])),
    ),
    Promise.all(items.map((i) => getComments(ctx.db, { ideaItemId: i.id }))),
  ]);

  return (
    <div className="mt-8 space-y-6">
      <Link href="/?section=ideas" className={secondaryButtonClass}>
        <ArrowLeft className="mr-2 h-5 w-5" aria-hidden="true" /> All boards
      </Link>
      <h2 className="text-3xl font-semibold">{board.title}</h2>

      <Card>
        <CardTitle>Add an idea</CardTitle>
        <IdeaItemForm weddingId={ctx.wedding.id} boardId={board.id} />
      </Card>

      {items.length === 0 ? (
        <EmptyState title="This board is empty">
          Add a photo, a link or a note.
        </EmptyState>
      ) : (
        <ul className="grid gap-5 sm:grid-cols-2">
          {items.map((item, i) => (
            <IdeaCard
              key={item.id}
              item={item}
              ctx={ctx}
              photoUrl={
                item.photo_path ? photoUrls[item.photo_path] : undefined
              }
              comments={comments[i]}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

function IdeaCard({
  item,
  ctx,
  photoUrl,
  comments,
}: {
  item: IdeaItemWithCounts;
  ctx: WeddingContext;
  photoUrl?: string;
  comments: Awaited<ReturnType<typeof getComments>>;
}) {
  const thumbs = item.reactions.find((r) => r.emoji === "👍");

  return (
    <li className="overflow-hidden rounded-[24px] border border-[#e2e4dc] bg-white">
      {photoUrl && (
        // Signed URLs from private storage; next/image would need the Supabase host configured.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={photoUrl}
          alt={item.caption ?? "Idea photo"}
          className="aspect-[4/3] w-full object-cover"
        />
      )}
      <div className="space-y-3 p-5">
        {item.caption && (
          <p className="text-lg font-semibold">{item.caption}</p>
        )}
        {item.link_url && (
          <a
            href={item.link_url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 text-base font-semibold break-all text-[#315b4b] underline underline-offset-4"
          >
            Open link{" "}
            <ExternalLink className="h-4 w-4 shrink-0" aria-hidden="true" />
          </a>
        )}
        <div className="flex items-center gap-2">
          <form action={toggleReactionAction}>
            <input type="hidden" name="weddingId" value={ctx.wedding.id} />
            <input type="hidden" name="itemId" value={item.id} />
            <input
              type="hidden"
              name="mine"
              value={String(Boolean(thumbs?.mine))}
            />
            <button
              type="submit"
              aria-pressed={Boolean(thumbs?.mine)}
              className={`inline-flex min-h-11 items-center gap-2 rounded-full border px-4 text-base font-semibold ${
                thumbs?.mine
                  ? "border-[#315b4b] bg-[#e6eee8] text-[#244c3d]"
                  : "border-[#cfd8d0] text-[#506057] hover:bg-[#f1f3ee]"
              }`}
            >
              <ThumbsUp className="h-5 w-5" aria-hidden="true" />{" "}
              {thumbs?.count ?? 0}
            </button>
          </form>
          <span className="inline-flex items-center gap-1.5 text-base text-[#52635a]">
            <MessageCircle className="h-5 w-5" aria-hidden="true" />{" "}
            {comments.length}
          </span>
          {(ctx.canEdit || item.created_by === ctx.me.user_id) && (
            <form action={deleteIdeaItemAction} className="ml-auto">
              <input type="hidden" name="itemId" value={item.id} />
              <button
                type="submit"
                aria-label="Delete idea"
                className={quietButtonClass}
              >
                <Trash2 className="h-5 w-5" aria-hidden="true" />
              </button>
            </form>
          )}
        </div>
        {comments.length > 0 && (
          <ul className="space-y-2 border-t border-[#eceee8] pt-3">
            {comments.map((c) => (
              <li key={c.id} className="text-base">
                <span className="font-semibold">
                  {userName(ctx, c.author_id)}:
                </span>{" "}
                {c.body}
              </li>
            ))}
          </ul>
        )}
        <form action={addIdeaCommentAction} className="flex gap-2">
          <input type="hidden" name="weddingId" value={ctx.wedding.id} />
          <input type="hidden" name="itemId" value={item.id} />
          <label className="sr-only" htmlFor={`comment-${item.id}`}>
            Add a comment
          </label>
          <input
            id={`comment-${item.id}`}
            name="body"
            required
            placeholder="Add a comment"
            className={inputClass}
          />
          <button type="submit" className={secondaryButtonClass}>
            Post
          </button>
        </form>
      </div>
    </li>
  );
}
