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
}

export function ScorePanel({ isRunning }: ScorePanelProps) {
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
      // 停止时断开连接
      return;
    }

    let eventSource: EventSource | null = null;

    const connectSSE = () => {
      eventSource = new EventSource("/api/scores");

      eventSource.onmessage = (event) => {
        try {
          const json = JSON.parse(event.data);
          if (json.data && json.data.hasData) {
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
            setHasFirstData(true);
          } else if (json.data && !json.data.hasData) {
            // 首次15s内无数据，标记为已有数据（避免一直请求）
            setHasFirstData(true);
          }
        } catch (err) {
          console.error("Failed to parse SSE data:", err);
        }
      };

      eventSource.onerror = () => {
        eventSource?.close();
        // 重新连接
        setTimeout(connectSSE, 5000);
      };
    };

    connectSSE();

    return () => {
      eventSource?.close();
    };
  }, [isRunning]);

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
