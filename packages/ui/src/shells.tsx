import type { ComponentType, ReactNode } from "react";
import { Icon } from "./icons.js";

export interface ShellNavItem {
  to: string;
  label: string;
  icon?: string;
}

/** Router-agnostic link: apps pass their router's NavLink (or an <a>). */
export type ShellLink = ComponentType<{ to: string; className?: string; children: ReactNode; "aria-current"?: "page" }>;

interface Common {
  nav: ShellNavItem[];
  activePath: string;
  Link: ShellLink;
  children: ReactNode;
}

const isActive = (to: string, path: string) => (to === "/" ? path === "/" : path === to || path.startsWith(`${to}/`));

/**
 * Consumer shell: brand header, content, and a bottom tab bar on phones that
 * becomes a top navigation row on wide screens.
 */
export function TabBarShell({ nav, activePath, Link, children, brand, headerAction }: Common & { brand: ReactNode; headerAction?: ReactNode }) {
  return (
    <div className="ui-tabshell">
      <header className="ui-tabshell__header">
        <div className="ui-tabshell__brand">{brand}</div>
        <nav className="ui-tabshell__topnav" aria-label="Main">
          {nav.map((n) => (
            <Link key={n.to} to={n.to} className="ui-tabshell__toplink" aria-current={isActive(n.to, activePath) ? "page" : undefined}>
              {n.label}
            </Link>
          ))}
        </nav>
        {headerAction ? <div className="ui-tabshell__action">{headerAction}</div> : null}
      </header>
      <main className="ui-tabshell__main" id="main">{children}</main>
      <nav className="ui-tabbar" aria-label="Main">
        {nav.map((n) => (
          <Link key={n.to} to={n.to} className="ui-tabbar__item" aria-current={isActive(n.to, activePath) ? "page" : undefined}>
            <Icon name={n.icon ?? "home"} />
            <span>{n.label}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
}

export interface SidebarSection {
  label?: string;
  items: ShellNavItem[];
}

/** Operations shell for the franchise portal and corporate console. */
export function SidebarShell({
  sections, activePath, Link, children, brand, context, user,
}: Omit<Common, "nav"> & { sections: SidebarSection[]; brand: ReactNode; context?: ReactNode; user?: ReactNode }) {
  return (
    <div className="ui-sideshell">
      <aside className="ui-sideshell__aside">
        <div className="ui-sideshell__brand">{brand}</div>
        {context ? <div className="ui-sideshell__context">{context}</div> : null}
        <nav aria-label="Main" className="ui-sideshell__nav">
          {sections.map((s, i) =>
            s.items.length ? (
              <div key={s.label ?? i} className="ui-sideshell__section">
                {s.label ? <p className="ui-sideshell__label">{s.label}</p> : null}
                {s.items.map((n) => (
                  <Link key={n.to} to={n.to} className="ui-sideshell__link" aria-current={isActive(n.to, activePath) ? "page" : undefined}>
                    <Icon name={n.icon ?? "home"} size={18} />
                    <span>{n.label}</span>
                  </Link>
                ))}
              </div>
            ) : null,
          )}
        </nav>
        {user ? <div className="ui-sideshell__user">{user}</div> : null}
      </aside>
      <main className="ui-sideshell__main" id="main">{children}</main>
    </div>
  );
}

/** Minimal accessible bar chart (SVG); a fuller chart kit comes with the reporting screens. */
export function BarChart({ data, label, format = String }: { data: { label: string; value: number }[]; label: string; format?: (n: number) => string }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <figure className="ui-chart">
      <figcaption className="ui-chart__caption">{label}</figcaption>
      <ul className="ui-chart__bars">
        {data.map((d) => (
          <li key={d.label}>
            <span className="ui-chart__label">{d.label}</span>
            <span className="ui-chart__track"><span className="ui-chart__bar" style={{ width: `${(d.value / max) * 100}%` }} /></span>
            <span className="ui-chart__value">{format(d.value)}</span>
          </li>
        ))}
      </ul>
    </figure>
  );
}
