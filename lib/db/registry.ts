import {
  unwrap,
  type Db,
  type NewRow,
  type RowPatch,
  type Tables,
} from "@/lib/db/shared";

export type RegistryLink = Tables<"registry_links">;

export async function getRegistryLinks(
  db: Db,
  weddingId: string,
): Promise<RegistryLink[]> {
  return unwrap(
    await db
      .from("registry_links")
      .select("*")
      .eq("wedding_id", weddingId)
      .order("created_at"),
  );
}

export async function createRegistryLink(
  db: Db,
  weddingId: string,
  input: NewRow<"registry_links">,
): Promise<RegistryLink> {
  return unwrap(
    await db
      .from("registry_links")
      .insert({ ...input, wedding_id: weddingId })
      .select()
      .single(),
  );
}

export async function updateRegistryLink(
  db: Db,
  linkId: string,
  patch: RowPatch<"registry_links">,
): Promise<RegistryLink> {
  return unwrap(
    await db
      .from("registry_links")
      .update(patch)
      .eq("id", linkId)
      .select()
      .single(),
  );
}

export async function deleteRegistryLink(
  db: Db,
  linkId: string,
): Promise<void> {
  unwrap(await db.from("registry_links").delete().eq("id", linkId));
}
