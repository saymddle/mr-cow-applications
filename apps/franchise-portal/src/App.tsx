import { Link as RouterLink, Route, Routes, useLocation } from "react-router";
import type { TogivaClient } from "@mrcow/api-client";
import {
  AuthNotConfigured, canUseFranchisePortal, isNavItemVisible, locationsWith, SessionGate, SessionProvider, SignInForm,
  staffMembershipFor, useSession, visibleNav, type AuthAdapter,
} from "@mrcow/auth";
import { apps } from "@mrcow/brand-config";
import logoUrl from "@mrcow/brand-config/assets/logo.webp";
import { Button, EmptyState, ErrorState, LoadingState, SidebarShell, ToastProvider, type ShellLink } from "@mrcow/ui";
import type { StaffMembership } from "@mrcow/shared-types";
import { useActiveLocation } from "./active-location";
import type { AppConfig } from "./config";
import { allFranchiseItems, franchiseNav } from "./nav";
import { plannedScreens } from "./screens/planned";
import { RedemptionsScreen } from "./screens/Redemptions";
import { TodayScreen } from "./screens/Today";

const Link: ShellLink = ({ to, children, ...rest }) => <RouterLink to={to} {...rest}>{children}</RouterLink>;

export function App({ config, auth, api }: { config: AppConfig; auth: AuthAdapter | null; api?: TogivaClient }) {
  if (config.missing.length)
    return <div className="centered"><ErrorState title="App is not configured" message={`Missing build settings: ${config.missing.join(", ")}. See .env.example.`} /></div>;
  if (!auth) return <div className="centered"><AuthNotConfigured appName={apps.franchise.name} /></div>;
  return (
    <SessionProvider auth={auth} apiBaseUrl={config.apiUrl} organizationSlug={config.organizationSlug} api={api}>
      <ToastProvider>
        <a className="skip-link" href="#main">Skip to content</a>
        <SessionGate signedOut={<div className="centered"><SignInForm heading={<OpsBrand dark={false} />} /></div>}>
          <Portal />
        </SessionGate>
      </ToastProvider>
    </SessionProvider>
  );
}

export function OpsBrand({ dark = true }: { dark?: boolean }) {
  return (
    <div className={`ops-brand${dark ? "" : " ops-brand--light"}`}>
      <img src={logoUrl} alt="Corn dogs by Mr. Cow" width={1238} height={330} />
      <span>Franchise</span>
    </div>
  );
}

function Portal() {
  const { session, organization, signOut } = useSession();
  const { pathname } = useLocation();
  const membership = session.status === "signed_in" && organization.status === "ready" ? staffMembershipFor(session.me, organization.organization.id) : undefined;
  const stores = locationsWith(membership);
  const [activeLocationId, setActiveLocationId] = useActiveLocation(stores.map((s) => s.locationId));

  if (organization.status === "loading") return <LoadingState />;
  if (organization.status === "error") return <div className="centered"><ErrorState message={organization.error.message} requestId={organization.error.requestId} /></div>;
  if (session.status !== "signed_in") return null;
  if (!canUseFranchisePortal(membership))
    return (
      <div className="centered">
        <EmptyState title="No store access yet" action={<Button variant="secondary" onClick={() => void signOut()}>Sign out</Button>}>
          {session.me.user.email} isn't on the team at any {organization.organization.name} store. Ask your franchise owner or general manager to invite you.
        </EmptyState>
      </div>
    );

  const ctx = { membership, activeLocationId };
  const sections = franchiseNav.map((s) => ({ label: s.label, items: visibleNav(s.items, ctx) }));
  const store = stores.find((s) => s.locationId === activeLocationId);

  return (
    <SidebarShell
      sections={sections}
      activePath={pathname}
      Link={Link}
      brand={<OpsBrand />}
      context={
        stores.length > 1 ? (
          <label className="store-switch">
            <span>Store</span>
            <select value={activeLocationId ?? ""} onChange={(e) => setActiveLocationId(e.target.value)}>
              {stores.map((s) => <option key={s.locationId} value={s.locationId}>{s.name}</option>)}
            </select>
          </label>
        ) : (
          <p className="store-switch store-switch--single"><span>Store</span>{store?.name}</p>
        )
      }
      user={
        <div className="ops-user">
          <span className="ops-user__email">{session.me.user.email}</span>
          <button type="button" className="ops-user__out" onClick={() => void signOut()}>Sign out</button>
        </div>
      }
    >
      <Routes>
        <Route index element={<TodayScreen membership={membership!} locationId={activeLocationId!} organizationId={organization.organization.id} />} />
        <Route path="redemptions" element={
          <Guard membership={membership} activeLocationId={activeLocationId} item={allFranchiseItems.find((i) => i.to === "/redemptions")!}>
            <RedemptionsScreen organizationId={organization.organization.id} locationId={activeLocationId!} />
          </Guard>} />
        {plannedScreens.map((p) => {
          const item = allFranchiseItems.find((i) => i.to === p.path)!;
          return <Route key={p.path} path={p.path.slice(1)} element={<Guard membership={membership} activeLocationId={activeLocationId} item={item}>{p.element}</Guard>} />;
        })}
        <Route path="*" element={<EmptyState title="Page not found" action={<RouterLink to="/">Back to Today</RouterLink>} />} />
      </Routes>
    </SidebarShell>
  );
}

/** Direct links to a screen the user can't use show an explanation instead of the screen. */
function Guard({ membership, activeLocationId, item, children }: { membership: StaffMembership | undefined; activeLocationId: string | null; item: (typeof allFranchiseItems)[number]; children: React.ReactNode }) {
  if (isNavItemVisible(item, { membership, activeLocationId })) return <>{children}</>;
  return <EmptyState title="Not available at this store">Your role at this store doesn't include {item.label.toLowerCase()}. Switch stores or ask your manager.</EmptyState>;
}
