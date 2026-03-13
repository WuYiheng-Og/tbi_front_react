import { PatientInfoDialog } from "../components/patient-info-dialog";

const metricSlots: { id: string; group: "脑电" | "脑氧" | "脑血流"; label: string }[] = [
  { id: "eeg-1", group: "脑电", label: "脑电指标 1" },
  { id: "eeg-2", group: "脑电", label: "脑电指标 2" },
  { id: "eeg-3", group: "脑电", label: "脑电指标 3" },
  { id: "eeg-4", group: "脑电", label: "脑电指标 4" },
  { id: "nirs-1", group: "脑氧", label: "脑氧指标 1" },
  { id: "nirs-2", group: "脑氧", label: "脑氧指标 2" },
  { id: "cbf-1", group: "脑血流", label: "脑血流指标 1" },
  { id: "cbf-2", group: "脑血流", label: "脑血流指标 2" },
];

export default function Home() {
  return (
    <div className="flex h-full w-full flex-col bg-dashboard-bg">
      {/* 顶部 Header */}
      <header className="flex items-center justify-between border-b border-dashboard-border px-8 py-4">
        <div>
          <h1 className="text-xl font-semibold text-dashboard-text">多模态可视化</h1>
        </div>
        <PatientInfoDialog />
      </header>

      {/* 主体区域：仅保留大面积可视化区域 */}
      <main className="flex flex-1 flex-col px-8 py-6">
        <section className="flex-1 rounded-lg border border-dashboard-border bg-dashboard-panel px-4 py-3">

          <div className="grid h-full grid-cols-1 gap-3 xl:grid-cols-2">
            {metricSlots.map((metric) => (
              <div
                key={metric.id}
                className="flex flex-col justify-between rounded-md border border-dashboard-border bg-dashboard-bg/60 px-3 py-2"
              >
                <div className="flex items-center justify-between text-[11px]">
                  <div className="flex items-baseline gap-2">
                    <span className="text-dashboard-muted">{metric.group}</span>
                    <span className="text-dashboard-text">{metric.label}</span>
                  </div>
                  <span className="font-mono text-xs text-dashboard-accent">0.0</span>
                </div>

                <div className="mt-2 flex-1 rounded-sm border border-dashed border-dashboard-border/80 bg-dashboard-panel/40">
                  {/* 后续在此处放置波形 / 曲线图等可视化内容 */}
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
