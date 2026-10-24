import { DbError, type Db } from "@/lib/db/shared";

export async function signUp(
  db: Db,
  input: {
    email: string;
    password: string;
    displayName?: string;
    emailRedirectTo?: string;
  },
) {
  const { data, error } = await db.auth.signUp({
    email: input.email,
    password: input.password,
    options: {
      data: input.displayName ? { display_name: input.displayName } : undefined,
      emailRedirectTo: input.emailRedirectTo,
    },
  });
  if (error) throw new DbError(error.message, error.code);
  // session is null when the project requires email confirmation.
  return { user: data.user, needsEmailConfirmation: !data.session };
}

export async function signIn(
  db: Db,
  input: { email: string; password: string },
) {
  const { data, error } = await db.auth.signInWithPassword(input);
  if (error) throw new DbError(error.message, error.code);
  return data.user;
}

export async function signOut(db: Db) {
  const { error } = await db.auth.signOut();
  if (error) throw new DbError(error.message, error.code);
}

/** The signed-in user's id, email and sign-up name, verified (safe to use on the server), or null. */
export async function getCurrentUser(db: Db): Promise<{
  id: string;
  email: string | null;
  displayName: string | null;
} | null> {
  const { data, error } = await db.auth.getClaims();
  if (error || !data?.claims) return null;
  const metadata = data.claims.user_metadata as
    { display_name?: string } | undefined;
  return {
    id: data.claims.sub,
    email: (data.claims.email as string | undefined) ?? null,
    displayName: metadata?.display_name ?? null,
  };
}
