"use client";

import { useState, useEffect, useRef } from "react";
import { AlertCard } from "./alert-card";

interface Scores {
  ngl: number;
  dlk: number;
  yldl: number;
  total_score_new: number;
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
  });

  const prevScoresRef = useRef<Scores>({
    ngl: 0,
    dlk: 0,
    yldl: 0,
    total_score_new: 0,
  });

  useEffect(() => {
    if (!isRunning) {
      return;
    }

    const fetchScores = async () => {
      try {
        const res = await fetch("/api/scores");
        const json = await res.json();
        if (json.data) {
          const newScores = {
            ngl: json.data.ngl ?? 0,
            dlk: json.data.dlk ?? 0,
            yldl: json.data.yldl ?? 0,
            total_score_new: json.data.total_score_new ?? 0,
          };
          setScores(newScores);
        }
      } catch (err) {
        console.error("Failed to fetch scores:", err);
      }
    };

    fetchScores();
    const interval = setInterval(fetchScores, 2000);

    return () => clearInterval(interval);
  }, [isRunning]);

  // 计算趋势 = 当前值 - 上一次值
  const getTrend = (current: number, previous: number) => {
    const diff = current - previous;
    return Number(diff.toFixed(1));
  };

  // 更新上一次的值（用于下一次计算趋势）
  useEffect(() => {
    if (isRunning) {
      prevScoresRef.current = { ...scores };
    }
  }, [scores, isRunning]);

  return (
    <div className="flex items-center gap-4">
      {/* 总分卡片 */}
      <div className="flex flex-col items-center rounded-lg bg-[#0d3540] px-4 py-2">
        <span className="text-xs text-white/70">总分</span>
        <span className="text-2xl font-bold text-[#ff7f27]">{scores.total_score_new}</span>
      </div>

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
