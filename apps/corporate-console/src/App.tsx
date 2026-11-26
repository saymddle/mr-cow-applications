import { Link as RouterLink, Route, Routes, useLocation } from "react-router";
import type { TogivaClient } from "@mrcow/api-client";
import {
  AuthNotConfigured, canUseCorporateConsole, isNavItemVisible, SessionGate, SessionProvider, SignInForm,
  staffMembershipFor, useSession, visibleNav, type AuthAdapter,
} from "@mrcow/auth";
import { apps } from "@mrcow/brand-config";
import logoUrl from "@mrcow/brand-config/assets/logo.webp";
import type { StaffMembership } from "@mrcow/shared-types";
import { Button, EmptyState, ErrorState, LoadingState, SidebarShell, ToastProvider, type ShellLink } from "@mrcow/ui";
import type { AppConfig } from "./config";
import { allCorporateItems, corporateNav } from "./nav";
import { LocationsScreen } from "./screens/Locations";
import { OverviewScreen } from "./screens/Overview";
import { plannedScreens } from "./screens/planned";

const Link: ShellLink = ({ to, children, ...rest }) => <RouterLink to={to} {...rest}>{children}</RouterLink>;

export function App({ config, auth, api }: { config: AppConfig; auth: AuthAdapter | null; api?: TogivaClient }) {
  if (config.missing.length)
    return <div className="centered"><ErrorState title="App is not configured" message={`Missing build settings: ${config.missing.join(", ")}. See .env.example.`} /></div>;
  if (!auth) return <div className="centered"><AuthNotConfigured appName={apps.corporate.name} /></div>;
  return (
    <SessionProvider auth={auth} apiBaseUrl={config.apiUrl} organizationSlug={config.organizationSlug} api={api}>
      <ToastProvider>
        <a className="skip-link" href="#main">Skip to content</a>
        <SessionGate signedOut={<div className="centered"><SignInForm heading={<OpsBrand dark={false} />} /></div>}>
          <Console />
        </SessionGate>
      </ToastProvider>
    </SessionProvider>
  );
}

function OpsBrand({ dark = true }: { dark?: boolean }) {
  return (
    <div className={`ops-brand${dark ? "" : " ops-brand--light"}`}>
      <img src={logoUrl} alt="Corn dogs by Mr. Cow" width={1238} height={330} />
      <span>Corporate</span>
    </div>
  );
}

function Console() {
  const { session, organization, signOut } = useSession();
  const { pathname } = useLocation();
  if (organization.status === "loading") return <LoadingState />;
  if (organization.status === "error") return <div className="centered"><ErrorState message={organization.error.message} requestId={organization.error.requestId} /></div>;
  if (session.status !== "signed_in") return null;
  const org = organization.organization;
  const membership = staffMembershipFor(session.me, org.id);
  if (!canUseCorporateConsole(membership))
    return (
      <div className="centered">
        <EmptyState title="Corporate access required" action={<Button variant="secondary" onClick={() => void signOut()}>Sign out</Button>}>
          {session.me.user.email} has no corporate role at {org.name}. Store teams use the franchise portal.
        </EmptyState>
      </div>
    );

  const ctx = { membership };
  return (
    <SidebarShell
      sections={corporateNav.map((s) => ({ label: s.label, items: visibleNav(s.items, ctx) }))}
      activePath={pathname}
      Link={Link}
      brand={<OpsBrand />}
      context={<p className="store-switch store-switch--single"><span>Organization</span>{org.name}</p>}
      user={
        <div className="ops-user">
          <span className="ops-user__email">{session.me.user.email}</span>
          <button type="button" className="ops-user__out" onClick={() => void signOut()}>Sign out</button>
        </div>
      }
    >
      <Routes>
        <Route index element={<OverviewScreen membership={membership!} />} />
        <Route path="locations" element={<Guard membership={membership} path="/locations"><LocationsScreen organizationId={org.id} /></Guard>} />
        {plannedScreens.map((p) => (
          <Route key={p.path} path={p.path.slice(1)} element={<Guard membership={membership} path={p.path}>{p.element}</Guard>} />
        ))}
        <Route path="*" element={<EmptyState title="Page not found" action={<RouterLink to="/">Back to overview</RouterLink>} />} />
      </Routes>
    </SidebarShell>
  );
}

function Guard({ membership, path, children }: { membership: StaffMembership | undefined; path: string; children: React.ReactNode }) {
  const item = allCorporateItems.find((i) => i.to === path)!;
  if (isNavItemVisible(item, { membership })) return <>{children}</>;
  return <EmptyState title="Not part of your role">Your corporate role doesn't include {item.label.toLowerCase()}. An administrator can change this.</EmptyState>;
}
