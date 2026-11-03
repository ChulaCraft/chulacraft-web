// One port base per worktree, so parallel visual runs never share a server:
// VISUAL_PORT_BASE=3350 npm run test:visual. App is the base, the Supabase stub
// base+1, the manager mock base+2.
const parsed = Number(process.env.VISUAL_PORT_BASE);
export const base = Number.isInteger(parsed) && parsed > 0 ? parsed : 3210;
export const appPort = base;
export const stubPort = base + 1;
export const managerPort = base + 2;
export const appUrl = `http://127.0.0.1:${appPort}`;
export const stubUrl = `http://127.0.0.1:${stubPort}`;
export const managerUrl = `http://127.0.0.1:${managerPort}`;
