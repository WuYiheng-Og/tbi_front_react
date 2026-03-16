"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import { AlertCard } from "./alert-card";
import { TotalScoreCard } from "./total-score-card";
import { useEarlyWarningFetcher, Scores } from "@/hooks/use-early-warning-fetcher";

interface ScorePanelProps {
  isRunning: boolean;
  onDataReceived?: () => void;
  recordId?: string;
  alertWeights?: {
    ngl: string;
    dlk: string;
    yldl: string;
  };
}

export function ScorePanel({ isRunning, onDataReceived, recordId, alertWeights }: ScorePanelProps) {
  const params = useMemo(() => {
    if (!recordId) return undefined;
    return {
      uuid: recordId,
      EEGWeight: alertWeights ? parseInt(alertWeights.ngl) : 5,
      CBFWeight: alertWeights ? parseInt(alertWeights.dlk) : 3,
      BOWeight: alertWeights ? parseInt(alertWeights.yldl) : 2,
    };
  }, [recordId, alertWeights]);

  const { scores, hasFirstData, setOnDataReceived } = useEarlyWarningFetcher(isRunning, params);
  const [internalHasFirstData, setInternalHasFirstData] = useState(false);

  useEffect(() => {
    setOnDataReceived(() => {
      setInternalHasFirstData(true);
      onDataReceived?.();
    });
  }, [setOnDataReceived, onDataReceived]);

  const displayHasFirstData = internalHasFirstData || hasFirstData;

  const prevScoresRef = useRef<Scores>({
    ngl: 0,
    dlk: 0,
    yldl: 0,
    total_score_new: 0,
    time: undefined,
    deep_learning_num1: 0,
    deep_learning_num0: 0,
    xgb_num1: 0,
    xgb_num0: 0,
  });

  const getTrend = (current: number, previous: number) => {
    const diff = current - previous;
    return Number(diff.toFixed(1));
  };

  useEffect(() => {
    if (isRunning && scores.time !== prevScoresRef.current.time) {
      prevScoresRef.current = { ...scores };
    }
  }, [scores, isRunning]);

  return (
    <div className="flex items-center gap-4 flex-1">
      {/* 总分卡片 */}
        <TotalScoreCard currentScore={scores.total_score_new} dataTime={scores.time} />

      {/* 脑电评分 */}
      <AlertCard
        title="脑电评分"
        value={scores.ngl}
        trend={getTrend(scores.ngl, prevScoresRef.current.ngl)}
        className="alert-card-eeg"
      />

      {/* 脑血流评分 */}
      <AlertCard
        title="脑血流评分"
        value={scores.dlk}
        trend={getTrend(scores.dlk, prevScoresRef.current.dlk)}
        className="alert-card-dlk"
      />

      {/* 脑氧评分 */}
      <AlertCard
        title="脑氧评分"
        value={scores.yldl}
        trend={getTrend(scores.yldl, prevScoresRef.current.yldl)}
        className="alert-card-yldl"
      />
    </div>
  );
}
