import { SessionProvider } from "next-auth/react";
import { auth } from "@/auth";
import { cookies } from "next/headers";
import { getUserAuthorizedUndertakings, getPeriods } from "@/lib/db";
import NavBar from "@/components/NavBar";

export const metadata = { title: "RelatoriosESG" };

export default async function RootLayout({ children }) {
  const session = await auth();

  let undertakings = [];
  let activeUndertakingId = null;
  let periods = [];
  let activePeriodId = null;

  if (session?.user?.id) {
    undertakings = await getUserAuthorizedUndertakings(session.user.id);
    if (undertakings.length > 0) {
      const cookieStore = await cookies();

      const rawUId = cookieStore.get("active_undertaking_id")?.value;
      const uId = rawUId ? parseInt(rawUId, 10) : null;
      const undertaking = (uId && undertakings.find((u) => u.id === uId)) ?? undertakings[0];
      activeUndertakingId = undertaking.id;

      periods = await getPeriods(undertaking.id);
      if (periods.length > 0) {
        const rawPId = cookieStore.get("active_period_id")?.value;
        const pId = rawPId ? parseInt(rawPId, 10) : null;
        const period = (pId && periods.find((p) => p.id === pId)) ?? periods[0];
        activePeriodId = period.id;
      }
    }
  }

  return (
    <html lang="pt">
      <body style={{ margin: 0 }}>
        <SessionProvider>
          {session && (
            <NavBar
              user={session.user}
              undertakings={undertakings}
              activeUndertakingId={activeUndertakingId}
              periods={periods}
              activePeriodId={activePeriodId}
            />
          )}
          {children}
        </SessionProvider>
      </body>
    </html>
  );
}
