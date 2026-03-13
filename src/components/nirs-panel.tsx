"use client";

type MetricCardProps = {
  label: string;
  value?: string;
};

export function MetricCard({ label, value = "0.0" }: MetricCardProps) {
  return (
    <div className="flex flex-col border-r border-b border-dashboard-border">
      <div className="flex items-center justify-between border-b border-dashboard-border bg-dashboard-bg/60 px-3 py-2 text-[11px]">
        <span className="text-dashboard-text">{label}</span>
        <span className="font-mono text-xs text-dashboard-accent">{value}</span>
      </div>

      <div className="flex-1 bg-dashboard-panel/40">
        {/* 后续在此处放置波形 / 曲线图等可视化内容 */}
      </div>
    </div>
  );
}

export function NIRSCard1() {
  return <MetricCard label="指标 1" />;
}

export function NIRSCard2() {
  return <MetricCard label="指标 2" />;
}
