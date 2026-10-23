import { unwrap, type Db, type Tables } from "@/lib/db/shared";

export type Comment = Tables<"comments">;
export type CommentTarget = { taskId: string } | { ideaItemId: string };

function targetColumn(target: CommentTarget) {
  return "taskId" in target
    ? ({
        column: "task_id",
        id: target.taskId,
        ids: { task_id: target.taskId },
      } as const)
    : ({
        column: "idea_item_id",
        id: target.ideaItemId,
        ids: { idea_item_id: target.ideaItemId },
      } as const);
}

/** Comments on a task or idea item, oldest first. Author names come from getMembers(). */
export async function getComments(
  db: Db,
  target: CommentTarget,
): Promise<Comment[]> {
  const { column, id } = targetColumn(target);
  return unwrap(
    await db.from("comments").select("*").eq(column, id).order("created_at"),
  );
}

export async function addComment(
  db: Db,
  weddingId: string,
  target: CommentTarget,
  body: string,
): Promise<Comment> {
  const { ids } = targetColumn(target);
  return unwrap(
    await db
      .from("comments")
      .insert({ wedding_id: weddingId, body, ...ids })
      .select()
      .single(),
  );
}

export async function updateComment(
  db: Db,
  commentId: string,
  body: string,
): Promise<Comment> {
  return unwrap(
    await db
      .from("comments")
      .update({ body })
      .eq("id", commentId)
      .select()
      .single(),
  );
}

export async function deleteComment(db: Db, commentId: string): Promise<void> {
  unwrap(await db.from("comments").delete().eq("id", commentId));
}
