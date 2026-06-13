/**
 * Dashboard panel: overview copy, UTC clock, credits (no decorative graphic).
 */
function formatUtcParts(date) {
  const d = date instanceof Date ? date : new Date(date);
  const dateStr = d.toLocaleDateString("en-GB", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
  const timeStr = d.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
    timeZone: "UTC",
  });
  return { dateStr, timeStr };
}

export default function SystemOverviewCard({ clock }) {
  const utc = clock != null ? formatUtcParts(clock) : null;

  return (
    <div className="system-overview-card">
      <div className="system-overview-body">
        <div className="system-overview-heading-row">
          <h3 className="system-overview-heading">System Overview</h3>
          {utc != null && (
            <div className="system-overview-clock">
              <span className="sov-clock-label">Mission time · UTC</span>
              <time
                className="sov-clock-display"
                dateTime={clock.toISOString()}
              >
                <span className="sov-clock-date">{utc.dateStr}</span>
                <span className="sov-clock-time">{utc.timeStr}</span>
              </time>
            </div>
          )}
        </div>
        <p className="system-overview-description">
          Space Mission Management System (SMMS) is an advanced telemetric dashboard designed to orchestrate spacecraft launches, monitor deep-space equipment, and manage astronaut assignments across the cosmos.
        </p>
        <div className="system-overview-credits" aria-label="Project creators">
          <span className="system-overview-credits-label">Designed &amp; built by</span>
          <div className="system-overview-credits-names">
            <span className="sov-name-theme">Hareem Hamid</span>
            <span className="sov-name-theme sov-name-join">&amp;</span>
            <span className="sov-name-theme">Zara Asif</span>
          </div>
        </div>
      </div>
    </div>
  );
}
