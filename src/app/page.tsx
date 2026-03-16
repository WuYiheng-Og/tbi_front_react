"use client";

import { useState, useEffect } from "react";
import { PatientInfoDialog, type PatientSummary } from "../components/patient-info-dialog";
import { ScorePanel } from "../components/score-panel";
import { EEGCard1, EEGCard2, EEGCard3, EEGCard4 } from "../components/eeg-panel";
import { NIRSCard1, NIRSCard2 } from "../components/nirs-panel";
import { CBFCard1, CBFCard2 } from "../components/cbf-panel";
import { PatientBadge } from "../components/patient-badge";
import { ControlPanel } from "../components/control-panel";
import { PredictionDialog } from "../components/prediction-dialog";
import { useDataBuffer } from "../hooks/use-data-buffer";
import { useDataStream } from "../hooks/use-data-stream";
import { useRBPFetcher } from "../hooks/use-rbp-fetcher";

export default function Home() {
  const [patient, setPatient] = useState<PatientSummary | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [hasReceivedData, setHasReceivedData] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [predictionOpen, setPredictionOpen] = useState(false);
  const [patientUuid] = useState("mock-patient-uuid-12345");

  const dataBuffer = useDataBuffer();
  const rbpData = useRBPFetcher(isRunning);
  useDataStream(isRunning, dataBuffer, () => setHasReceivedData(true));

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

  const handleStart = () => {
    setIsRunning(true);
    setHasReceivedData(false);
    setElapsedTime(0);
  };

  const handleStop = () => {
    setIsRunning(false);
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
              <ScorePanel isRunning={isRunning} onDataReceived={() => setHasReceivedData(true)} />
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
    </div>
  );
}
