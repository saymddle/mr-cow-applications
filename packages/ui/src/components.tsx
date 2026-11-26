import { forwardRef, useEffect, useId, useRef, type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode } from "react";

const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");

export type ButtonVariant = "primary" | "secondary" | "accent" | "ghost" | "danger";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: "md" | "sm" | "lg";
  loading?: boolean;
  block?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "primary", size = "md", loading, block, className, children, disabled, type = "button", ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      className={cx("ui-btn", `ui-btn--${variant}`, `ui-btn--${size}`, block && "ui-btn--block", className)}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...rest}
    >
      {loading ? <Spinner size={16} label="" /> : null}
      <span>{children}</span>
    </button>
  );
});

export function Card({ children, className, tone = "surface", as: As = "section", ...rest }: { children: ReactNode; className?: string; tone?: "surface" | "accent" | "inverse" | "primary"; as?: "section" | "article" | "div" } & Record<string, unknown>) {
  return (
    <As className={cx("ui-card", `ui-card--${tone}`, className)} {...rest}>
      {children}
    </As>
  );
}

export interface FieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  hint?: string;
  error?: string | null;
}

export const Field = forwardRef<HTMLInputElement, FieldProps>(function Field({ label, hint, error, id, className, ...rest }, ref) {
  const auto = useId();
  const inputId = id ?? auto;
  const hintId = hint ? `${inputId}-hint` : undefined;
  const errId = error ? `${inputId}-err` : undefined;
  return (
    <div className={cx("ui-field", error && "ui-field--error", className)}>
      <label htmlFor={inputId}>{label}</label>
      <input ref={ref} id={inputId} aria-invalid={error ? true : undefined} aria-describedby={cx(hintId, errId) || undefined} {...rest} />
      {hint && !error ? <p id={hintId} className="ui-field__hint">{hint}</p> : null}
      {error ? <p id={errId} className="ui-field__error" role="alert">{error}</p> : null}
    </div>
  );
});

export function Spinner({ size = 24, label = "Loading" }: { size?: number; label?: string }) {
  return (
    <span className="ui-spinner" style={{ width: size, height: size }} role={label ? "status" : undefined} aria-label={label || undefined} />
  );
}

export function LoadingState({ label = "Loading" }: { label?: string }) {
  return (
    <div className="ui-state ui-state--loading">
      <Spinner size={32} label={label} />
      <p>{label}…</p>
    </div>
  );
}

export function EmptyState({ title, children, action, icon }: { title: string; children?: ReactNode; action?: ReactNode; icon?: ReactNode }) {
  return (
    <div className="ui-state">
      {icon ? <div className="ui-state__icon">{icon}</div> : null}
      <h3 className="ui-state__title">{title}</h3>
      {children ? <div className="ui-state__body">{children}</div> : null}
      {action ? <div className="ui-state__action">{action}</div> : null}
    </div>
  );
}

export function ErrorState({ title = "Something went wrong", message, requestId, onRetry }: { title?: string; message: string; requestId?: string; onRetry?: () => void }) {
  return (
    <div className="ui-state ui-state--error" role="alert">
      <h3 className="ui-state__title">{title}</h3>
      <p className="ui-state__body">{message}</p>
      {requestId ? <p className="ui-state__meta">Reference: {requestId}</p> : null}
      {onRetry ? <Button variant="secondary" onClick={onRetry}>Try again</Button> : null}
    </div>
  );
}

export type StatusTone = "neutral" | "success" | "warning" | "danger" | "info";

export function StatusPill({ tone = "neutral", children }: { tone?: StatusTone; children: ReactNode }) {
  return <span className={cx("ui-pill", `ui-pill--${tone}`)}>{children}</span>;
}

export function Stat({ label, value, hint, tone }: { label: string; value: ReactNode; hint?: ReactNode; tone?: StatusTone }) {
  return (
    <div className="ui-stat">
      <div className="ui-stat__label">{label}</div>
      <div className="ui-stat__value">{value}</div>
      {hint ? <div className={cx("ui-stat__hint", tone && `ui-stat__hint--${tone}`)}>{hint}</div> : null}
    </div>
  );
}

export function PageHeader({ title, eyebrow, description, actions }: { title: string; eyebrow?: string; description?: ReactNode; actions?: ReactNode }) {
  return (
    <header className="ui-page-header">
      <div>
        {eyebrow ? <p className="ui-eyebrow">{eyebrow}</p> : null}
        <h1 className="ui-display">{title}</h1>
        {description ? <p className="ui-page-header__desc">{description}</p> : null}
      </div>
      {actions ? <div className="ui-page-header__actions">{actions}</div> : null}
    </header>
  );
}

export interface Column<T> {
  key: string;
  header: string;
  render: (row: T) => ReactNode;
  align?: "left" | "right";
}

export function Table<T>({ columns, rows, rowKey, caption, empty }: { columns: Column<T>[]; rows: T[]; rowKey: (row: T) => string; caption?: string; empty?: ReactNode }) {
  if (rows.length === 0 && empty) return <>{empty}</>;
  return (
    <div className="ui-table-wrap">
      <table className="ui-table">
        {caption ? <caption>{caption}</caption> : null}
        <thead>
          <tr>
            {columns.map((c) => (
              <th key={c.key} scope="col" style={{ textAlign: c.align ?? "left" }}>{c.header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={rowKey(r)}>
              {columns.map((c) => (
                <td key={c.key} style={{ textAlign: c.align ?? "left" }}>{c.render(r)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Accessible modal on the native <dialog> element (focus trap and Escape handled by the browser). */
export function Modal({ open, title, onClose, children, footer }: { open: boolean; title: string; onClose: () => void; children: ReactNode; footer?: ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) (d.showModal ? d.showModal() : d.setAttribute("open", ""));
    if (!open && d.open) (d.close ? d.close() : d.removeAttribute("open"));
  }, [open]);
  return (
    <dialog ref={ref} className="ui-modal" aria-labelledby={titleId} onClose={onClose} onCancel={(e) => { e.preventDefault(); onClose(); }}>
      <div className="ui-modal__head">
        <h2 id={titleId} className="ui-modal__title">{title}</h2>
        <button type="button" className="ui-modal__close" aria-label="Close" onClick={onClose}>×</button>
      </div>
      <div className="ui-modal__body">{children}</div>
      {footer ? <div className="ui-modal__foot">{footer}</div> : null}
    </dialog>
  );
}

/** Marks a screen whose feature lands in a later delivery phase, so nothing pretends to work. */
export function PlannedFeature({ title, icon, phase, children }: { title: string; icon?: ReactNode; phase: string; children: ReactNode }) {
  return (
    <Card className="ui-planned">
      <EmptyState icon={icon} title={title}>
        <p>{children}</p>
        <p className="ui-planned__phase"><StatusPill tone="warning">{phase}</StatusPill></p>
      </EmptyState>
    </Card>
  );
}
