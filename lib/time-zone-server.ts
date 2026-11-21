import { cookies } from "next/headers";
import {
  DEFAULT_TIME_ZONE,
  TIME_ZONE_COOKIE,
  validTimeZone,
} from "@/lib/time-zone";

/** The viewer's time zone from the `tz` cookie, or UTC before the browser has set it. */
export async function viewerTimeZone(): Promise<string> {
  const store = await cookies();
  return validTimeZone(store.get(TIME_ZONE_COOKIE)?.value) ?? DEFAULT_TIME_ZONE;
}
