import {
  deleteInviteAction,
  removeMemberAction,
  switchWeddingAction,
} from "@/app/actions";
import { RoleSelect } from "@/components/wedding/client-forms";
import type { WeddingContext } from "@/components/wedding/context";
import { formatDate, weddingTitle } from "@/components/wedding/format";
import {
  InviteForm,
  InviteLinkActions,
} from "@/components/wedding/invite-forms";
import { invitableRoles, ROLE_INFO } from "@/components/wedding/roles";
import {
  Badge,
  Card,
  CardTitle,
  quietButtonClass,
  secondaryButtonClass,
} from "@/components/wedding/ui";
import { listInvites } from "@/lib/db/invites";
import type { MemberRole, Wedding } from "@/lib/db/weddings";

const ROLES: MemberRole[] = ["couple", "planner", "helper"];

export async function TeamSection({
  ctx,
  weddings,
}: {
  ctx: WeddingContext;
  weddings: (Wedding & { role: MemberRole })[];
}) {
  const invites = ctx.canEdit ? await listInvites(ctx.db, ctx.wedding.id) : [];
  const isCouple = ctx.me.role === "couple";
  const title = weddingTitle(ctx.wedding);
  const inviterName = ctx.me.display_name || "We";
  const now = new Date().toISOString();

  return (
    <div className="mt-10 space-y-6">
      {ctx.canEdit ? (
        <Card>
          <CardTitle>Invite someone</CardTitle>
          <p className="mt-1 text-base text-[#52635a]">
            Add their email and we&apos;ll write the invite for you. Your email
            app opens with the message and link ready to send.
          </p>
          <InviteForm
            weddingId={ctx.wedding.id}
            roles={invitableRoles(ctx.me.role)}
            inviterName={inviterName}
            weddingTitle={title}
          />
        </Card>
      ) : (
        <Card>
          <CardTitle>Want to bring someone in?</CardTitle>
          <p className="mt-1 text-base text-[#52635a]">
            Ask {title} or a planner to send them an invite.
          </p>
        </Card>
      )}

      {ctx.canEdit && invites.length > 0 && (
        <Card>
          <CardTitle>Waiting to join</CardTitle>
          <ul className="mt-4 divide-y divide-[#eceee8]">
            {invites.map((invite) => {
              const expired = invite.expires_at < now;
              return (
                <li
                  key={invite.id}
                  className="flex flex-col gap-3 py-4 lg:flex-row lg:items-center lg:justify-between"
                >
                  <div>
                    <p className="text-lg font-semibold break-all text-[#20352f]">
                      {invite.email ?? "Anyone with the link"}
                    </p>
                    <p className="mt-1 flex flex-wrap items-center gap-2 text-base text-[#66756c]">
                      <Badge>{ROLE_INFO[invite.role].label}</Badge>
                      {expired ? (
                        <Badge tone="warn">Expired</Badge>
                      ) : (
                        <span>
                          Link works until {formatDate(invite.expires_at)}
                        </span>
                      )}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {!expired && (
                      <InviteLinkActions
                        invite={{
                          token: invite.token,
                          email: invite.email,
                          role: invite.role,
                          expiresAt: invite.expires_at,
                        }}
                        inviterName={inviterName}
                        weddingTitle={title}
                      />
                    )}
                    <form action={deleteInviteAction}>
                      <input type="hidden" name="inviteId" value={invite.id} />
                      <button type="submit" className={quietButtonClass}>
                        {expired ? "Remove" : "Cancel invite"}
                      </button>
                    </form>
                  </div>
                </li>
              );
            })}
          </ul>
        </Card>
      )}

      <Card>
        <CardTitle>Who&apos;s planning</CardTitle>
        <ul className="mt-4 divide-y divide-[#eceee8]">
          {ctx.members.map((m) => {
            const isMe = m.id === ctx.me.id;
            return (
              <li
                key={m.id}
                className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="text-lg font-semibold text-[#20352f]">
                    {m.display_name || "Unnamed"}
                    {isMe && (
                      <span className="ml-2 text-base font-normal text-[#66756c]">
                        (you)
                      </span>
                    )}
                  </p>
                  <p className="mt-1 text-base text-[#66756c]">
                    {ROLE_INFO[m.role].description}
                  </p>
                </div>
                {isCouple && !isMe ? (
                  <div className="flex flex-wrap items-center gap-2">
                    <RoleSelect
                      memberId={m.id}
                      memberName={m.display_name || "this person"}
                      role={m.role}
                      options={ROLES.map((r) => ({
                        value: r,
                        label: ROLE_INFO[r].label,
                      }))}
                    />
                    <form action={removeMemberAction}>
                      <input type="hidden" name="memberId" value={m.id} />
                      <button type="submit" className={quietButtonClass}>
                        Remove
                      </button>
                    </form>
                  </div>
                ) : (
                  <Badge tone={m.role === "helper" ? "neutral" : "good"}>
                    {ROLE_INFO[m.role].label}
                  </Badge>
                )}
              </li>
            );
          })}
        </ul>
      </Card>

      {weddings.length > 1 && (
        <Card>
          <CardTitle>Your weddings</CardTitle>
          <p className="mt-1 text-base text-[#52635a]">
            You&apos;re on more than one wedding team. Switch between them here.
          </p>
          <ul className="mt-4 space-y-2">
            {weddings.map((w) => (
              <li key={w.id}>
                {w.id === ctx.wedding.id ? (
                  <p className="flex min-h-12 items-center gap-2 text-lg font-semibold text-[#20352f]">
                    {weddingTitle(w)} <Badge tone="good">Open now</Badge>
                  </p>
                ) : (
                  <form action={switchWeddingAction}>
                    <input type="hidden" name="weddingId" value={w.id} />
                    <button type="submit" className={secondaryButtonClass}>
                      Open {weddingTitle(w)}&apos;s wedding
                    </button>
                  </form>
                )}
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
