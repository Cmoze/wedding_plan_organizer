/**
 * The one account with cross-wedding access, for the builder's own debugging and demos.
 * The real enforcement is in the database (see the platform_admin migration) — this check
 * only decides what the UI *offers*; keep the email the same as the one in that migration.
 */
const ADMIN_EMAIL = "cartermoser4@gmail.com";

export function isPlatformAdmin(email: string | null | undefined): boolean {
  return email === ADMIN_EMAIL;
}
