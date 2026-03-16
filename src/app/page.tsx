"use client";

import { BarChart2, Cpu, Monitor, UserRound, Play, Square } from "lucide-react";
import { useState } from "react";
import { PatientInfoDialog, type PatientSummary } from "../components/patient-info-dialog";
import { EEGCard1, EEGCard2, EEGCard3, EEGCard4 } from "../components/eeg-panel";
import { NIRSCard1, NIRSCard2 } from "../components/nirs-panel";
import { CBFCard1, CBFCard2 } from "../components/cbf-panel";

function PatientBadge({ summary }: { summary: PatientSummary }) {
  return (
    <div className="flex items-center gap-5 text-white">
      {/* 左侧：头像 + 姓名 + 年龄（竖向） */}
      <div className="flex flex-col items-center gap-1">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#0e4a5c]">
          <UserRound className="h-6 w-6 text-[#ff7f27]" />
        </div>
        <span className="text-sm font-medium">{summary.name || "未知"}</span>
        <span className="text-xs text-white/90">{summary.age || "--"}岁</span>
      </div>
      {/* 右侧：圆角面板，三条设备信息（橙色图标 + 白字） */}
      <div className="rounded-lg bg-[#0d3540] px-4 py-3">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <Monitor className="h-4 w-4 shrink-0 text-[#ff7f27]" />
            <span className="text-sm">德力凯:{summary.delikaiModeText || "--"}</span>
          </div>
          <div className="flex items-center gap-2">
            <Cpu className="h-4 w-4 shrink-0 text-[#ff7f27]" />
            <span className="text-sm">尼高力:{summary.nicoletModeText || "--"}</span>
          </div>
          <div className="flex items-center gap-2">
            <BarChart2 className="h-4 w-4 shrink-0 text-[#ff7f27]" />
            <span className="text-sm">依露得力:{summary.yldlModeText || "--"}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const [patient, setPatient] = useState<PatientSummary | null>(null);
  const [isRunning, setIsRunning] = useState(false);

  const handleStart = () => setIsRunning(true);
  const handleStop = () => setIsRunning(false);

  return (
    <div className="flex h-full w-full flex-col bg-dashboard-bg">
      {/* 顶部 Header */}
      <header className="flex items-center justify-between border-b border-dashboard-border px-8 py-4">
        <div className="flex items-center gap-4">
          {patient && <PatientBadge summary={patient} />}
          {!patient && (
            <h1 className="text-xl font-semibold text-dashboard-text">多模态可视化</h1>
          )}
        </div>
        <div className="flex items-center gap-4">
          {patient && (
            <div className="flex gap-2">
              {!isRunning ? (
                <button
                  onClick={handleStart}
                  className="flex items-center gap-2 rounded-md bg-green-600 px-4 py-2 text-white hover:bg-green-700"
                >
                  <Play className="h-4 w-4" />
                  开始
                </button>
              ) : (
                <button
                  onClick={handleStop}
                  className="flex items-center gap-2 rounded-md bg-red-600 px-4 py-2 text-white hover:bg-red-700"
                >
                  <Square className="h-4 w-4" />
                  结束
                </button>
              )}
            </div>
          )}
          {!patient && <PatientInfoDialog onCompleted={setPatient} />}
        </div>
      </header>

      {/* 主体区域：两列四行布局 */}
      <main className="flex flex-1 flex-col">
        <section className="flex-1 flex flex-col">

          {/* 脑电 - 4个指标，占 2 行 (50%) */}
          <div className="flex-[1.7] grid grid-cols-2">
            <EEGCard1 isRunning={isRunning} />
            <EEGCard2 />
            <EEGCard3 />
            <EEGCard4 />
          </div> 

          {/* 脑血流 - 2个指标，占 1 行 (25%) */}
          <div className="flex-1 grid grid-cols-2">
            <CBFCard1 />
            <CBFCard2 />
          </div>

          {/* 脑氧 - 2个指标，占 1 行 (25%) */}
          <div className="flex-[0.8] grid grid-cols-2">
            <NIRSCard1 />
            <NIRSCard2 />
          </div>

        </section>
      </main>
    </div>
  );
}
