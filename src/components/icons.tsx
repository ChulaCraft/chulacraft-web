type IconProps = { className?: string };

export function DiscordIcon({ className }: IconProps) {
  return <svg className={className} viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M19.5 5.3A16.8 16.8 0 0 0 15.4 4l-.5 1a15.4 15.4 0 0 0-5.8 0l-.5-1a16.6 16.6 0 0 0-4.1 1.3C1.9 9.1 1.2 12.8 1.5 16.4a16.7 16.7 0 0 0 5 2.5l1.2-1.6a9.7 9.7 0 0 1-1.9-.9l.5-.4c3.7 1.7 7.7 1.7 11.4 0l.5.4c-.6.4-1.2.7-1.9 1l1.2 1.5a16.6 16.6 0 0 0 5-2.5c.4-4.2-.7-7.9-3-11.1ZM8.7 14.1c-1 0-1.8-.9-1.8-2s.8-2 1.8-2 1.8.9 1.8 2-.8 2-1.8 2Zm6.6 0c-1 0-1.8-.9-1.8-2s.8-2 1.8-2 1.8.9 1.8 2-.8 2-1.8 2Z" /></svg>;
}

export function CUIcon({ className }: IconProps) {
  return <svg className={className} width="47.98" height="24" viewBox="0 0 47.98 24" fill="white" aria-hidden="true">
    <path d="M36,18.75A6.75,6.75,0,0,0,42.73,12V0h-3V12a3.75,3.75,0,1,1-7.5,0h0V0h-3V12A6.75,6.75,0,0,0,36,18.75Z" />
    <path d="M24,12a12,12,0,0,0,24,0V0H45V12a9,9,0,0,1-18,.12V0H24Z" />
    <path d="M5.25,12A6.75,6.75,0,0,0,12,18.74H24v-3H12a3.75,3.75,0,1,1,0-7.5H24v-3H12A6.75,6.75,0,0,0,5.25,12Z" />
    <path d="M12,0a12,12,0,0,0,0,24H24V21H12a9,9,0,0,1-.12-18H24V0H12Z" />
  </svg>;
}

export function GoogleIcon({ className }: IconProps) {
  return <svg className={className} viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M21.8 10.2H12v3.9h5.6c-.5 2.6-2.7 4.1-5.6 4.1a6.2 6.2 0 1 1 4-10.9l2.9-2.9A10.2 10.2 0 1 0 12 22.2c5.9 0 10-4.1 10-10 0-.7-.1-1.3-.2-2Z" /></svg>;
}

export function ArrowIcon({ className }: IconProps) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg>;
}

export function ShieldIcon({ className }: IconProps) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M12 3 4.5 6v5.5c0 4.5 3 7.8 7.5 9.5 4.5-1.7 7.5-5 7.5-9.5V6L12 3Z" /><path d="m8.5 12 2.2 2.2 4.7-4.7" /></svg>;
}

// Pixel-style 16×16 stroke icons from the ChulaCraft design.
const PIXEL_PATHS = {
  check: "M3 8.5 6.5 12 13 4.5",
  clock: "M2 2h12v12H2zM8 4.5v4h3",
  warning: "M8 1.5 15 14H1zM8 6v3.5M8 11.5v.5",
  info: "M2 2h12v12H2zM8 5v4M8 11v.5",
  retry: "M13 8a5 5 0 1 1-1.5-3.5M13 2v3h-3",
  revoked: "M2 2h12v12H2zM4.5 11.5l7-7",
  shield: "M8 1.5 14 4v4c0 3.5-2.5 5.5-6 6.5C4.5 13.5 2 11.5 2 8V4zM5.5 8 7.5 10 10.5 6",
  lock: "M2.5 7h11v7.5h-11zM5 7V4.5a3 3 0 0 1 6 0V7",
  copy: "M5 5h9v9H5zM11 2H2v9",
  chevron: "M4 6l4 4 4-4",
  arrow: "M3 8h10M9 4l4 4-4 4",
  back: "M13 8H3M7 4 3 8l4 4",
  search: "M2 2h8v8H2zM10.5 10.5 14 14",
  menu: "M2 4h12M2 8h12M2 12h12",
  close: "M3 3l10 10M13 3 3 13",
  signout: "M6 2H2v12h4M10 5l3 3-3 3M13 8H6",
  plus: "M8 3v10M3 8h10",
  user: "M6 2h4v5H6zM3 14v-2h2v-2h6v2h2v2"
} as const;

export type PixelIconName = keyof typeof PIXEL_PATHS;

export function PixelIcon({ name, className, size = 16 }: IconProps & { name: PixelIconName; size?: number }) {
  return <svg className={className} width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square" aria-hidden="true"><path d={PIXEL_PATHS[name]} /></svg>;
}
