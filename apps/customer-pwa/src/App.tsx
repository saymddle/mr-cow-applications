import { Link as RouterLink, Route, Routes, useLocation } from "react-router";
import type { TogivaClient } from "@mrcow/api-client";
import { AuthNotConfigured, SessionGate, SessionProvider, SignInForm, type AuthAdapter } from "@mrcow/auth";
import { apps } from "@mrcow/brand-config";
import logoUrl from "@mrcow/brand-config/assets/logo.webp";
import { ErrorState, TabBarShell, ToastProvider, type ShellLink } from "@mrcow/ui";
import type { AppConfig } from "./config";
import { AccountScreen } from "./screens/Account";
import { ActivityScreen } from "./screens/Activity";
import { CodeScreen } from "./screens/Code";
import { HomeScreen } from "./screens/Home";
import { NotFound } from "./screens/NotFound";
import { RewardsScreen } from "./screens/Rewards";
import { StoresScreen } from "./screens/Stores";

export const customerNav = [
  { to: "/", label: "Home", icon: "home" },
  { to: "/code", label: "My code", icon: "code" },
  { to: "/rewards", label: "Rewards", icon: "gift" },
  { to: "/stores", label: "Stores", icon: "pin" },
  { to: "/account", label: "Account", icon: "user" },
];

const Link: ShellLink = ({ to, children, ...rest }) => <RouterLink to={to} {...rest}>{children}</RouterLink>;

const Brand = () => (
  <RouterLink to="/" aria-label={`${apps.customer.name}, home`} className="brand-link">
    <img src={logoUrl} alt="Corn dogs by Mr. Cow" width={1238} height={330} className="brand-logo" />
  </RouterLink>
);

export function App({ config, auth, api }: { config: AppConfig; auth: AuthAdapter | null; api?: TogivaClient }) {
  const { pathname } = useLocation();
  if (config.missing.length)
    return <Centered><ErrorState title="App is not configured" message={`Missing build settings: ${config.missing.join(", ")}. See .env.example.`} /></Centered>;
  if (!auth) return <Centered><AuthNotConfigured appName={apps.customer.name} /></Centered>;

  return (
    <SessionProvider auth={auth} apiBaseUrl={config.apiUrl} organizationSlug={config.organizationSlug} api={api}>
      <ToastProvider>
        <a className="skip-link" href="#main">Skip to content</a>
        <SessionGate signedOut={<Welcome />}>
          <TabBarShell nav={customerNav} activePath={pathname} Link={Link} brand={<Brand />}>
            <Routes>
              <Route index element={<HomeScreen />} />
              <Route path="code" element={<CodeScreen />} />
              <Route path="rewards" element={<RewardsScreen />} />
              <Route path="activity" element={<ActivityScreen />} />
              <Route path="stores" element={<StoresScreen />} />
              <Route path="account" element={<AccountScreen />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </TabBarShell>
        </SessionGate>
      </ToastProvider>
    </SessionProvider>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return <div className="centered">{children}</div>;
}

/** Signed-out landing: brand moment plus the sign-in / sign-up card. */
function Welcome() {
  return (
    <div className="welcome">
      <header className="welcome__band">
        <img src={logoUrl} alt="Corn dogs by Mr. Cow" width={1238} height={330} className="welcome__logo" />
        <p className="welcome__sticker ui-script">rewards</p>
        <h1 className="ui-display welcome__title">The original crunch you crave.</h1>
        <p className="welcome__lede">Sign in or create an account for your Mr. Cow membership.</p>
      </header>
      <main id="main" className="welcome__main">
        <SignInForm allowSignUp />
      </main>
    </div>
  );
}
