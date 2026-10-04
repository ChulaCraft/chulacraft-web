// The admin layout keeps its header, so only the content area needs a placeholder.
export default function Loading() {
  return <>
    <span className="skeleton" style={{ width: 200, height: 36 }} aria-busy="true" aria-label="Loading" />
    <span className="skeleton" style={{ height: 120 }} />
    <span className="skeleton" style={{ height: 200 }} />
  </>;
}
