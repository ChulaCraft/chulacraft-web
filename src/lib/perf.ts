// Logs "<label> <ms>" server-side when PERF_TRACE is set, to measure each page's call waterfall.
// Kept on purpose: without PERF_TRACE it is a pass-through no-op, and it lets the waterfall be
// measured again on a Vercel preview (docs/perf-baseline.md). Passes the value or rejection through unchanged.
export async function timed<T>(label: string, p: PromiseLike<T>): Promise<T> {
  const trace = Boolean(process.env.PERF_TRACE);
  const start = trace ? performance.now() : 0;
  try {
    return await p;
  } finally {
    if (trace) console.log(`${label} ${Math.round(performance.now() - start)}`);
  }
}
