import {
  unwrap,
  type Db,
  type NewRow,
  type RowPatch,
  type Tables,
} from "@/lib/db/shared";

export type Vendor = Tables<"vendors">;

export async function getVendors(db: Db, weddingId: string): Promise<Vendor[]> {
  return unwrap(
    await db
      .from("vendors")
      .select("*")
      .eq("wedding_id", weddingId)
      .order("name"),
  );
}

export async function getVendor(db: Db, vendorId: string): Promise<Vendor> {
  return unwrap(
    await db.from("vendors").select("*").eq("id", vendorId).single(),
  );
}

export async function createVendor(
  db: Db,
  weddingId: string,
  input: NewRow<"vendors">,
): Promise<Vendor> {
  return unwrap(
    await db
      .from("vendors")
      .insert({ ...input, wedding_id: weddingId })
      .select()
      .single(),
  );
}

export async function updateVendor(
  db: Db,
  vendorId: string,
  patch: RowPatch<"vendors">,
): Promise<Vendor> {
  return unwrap(
    await db.from("vendors").update(patch).eq("id", vendorId).select().single(),
  );
}

export async function deleteVendor(db: Db, vendorId: string): Promise<void> {
  unwrap(await db.from("vendors").delete().eq("id", vendorId));
}
