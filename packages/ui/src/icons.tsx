import type { SVGProps } from "react";

/** Simple 24px stroke icons drawn for these apps (no third-party icon set). */
const paths: Record<string, string> = {
  home: "M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z",
  wallet: "M3 7a2 2 0 0 1 2-2h13v4M3 7v11a2 2 0 0 0 2 2h15V9H5a2 2 0 0 1-2-2zm13 7h.01",
  code: "M5 4h14a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1zm3 6h2m4 0h2M8 14h2m4 0h2",
  gift: "M4 11h16v9H4zM3 7h18v4H3zm9 0v13M12 7S10 3 7.5 4 9 7 12 7zm0 0s2-4 4.5-3S15 7 12 7z",
  tag: "M3 12V4a1 1 0 0 1 1-1h8l9 9-9 9zM7.5 7.5h.01",
  pin: "M12 21s7-6.2 7-12a7 7 0 1 0-14 0c0 5.8 7 12 7 12zm0-9.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z",
  user: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm-8 9a8 8 0 0 1 16 0",
  receipt: "M6 3h12v18l-3-2-3 2-3-2-3 2zM9 8h6m-6 4h6m-6 4h3",
  users: "M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM2 21a7 7 0 0 1 14 0m1-10a3 3 0 1 0 0-6m5 16a6 6 0 0 0-4-5.7",
  chart: "M4 20V10m6 10V4m6 16v-7m4 7H2",
  settings: "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm7.4-3a7.4 7.4 0 0 0-.1-1.2l2-1.6-2-3.4-2.4 1a7.6 7.6 0 0 0-2-1.2L14.5 3h-5l-.4 2.6a7.6 7.6 0 0 0-2 1.2l-2.4-1-2 3.4 2 1.6a7.4 7.4 0 0 0 0 2.4l-2 1.6 2 3.4 2.4-1a7.6 7.6 0 0 0 2 1.2l.4 2.6h5l.4-2.6a7.6 7.6 0 0 0 2-1.2l2.4 1 2-3.4-2-1.6c.1-.4.1-.8.1-1.2z",
  store: "M4 9l1.5-5h13L20 9M4 9h16M4 9v11h16V9M9 20v-6h6v6",
  support: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zm0-5v.01M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.5",
  megaphone: "M3 10v4a1 1 0 0 0 1 1h3l8 5V4L7 9H4a1 1 0 0 0-1 1zm16-1a4 4 0 0 1 0 6",
  shield: "M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6z",
  logout: "M15 4h4a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1h-4M10 16l-4-4 4-4m-4 4h11",
  plug: "M9 3v5m6-5v5M6 8h12v3a6 6 0 0 1-12 0zm6 9v4",
  map: "M9 4 3 6v14l6-2 6 2 6-2V4l-6 2zm0 0v14m6-12v14",
};
export type IconName = keyof typeof paths;
export const iconNames = Object.keys(paths);

export function Icon({ name, size = 22, ...rest }: { name: string; size?: number } & SVGProps<SVGSVGElement>) {
  const d = paths[name] ?? paths.home!;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false" {...rest}>
      <path d={d} />
    </svg>
  );
}
