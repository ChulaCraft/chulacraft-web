import { PixelIcon } from "@/components/icons";

export function ServiceUnavailable() {
  return (
    <>
      <main className="narrow w-540">
        <div>
          <div className="alert alert-error pixel-4" role="status">
            <PixelIcon name="warning" />
            <div className="stack gap-4">
              <h1 className="alert-title">Registration is temporarily unavailable</h1>
              <p className="alert-body">Please refresh in a moment. Your saved registration has not been changed.</p>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
