import { cookies } from "next/headers";
import { auth } from "@/auth";
import { getUserAuthorizedUndertakings, getPeriods } from "@/lib/db";

/**
 * Returns { session, undertaking } — for APIs that don't need a period (master, management).
 */
export async function getSessionAndUndertaking() {
  const session = await auth();
  if (!session?.user?.id) return { session: null, undertaking: null };

  const authorized = await getUserAuthorizedUndertakings(session.user.id);
  if (authorized.length === 0) return { session, undertaking: null };

  const cookieStore = await cookies();
  const rawId = cookieStore.get("active_undertaking_id")?.value;
  const id = rawId ? parseInt(rawId, 10) : null;
  const undertaking = (id && authorized.find((u) => u.id === id)) ?? authorized[0];

  return { session, undertaking };
}

/**
 * Returns { session, undertaking, period } — for block APIs that require an active period.
 */
export async function getSessionContext() {
  const { session, undertaking } = await getSessionAndUndertaking();
  if (!session || !undertaking) return { session, undertaking, period: null };

  const periods = await getPeriods(undertaking.id);
  if (periods.length === 0) return { session, undertaking, period: null };

  const cookieStore = await cookies();
  const rawId = cookieStore.get("active_period_id")?.value;
  const id = rawId ? parseInt(rawId, 10) : null;
  const period = (id && periods.find((p) => p.id === id)) ?? periods[0];

  return { session, undertaking, period };
}
