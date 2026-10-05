/** How each kind of announcement is labelled and toned, on the banner and on
 *  /announcements. `alert` and `badge` are the globals.css tone suffixes. */
export const SEVERITY: Record<string, { label: string; badge: string; alert: string }> = {
  info: { label: "News", badge: "lavender", alert: "" },
  warning: { label: "Warning", badge: "amber", alert: " alert-warning" },
  maintenance: { label: "Maintenance", badge: "danger", alert: " alert-error" }
};
