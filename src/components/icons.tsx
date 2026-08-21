type IconProps = { className?: string };

export function DiscordIcon({ className }: IconProps) {
  return <svg className={className} viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M19.5 5.3A16.8 16.8 0 0 0 15.4 4l-.5 1a15.4 15.4 0 0 0-5.8 0l-.5-1a16.6 16.6 0 0 0-4.1 1.3C1.9 9.1 1.2 12.8 1.5 16.4a16.7 16.7 0 0 0 5 2.5l1.2-1.6a9.7 9.7 0 0 1-1.9-.9l.5-.4c3.7 1.7 7.7 1.7 11.4 0l.5.4c-.6.4-1.2.7-1.9 1l1.2 1.5a16.6 16.6 0 0 0 5-2.5c.4-4.2-.7-7.9-3-11.1ZM8.7 14.1c-1 0-1.8-.9-1.8-2s.8-2 1.8-2 1.8.9 1.8 2-.8 2-1.8 2Zm6.6 0c-1 0-1.8-.9-1.8-2s.8-2 1.8-2 1.8.9 1.8 2-.8 2-1.8 2Z" /></svg>;
}

export function CUIcon({ className }: IconProps) {
  void className;
  const fillStyle = {fill: "#de5c8e"};
  return <svg id="13f7bbaa-5f3b-4b75-bb58-dc8ef8524eff" data-name="Layer 1" xmlns="http://www.w3.org/2000/svg" width="47.98" height="24" viewBox="0 0 47.98 24">
      <title>cu-logo</title>
      <path style={fillStyle} d="M36,18.75A6.75,6.75,0,0,0,42.73,12V0h-3V12a3.75,3.75,0,1,1-7.5,0h0V0h-3V12A6.75,6.75,0,0,0,36,18.75Z"/>
      <path style={fillStyle} d="M24,12a12,12,0,0,0,24,0V0H45V12a9,9,0,0,1-18,.12V0H24Z"/>
      <line style={fillStyle} x1="24" y1="3" x2="24" y2="5.24"/>
      <path style={fillStyle} d="M5.25,12A6.75,6.75,0,0,0,12,18.74H24v-3H12a3.75,3.75,0,1,1,0-7.5H24v-3H12A6.75,6.75,0,0,0,5.25,12Z"/>
      <path style={fillStyle} d="M12,0a12,12,0,0,0,0,24H24V21H12a9,9,0,0,1-.12-18H24V0H12Z"/>
      <line style={fillStyle} x1="21" y1="0.01" x2="18.76" y2="0.01"/>
  </svg>;
}

export function ArrowIcon({ className }: IconProps) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg>;
}

export function ShieldIcon({ className }: IconProps) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M12 3 4.5 6v5.5c0 4.5 3 7.8 7.5 9.5 4.5-1.7 7.5-5 7.5-9.5V6L12 3Z" /><path d="m8.5 12 2.2 2.2 4.7-4.7" /></svg>;
}
