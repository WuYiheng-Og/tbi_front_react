"use client";

import { Brain, Clock, Play, RefreshCw, Square } from "lucide-react";

interface ControlPanelProps {
  isRunning: boolean;
  hasReceivedData: boolean;
  elapsedTime: number;
  onStart: () => void;
  onStop: () => void;
  onPredict?: () => void;
}

function formatTime(seconds: number) {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  if (hrs > 0) {
    return `${hrs.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

export function ControlPanel({
  isRunning,
  hasReceivedData,
  elapsedTime,
  onStart,
  onStop,
  onPredict,
}: ControlPanelProps) {
  return (
    <div className="flex flex-col gap-2 item-center ml-4">
      <div
        className={`flex items-center gap-2 px-1 py-2 rounded-full border min-w-[140px] ${
          isRunning
            ? "bg-slate-700/80 border-slate-600"
            : "bg-red-500/20 border-red-500/50"
        }`}
      >
        <div
          className={`w-2 h-2 rounded-full ${
            isRunning ? "bg-green-500 animate-pulse" : "bg-red-500"
          }`}
        />
        <Clock
          className={`w-4 h-4 ${isRunning ? "text-slate-300" : "text-red-400"}`}
        />
        <span
          className={`text-sm font-medium ${
            isRunning ? "text-white" : "text-red-200"
          }`}
        >
          {isRunning ? "采集中 " : "已停止 "}
          {formatTime(elapsedTime)}
        </span>
      </div>
      <div className="flex gap-2 min-w-[140px]">
        {!isRunning && hasReceivedData ? (
          <div className="flex flex-col gap-2">
            <button
              onClick={onPredict}
              className="flex items-center ml-4 rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 transition-colors"
            >
              <Brain className="h-4 w-4" />
              点击预测
            </button>
            <button
              onClick={() => {
                if (window.confirm("确定要重新开始监测吗？")) {
                  window.location.reload();
                }
              }}
              className="flex items-center ml-4 rounded-md bg-[#ff7f27] px-4 py-2 text-white hover:bg-[#f49b60] transition-colors"
            >
              <RefreshCw className="h-4 w-4" />
              重新监测
            </button>
          </div>
        ) : !isRunning ? (
          <button
            onClick={onStart}
            className="flex items-center ml-4 rounded-md bg-green-600 px-4 py-2 text-white hover:bg-green-700 transition-colors"
          >
            <Play className="h-4 w-4" />
            开始采集
          </button>
        ) : (
          <button
            onClick={onStop}
            className="flex items-center ml-4 rounded-md bg-red-600 px-4 py-2 text-white hover:bg-red-700 transition-colors"
          >
            <Square className="h-4 w-4" />
            停止采集
          </button>
        )}
      </div>
    </div>
  );
}
