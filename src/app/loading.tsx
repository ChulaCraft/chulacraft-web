// Shown instantly on navigation while a page's server data loads; the layout keeps the header.
export default function Loading() {
  return (
    <main className="container stack" style={{ "--gap": "16px", paddingBlock: 48 } as React.CSSProperties} aria-busy="true" aria-label="Loading">
      <span className="skeleton" style={{ width: 240, height: 36 }} />
      <span className="skeleton" style={{ width: "60%", height: 14 }} />
      <span className="skeleton" style={{ height: 160 }} />
      <span className="skeleton" style={{ height: 120 }} />
    </main>
  );
}
