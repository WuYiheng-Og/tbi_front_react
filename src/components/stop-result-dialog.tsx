"use client";

import { XCircle, CheckCircle, Loader2, RefreshCw } from "lucide-react";

interface StopResultDialogProps {
  open: boolean;
  state: 0 | 1 | null;
  message: string;
  onClose: () => void;
  onReload: () => void;
}

export function StopResultDialog({ open, state, message, onClose, onReload }: StopResultDialogProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div className="relative z-10 w-[400px] rounded-2xl border border-dashboard-border bg-[#0d3a4a] p-6 shadow-2xl">
        {state === 0 && (
          <div className="flex flex-col items-center justify-center py-8">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-500/20">
              <XCircle className="h-8 w-8 text-red-500" />
            </div>
            <h3 className="mb-2 text-xl font-medium text-[#fff8e1]">文件处理失败</h3>
            <p className="mb-6 text-sm text-red-400">
              {message}
            </p>
            <div className="flex gap-3">
              <button
                onClick={onReload}
                className="flex items-center gap-2 rounded-full bg-[#ff7f27] px-6 py-2.5 text-sm font-medium text-white hover:bg-[#f49b60] transition-colors"
              >
                <RefreshCw className="h-4 w-4" />
                重新监测
              </button>
              <button
                onClick={onClose}
                className="rounded-full bg-slate-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-slate-500 transition-colors"
              >
                关闭
              </button>
            </div>
          </div>
        )}

        {state === 1 && (
          <div className="flex flex-col items-center justify-center py-8">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-500/20">
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
            <h3 className="mb-2 text-xl font-medium text-[#fff8e1]">数据处理完成</h3>
            <p className="mb-4 text-sm text-green-400">
              {message}
            </p>
            <button
              onClick={onClose}
              className="rounded-full bg-blue-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-blue-500 transition-colors"
            >
              继续
            </button>
          </div>
        )}

        {state === null && (
          <div className="flex flex-col items-center justify-center py-8">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-500/20">
              <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
            </div>
            <h3 className="mb-2 text-xl font-medium text-[#fff8e1]">数据处理中</h3>
            <p className="text-sm text-slate-400">
              正在处理采集数据，请稍候...
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
