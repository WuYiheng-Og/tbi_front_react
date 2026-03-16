"use client";

import { BarChart2, Cpu, Monitor, UserRound } from "lucide-react";
import { type PatientSummary } from "./patient-info-dialog";

export function PatientBadge({ summary }: { summary: PatientSummary }) {
  return (
    <div className="flex items-center gap-5 text-white">
      <div className="flex flex-col items-center gap-1">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#0e4a5c]">
          <UserRound className="h-6 w-6 text-[#ff7f27]" />
        </div>
        <span className="text-sm font-medium">{summary.name || "未知"}</span>
        <span className="text-xs text-white/90">{summary.age || "--"}岁</span>
      </div>
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
