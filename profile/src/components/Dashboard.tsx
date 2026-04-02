import type { ProfilerStats } from "../hooks/useProfilerData";

interface DashboardProps {
  stats: ProfilerStats;
  onReset: () => void;
}

export function Dashboard({ stats, onReset }: DashboardProps) {
  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <span>Profiler Dashboard</span>
        <button onClick={onReset} className="btn btn-sm">Reset</button>
      </div>
      <div className="dashboard-metrics">
        <Metric label="Render Count" value={stats.count} unit="" />
        <Metric label="Last Duration" value={stats.lastDuration.toFixed(2)} unit="ms" />
        <Metric label="Avg Duration" value={stats.avgDuration.toFixed(2)} unit="ms" />
      </div>
      {stats.entries.length > 0 && (
        <div className="dashboard-chart">
          {stats.entries.map((e, i) => (
            <div
              key={i}
              className="bar"
              style={{ height: `${Math.min(e.actualDuration * 4, 60)}px` }}
              title={`${e.phase}: ${e.actualDuration.toFixed(2)}ms`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function Metric({ label, value, unit }: { label: string; value: string | number; unit: string }) {
  return (
    <div className="metric">
      <div className="metric-value">{value}{unit}</div>
      <div className="metric-label">{label}</div>
    </div>
  );
}
