import { Brand } from "@/components/brand";

// Shown instantly on navigation while a page's server data loads.
export default function Loading() {
  return (
    <div className="page">
      <header className="site-header"><div className="container header-inner">
        <Brand />
        <span className="skeleton" style={{ width: 120, height: 32, marginLeft: "auto" }} />
      </div></header>
      <main className="container stack" style={{ "--gap": "16px", paddingBlock: 48 } as React.CSSProperties} aria-busy="true" aria-label="Loading">
        <span className="skeleton" style={{ width: 240, height: 36 }} />
        <span className="skeleton" style={{ width: "60%", height: 14 }} />
        <span className="skeleton" style={{ height: 160 }} />
        <span className="skeleton" style={{ height: 120 }} />
      </main>
    </div>
  );
}
