"use client";

import { BarChart2, Cpu, Monitor, UserRound, Play, Square } from "lucide-react";
import { useState, useEffect, useMemo, useRef } from "react";
import { PatientInfoDialog, type PatientSummary } from "../components/patient-info-dialog";
import { ScorePanel } from "../components/score-panel";
import { EEGCard1, EEGCard2, EEGCard3, EEGCard4 } from "../components/eeg-panel";
import { NIRSCard1, NIRSCard2 } from "../components/nirs-panel";
import { CBFCard1, CBFCard2 } from "../components/cbf-panel";

function PatientBadge({ summary }: { summary: PatientSummary }) {
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

export default function Home() {
  const [patient, setPatient] = useState<PatientSummary | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [rbpData, setRbpData] = useState<Record<string, number[]>>({});

  // 1. 创建统一的数据缓冲区，使用 useMemo 确保引用在 Home 重绘时不改变
  const dataBuffer = useMemo(() => new Map<string, any[]>(), []);

  // 2. 数据请求与分发逻辑
  useEffect(() => {
    // 只有在运行状态下才开启请求
    if (!isRunning) {
      return;
    }

    // 初始化/清空所有通道的缓冲区
    const channels = ["eeg", "rSO2-1", "rSO2-2", "one-1", "two-1"];
    channels.forEach(key => dataBuffer.set(key, []));

    console.log("Starting data stream...");
    const es = new EventSource("/api/monitor");

    es.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        // console.log('data', data);

        // 分发 EEG 数据
        if (data.eeg) {
          // 遍历 eeg 对象中的每一个 key (如 EEGData_F3_Ref, EEGData_F4_Ref 等)
          Object.entries(data.eeg).forEach(([key, value]) => {
            // 如果这个 key 的 buffer 不存在，先创建
            if (!dataBuffer.has(key)) {
              dataBuffer.set(key, []);
            }
            // 将属于该通道的数值 push 进它自己的 buffer
            dataBuffer.get(key)?.push(value);
          });
        }

        // 分发 NIRS 数据 (来自 yldl 字段)
        if (data.yldl) {
          if (data.yldl["rSO2-1"] !== undefined) dataBuffer.get("rSO2-1")?.push(data.yldl["rSO2-1"]);
          if (data.yldl["rSO2-2"] !== undefined) dataBuffer.get("rSO2-2")?.push(data.yldl["rSO2-2"]);
        }

        // 分发 CBF 数据 (来自 dlk 字段)
        if (data.dlk) {
          dataBuffer.get("one-1")?.push(data.dlk);
          dataBuffer.get("two-1")?.push(data.dlk);
        }
      } catch (err) {
        console.error("Failed to parse SSE data:", err);
      }
    };

    es.onerror = (err) => {
      console.error("EventSource failed:", err);
      es.close();
    };

    // 组件卸载或停止运行时关闭连接
    return () => {
      console.log("Closing data stream...");
      es.close();
    };
  }, [isRunning, dataBuffer]);

  // 3. RBP 数据请求
  useEffect(() => {
    if (!isRunning) {
      // 停止采集时不清空数据，保留最后一次的 RBP 饼图
      return;
    }

    const fetchRBP = async () => {
      try {
        const res = await fetch("/api/rbp");
        const json = await res.json();
        if (json.data) {
          // RBPData_xx_Ref -> EEGData_xx_Ref 映射
          const mapping: Record<string, string> = {
            "RBPData_F3_Ref": "EEGData_F3_Ref",
            "RBPData_P3_Ref": "EEGData_P3_Ref",
            "RBPData_F4_Ref": "EEGData_F4_Ref",
            "RBPData_P4_Ref": "EEGData_P4_Ref",
          };

          const mappedData: Record<string, number[]> = {};
          Object.entries(mapping).forEach(([rbpKey, eegKey]) => {
            if (json.data[rbpKey]) {
              mappedData[eegKey] = json.data[rbpKey].slice(0, 4);
            }
          });
          setRbpData(mappedData);
        }
      } catch (err) {
        console.error("Failed to fetch RBP data:", err);
      }
    };

    fetchRBP();
    const interval = setInterval(fetchRBP, 15000);

    return () => clearInterval(interval);
  }, [isRunning]);

  const handleStart = () => setIsRunning(true);
  const handleStop = () => setIsRunning(false);

  return (
    <div className="flex h-full w-full flex-col bg-dashboard-bg">
      {/* 顶部 Header */}
      <header className="flex items-center justify-between border-b border-dashboard-border px-8 py-4">
        <div className="flex items-center gap-4">
          {patient && (
            <>
              <PatientBadge summary={patient} />
              <ScorePanel isRunning={isRunning} />
            </>
          )}
          {!patient && (
            <h1 className="text-xl font-semibold text-dashboard-text">多模态可视化系统</h1>
          )}
        </div>
        <div className="flex items-center gap-4">
          {patient && (
            <div className="flex gap-2">
              {!isRunning ? (
                <button
                  onClick={handleStart}
                  className="flex items-center gap-2 rounded-md bg-green-600 px-6 py-2 text-white hover:bg-green-700 transition-colors"
                >
                  <Play className="h-4 w-4" />
                  开始采集
                </button>
              ) : (
                <button
                  onClick={handleStop}
                  className="flex items-center gap-2 rounded-md bg-red-600 px-6 py-2 text-white hover:bg-red-700 transition-colors"
                >
                  <Square className="h-4 w-4" />
                  停止采集
                </button>
              )}
            </div>
          )}
          {!patient && <PatientInfoDialog onCompleted={setPatient} />}
        </div>
      </header>

      {/* 主体区域：数据可视化面板 */}
      <main className="flex flex-1 flex-col overflow-hidden">
        <section className="flex-1 flex flex-col p-2 gap-2">

          {/* 脑电 EEG - 占上方大部分空间 */}
          <div className="flex-[1.7] grid grid-cols-2 gap-2">
            <EEGCard1 isRunning={isRunning} dataBuffer={dataBuffer} rbpData={rbpData} />
            <EEGCard2 isRunning={isRunning} dataBuffer={dataBuffer} rbpData={rbpData} />
            <EEGCard3 isRunning={isRunning} dataBuffer={dataBuffer} rbpData={rbpData} />
            <EEGCard4 isRunning={isRunning} dataBuffer={dataBuffer} rbpData={rbpData} />
          </div> 

          {/* 脑血流 CBF */}
          <div className="flex-1 grid grid-cols-2 gap-2">
            <CBFCard1 isRunning={isRunning} dataBuffer={dataBuffer} />
            <CBFCard2 isRunning={isRunning} dataBuffer={dataBuffer} />
          </div>

          {/* 脑氧 NIRS */}
          <div className="flex-[0.8] grid grid-cols-2 gap-2">
            <NIRSCard1 isRunning={isRunning} dataBuffer={dataBuffer} />
            <NIRSCard2 isRunning={isRunning} dataBuffer={dataBuffer} />
          </div>

        </section>
      </main>
    </div>
  );
}