-- The tasks_before_write trigger calls private.can_edit(), which needs USAGE on the
-- private schema. That was granted to `authenticated` but not `service_role`, so any
-- service-role write to tasks (webhooks, AI routes, or a one-off admin script) has been
-- failing with "permission denied for schema private" since the schema was introduced.
-- service_role already bypasses RLS entirely by design; this just lets its writes reach
-- the trigger at all.

grant usage on schema private to service_role;
grant execute on function
  private.is_member(uuid),
  private.has_role(uuid, public.member_role[]),
  private.can_edit(uuid),
  private.is_couple(uuid),
  private.is_assignee(uuid),
  private.is_platform_admin()
to service_role;
