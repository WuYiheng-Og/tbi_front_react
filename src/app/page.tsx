"use client";

import { useState, useEffect, useCallback } from "react";
import { PatientInfoDialog, type PatientSummary } from "../components/patient-info-dialog";
import { ScorePanel } from "../components/score-panel";
import { EEGCard1, EEGCard2, EEGCard3, EEGCard4 } from "../components/eeg-panel";
import { NIRSCard1, NIRSCard2 } from "../components/nirs-panel";
import { CBFCard1, CBFCard2 } from "../components/cbf-panel";
import { PatientBadge } from "../components/patient-badge";
import { ControlPanel } from "../components/control-panel";
import { PredictionDialog } from "../components/prediction-dialog";
import { StopResultDialog } from "../components/stop-result-dialog";
import { useDataBuffer } from "../hooks/use-data-buffer";
import { useDataStream } from "../hooks/use-data-stream";
import { useRBPFetcher } from "../hooks/use-rbp-fetcher";

export default function Home() {
  const [patient, setPatient] = useState<PatientSummary | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [hasReceivedData, setHasReceivedData] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [predictionOpen, setPredictionOpen] = useState(false);
  const [patientUuid, setPatientUuid] = useState("mock-patient-uuid-12345");
  const [recordId, setRecordId] = useState<string>("");
  const [isStarting, setIsStarting] = useState(false);
  const [stopResultOpen, setStopResultOpen] = useState(false);
  const [stopResult, setStopResult] = useState<{ state: 0 | 1; message: string } | null>(null);

  const dataBuffer = useDataBuffer();
  const rbpData = useRBPFetcher(isRunning, recordId || undefined);
  
  const handleDataReceived = useCallback((isFirstData: boolean) => {
    if (isFirstData) {
      setElapsedTime(0);
    }
    setHasReceivedData(true);
  }, []);
  
  useDataStream(isRunning, dataBuffer, handleDataReceived, recordId || undefined, 1);

  // 当 recordId 准备好且正在启动时，设置 isRunning
  useEffect(() => {
    if (isStarting && recordId) {
      setIsRunning(true);
      setHasReceivedData(false);
      setElapsedTime(0);
      setIsStarting(false);
    }
  }, [recordId, isStarting]);

  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null;

    if (isRunning && hasReceivedData) {
      intervalId = setInterval(() => {
        setElapsedTime((prev) => prev + 1);
      }, 1000);
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [isRunning, hasReceivedData]);

  const handleStart = async () => {
    if (!patient?.patientId) {
      console.error("No patientId available");
      return;
    }

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          NicoletMode: patient.nglMode || "4",
          DelicaMode: patient.dlkMode || "1",
          GloryMode: patient.yldlMode || "1",
          id: patient.patientId,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to start collection");
      }

      const newRecordId = await response.text();
      console.log("Started collection, recordId:", newRecordId);

      // 先设置 recordId，然后通过 useEffect 设置 isRunning
      setRecordId(newRecordId);
      setPatientUuid(newRecordId);
      setIsStarting(true);
    } catch (error) {
      console.error("Failed to start collection:", error);
    }
  };

  const handleStop = async () => {
    if (!recordId) {
      setIsRunning(false);
      return;
    }

    // 显示加载状态
    setStopResult(null);
    setStopResultOpen(true);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/stop`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ record_id: recordId }),
      });

      const result = await response.json();
      console.log("Stop result:", result);

      // 显示结果
      setStopResult({ state: result.state, message: result.msg });
    } catch (error) {
      console.error("Failed to stop collection:", error);
      setStopResult({ state: 0, message: "网络请求失败" });
    } finally {
      setIsRunning(false);
      setRecordId("");
    }
  };

  const handleStopResultClose = () => {
    setStopResultOpen(false);
    setStopResult(null);
  };

  const handleStopResultReload = () => {
    setStopResultOpen(false);
    setStopResult(null);
    // 刷新页面重新开始
    window.location.reload();
  };

  const handlePredict = () => {
    setPredictionOpen(true);
  };

  return (
    <div className="flex h-full w-full flex-col bg-dashboard-bg">
      <header className="flex items-center justify-between border-b border-dashboard-border px-2 py-2">
        <div className="flex items-center gap-4 flex-1">
          {patient && (
            <>
              <PatientBadge summary={patient} />
              <ScorePanel 
                isRunning={isRunning} 
                onDataReceived={() => handleDataReceived(false)} 
                recordId={recordId}
                alertWeights={patient.alertWeights}
              />
            </>
          )}
          {!patient && (
            <h1 className="text-xl font-semibold text-dashboard-text">多模态可视化系统</h1>
          )}
        </div>
        <div className="flex items-center justify-center gap-4">
          {patient && (
            <ControlPanel
              isRunning={isRunning}
              hasReceivedData={hasReceivedData}
              elapsedTime={elapsedTime}
              onStart={handleStart}
              onStop={handleStop}
              onPredict={handlePredict}
            />
          )}
          {!patient && <PatientInfoDialog onCompleted={setPatient} />}
        </div>
      </header>

      <main className="flex flex-1 flex-col overflow-hidden">
        <section className="flex-1 flex flex-col p-2 gap-2">
          <div className="flex-[1.7] grid grid-cols-2 gap-2">
            <EEGCard1 isRunning={isRunning} dataBuffer={dataBuffer} rbpData={rbpData} />
            <EEGCard2 isRunning={isRunning} dataBuffer={dataBuffer} rbpData={rbpData} />
            <EEGCard3 isRunning={isRunning} dataBuffer={dataBuffer} rbpData={rbpData} />
            <EEGCard4 isRunning={isRunning} dataBuffer={dataBuffer} rbpData={rbpData} />
          </div>

          <div className="flex-1 grid grid-cols-2 gap-2">
            <CBFCard1 isRunning={isRunning} dataBuffer={dataBuffer} />
            <CBFCard2 isRunning={isRunning} dataBuffer={dataBuffer} />
          </div>

          <div className="flex-[0.8] grid grid-cols-2 gap-2">
            <NIRSCard1 isRunning={isRunning} dataBuffer={dataBuffer} />
            <NIRSCard2 isRunning={isRunning} dataBuffer={dataBuffer} />
          </div>
        </section>
      </main>

      <PredictionDialog
        uuid={patientUuid}
        open={predictionOpen}
        onOpenChange={setPredictionOpen}
      />

      <StopResultDialog
        open={stopResultOpen}
        state={stopResult?.state ?? null}
        message={stopResult?.message ?? ""}
        onClose={handleStopResultClose}
        onReload={handleStopResultReload}
      />
    </div>
  );
}
