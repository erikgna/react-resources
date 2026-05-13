interface Props {
  label: string;
  value: string | number;
  color: string;
}

// Pure SSR component — NOT in islands/, so zero JS is shipped for it.
export default function StatCard({ label, value, color }: Props) {
  return (
    <div
      style={`
        border: 2px solid ${color};
        border-radius: 8px;
        padding: 10px 14px;
        text-align: center;
        min-width: 100px;
      `}
    >
      <div style="font-size:11px;color:#888;margin-bottom:2px">{label}</div>
      <div style={`font-size:16px;font-weight:700;color:${color}`}>{value}</div>
    </div>
  );
}
