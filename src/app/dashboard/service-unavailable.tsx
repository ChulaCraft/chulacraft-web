import { PixelIcon } from "@/components/icons";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export function ServiceUnavailable() {
  return (
    <div className="page">
      <SiteHeader user={null} />
      <main className="narrow" style={{ "--narrow": "540px" } as React.CSSProperties}>
        <div>
          <div className="alert alert-error pixel-4" role="status">
            <PixelIcon name="warning" />
            <div className="stack" style={{ "--gap": "4px" } as React.CSSProperties}>
              <h1 className="alert-title">Registration is temporarily unavailable</h1>
              <p className="alert-body">Please refresh in a moment. Your saved registration has not been changed.</p>
            </div>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
