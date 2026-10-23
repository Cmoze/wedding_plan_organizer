import { getCurrentUser } from "@/lib/db/auth";
import {
  unwrap,
  type Db,
  type NewRow,
  type RowPatch,
  type Tables,
} from "@/lib/db/shared";

export const IDEA_PHOTOS_BUCKET = "idea-photos";

export type IdeaBoard = Tables<"idea_boards">;
export type IdeaItem = Tables<"idea_items">;
export type IdeaItemWithCounts = IdeaItem & {
  comment_count: number;
  reactions: { emoji: string; count: number; mine: boolean }[];
};

export async function getIdeaBoards(
  db: Db,
  weddingId: string,
): Promise<(IdeaBoard & { item_count: number })[]> {
  const rows = unwrap(
    await db
      .from("idea_boards")
      .select("*, idea_items(count)")
      .eq("wedding_id", weddingId)
      .order("created_at"),
  );
  return rows.map(({ idea_items, ...board }) => ({
    ...board,
    item_count: idea_items[0]?.count ?? 0,
  }));
}

export async function createIdeaBoard(
  db: Db,
  weddingId: string,
  input: NewRow<"idea_boards">,
): Promise<IdeaBoard> {
  return unwrap(
    await db
      .from("idea_boards")
      .insert({ ...input, wedding_id: weddingId })
      .select()
      .single(),
  );
}

export async function updateIdeaBoard(
  db: Db,
  boardId: string,
  patch: RowPatch<"idea_boards">,
): Promise<IdeaBoard> {
  return unwrap(
    await db
      .from("idea_boards")
      .update(patch)
      .eq("id", boardId)
      .select()
      .single(),
  );
}

export async function deleteIdeaBoard(db: Db, boardId: string): Promise<void> {
  unwrap(await db.from("idea_boards").delete().eq("id", boardId));
}

/** Items on a board, newest first, with comment counts and reaction totals. */
export async function getIdeaItems(
  db: Db,
  boardId: string,
): Promise<IdeaItemWithCounts[]> {
  const [user, result] = await Promise.all([
    getCurrentUser(db),
    db
      .from("idea_items")
      .select("*, comments(count), reactions(emoji, user_id)")
      .eq("board_id", boardId)
      .order("created_at", { ascending: false }),
  ]);
  return unwrap(result).map(({ comments, reactions, ...item }) => {
    const byEmoji = new Map<
      string,
      { emoji: string; count: number; mine: boolean }
    >();
    for (const r of reactions) {
      const entry = byEmoji.get(r.emoji) ?? {
        emoji: r.emoji,
        count: 0,
        mine: false,
      };
      entry.count += 1;
      entry.mine ||= r.user_id === user?.id;
      byEmoji.set(r.emoji, entry);
    }
    return {
      ...item,
      comment_count: comments[0]?.count ?? 0,
      reactions: [...byEmoji.values()],
    };
  });
}

export async function getIdeaItem(db: Db, itemId: string): Promise<IdeaItem> {
  return unwrap(
    await db.from("idea_items").select("*").eq("id", itemId).single(),
  );
}

export async function createIdeaItem(
  db: Db,
  weddingId: string,
  input: NewRow<"idea_items">,
): Promise<IdeaItem> {
  return unwrap(
    await db
      .from("idea_items")
      .insert({ ...input, wedding_id: weddingId })
      .select()
      .single(),
  );
}

export async function updateIdeaItem(
  db: Db,
  itemId: string,
  patch: RowPatch<"idea_items">,
): Promise<IdeaItem> {
  return unwrap(
    await db
      .from("idea_items")
      .update(patch)
      .eq("id", itemId)
      .select()
      .single(),
  );
}

/** Deletes the item and its photo. */
export async function deleteIdeaItem(db: Db, itemId: string): Promise<void> {
  const item = await getIdeaItem(db, itemId);
  unwrap(await db.from("idea_items").delete().eq("id", itemId));
  if (item.photo_path)
    await db.storage.from(IDEA_PHOTOS_BUCKET).remove([item.photo_path]);
}

/** Uploads a photo and returns its storage path; save it as `photo_path` on an idea item. */
export async function uploadIdeaPhoto(
  db: Db,
  weddingId: string,
  file: File,
): Promise<string> {
  const ext = file.name.includes(".")
    ? file.name.split(".").pop()!.toLowerCase()
    : "jpg";
  const path = `${weddingId}/${crypto.randomUUID()}.${ext}`;
  unwrap(
    await db.storage
      .from(IDEA_PHOTOS_BUCKET)
      .upload(path, file, { contentType: file.type || undefined }),
  );
  return path;
}

/** Temporary URLs for private photos, keyed by path. Valid for `expiresIn` seconds. */
export async function getIdeaPhotoUrls(
  db: Db,
  paths: string[],
  expiresIn = 60 * 60,
): Promise<Record<string, string>> {
  if (paths.length === 0) return {};
  const rows = unwrap(
    await db.storage
      .from(IDEA_PHOTOS_BUCKET)
      .createSignedUrls(paths, expiresIn),
  );
  const urls: Record<string, string> = {};
  for (const r of rows) if (r.path && r.signedUrl) urls[r.path] = r.signedUrl;
  return urls;
}

export async function addReaction(
  db: Db,
  weddingId: string,
  ideaItemId: string,
  emoji = "👍",
): Promise<void> {
  unwrap(
    await db
      .from("reactions")
      .upsert(
        { wedding_id: weddingId, idea_item_id: ideaItemId, emoji },
        { onConflict: "idea_item_id,user_id,emoji", ignoreDuplicates: true },
      ),
  );
}

export async function removeReaction(
  db: Db,
  ideaItemId: string,
  emoji = "👍",
): Promise<void> {
  const user = await getCurrentUser(db);
  if (!user) return;
  unwrap(
    await db
      .from("reactions")
      .delete()
      .eq("idea_item_id", ideaItemId)
      .eq("user_id", user.id)
      .eq("emoji", emoji),
  );
}
