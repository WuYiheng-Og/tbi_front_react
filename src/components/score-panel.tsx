"use client";

import { useState, useEffect, useRef } from "react";
import { AlertCard } from "./alert-card";
import { TotalScoreCard } from "./total-score-card";

interface Scores {
  ngl: number;
  dlk: number;
  yldl: number;
  total_score_new: number;
  time?: [number, number];
  deep_learning_num1?: number;
  deep_learning_num0?: number;
  xgb_num1?: number;
  xgb_num0?: number;
}

interface ScorePanelProps {
  isRunning: boolean;
  onDataReceived?: () => void;
}

export function ScorePanel({ isRunning, onDataReceived }: ScorePanelProps) {
  const [scores, setScores] = useState<Scores>({
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

  const [hasFirstData, setHasFirstData] = useState(false);

  useEffect(() => {
    if (!isRunning) {
      return;
    }

    let ws: WebSocket | null = null;

    const connectWS = () => {
      ws = new WebSocket("ws://localhost:8081/ws/early_warning");

      ws.onopen = () => {
        console.log("[ScorePanel] WebSocket connected");
      };

      ws.onmessage = (event) => {
        try {
          const json = JSON.parse(event.data);
          console.log('json', json);
          
          if (json.data) {
            if (!hasFirstData) {
              setHasFirstData(true);
              onDataReceived?.();
            }

            if (json.data.hasData) {
              const newScores: Scores = {
                ngl: typeof json.data.ngl === "number" ? json.data.ngl : 0,
                dlk: typeof json.data.dlk === "number" ? json.data.dlk : 0,
                yldl: typeof json.data.yldl === "number" ? json.data.yldl : 0,
                total_score_new: typeof json.data.total_score_new === "number" ? json.data.total_score_new : 0,
                time: json.data.time,
                deep_learning_num1: json.data.deep_learning_num1 ?? 0,
                deep_learning_num0: json.data.deep_learning_num0 ?? 0,
                xgb_num1: json.data.xgb_num1 ?? 0,
                xgb_num0: json.data.xgb_num0 ?? 0,
              };
              setScores(newScores);
            }
          }
        } catch (err) {
          console.error("Failed to parse WebSocket data:", err);
        }
      };

      ws.onerror = () => {
        console.log("[ScorePanel] WebSocket error, reconnecting...");
        setTimeout(connectWS, 5000);
      };

      ws.onclose = () => {
        console.log("[ScorePanel] WebSocket disconnected");
        ws = null;
      };
    };

    connectWS();

    return () => {
      ws?.close();
    };
  }, [isRunning, hasFirstData, onDataReceived]);

  // 计算趋势 = 当前值 - 上一次值
  const getTrend = (current: number, previous: number) => {
    const diff = current - previous;
    return Number(diff.toFixed(1));
  };

  // 更新上一次的值（用于下一次计算趋势）
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
