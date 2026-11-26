import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from "react";

export type ToastTone = "info" | "success" | "warning" | "danger";
interface Toast { id: number; message: string; tone: ToastTone }

const ToastContext = createContext<((message: string, tone?: ToastTone) => void) | null>(null);

/** Transient notifications. Announced politely to screen readers; errors assertively. */
export function ToastProvider({ children, durationMs = 5000 }: { children: ReactNode; durationMs?: number }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const next = useRef(1);
  const dismiss = useCallback((id: number) => setToasts((t) => t.filter((x) => x.id !== id)), []);
  const push = useCallback(
    (message: string, tone: ToastTone = "info") => {
      const id = next.current++;
      setToasts((t) => [...t.slice(-3), { id, message, tone }]);
      setTimeout(() => dismiss(id), durationMs);
    },
    [dismiss, durationMs],
  );
  const value = useMemo(() => push, [push]);
  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="ui-toasts">
        {toasts.map((t) => (
          <div key={t.id} className={`ui-toast ui-toast--${t.tone}`} role={t.tone === "danger" ? "alert" : "status"}>
            <span>{t.message}</span>
            <button type="button" aria-label="Dismiss" onClick={() => dismiss(t.id)}>×</button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside <ToastProvider>");
  return ctx;
}
