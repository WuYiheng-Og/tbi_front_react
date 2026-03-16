"use client";

import { useState, useEffect } from "react";
import { X, Check, XCircle, Loader2 } from "lucide-react";

type PostOpStatus = "清醒" | "昏迷" | "死亡";

interface PredictionResult {
  day14: PostOpStatus;
  day30: PostOpStatus;
  day90: PostOpStatus;
}

interface FeedbackItem {
  index: 0 | 1 | 2;
  timePoint: string;
  original: PostOpStatus;
  approved: boolean | null;
  corrected: PostOpStatus | null;
}

interface ClinicalInfo {
  anesthesia: "yes" | "no" | null;
  complicationLevel: 1 | 2 | 3 | null;
}

type PredictionDialogProps = {
  uuid: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function PredictionDialog({ uuid, open, onOpenChange }: PredictionDialogProps) {
  const [step, setStep] = useState<"loading" | "result">("loading");
  const [progress, setProgress] = useState(0);
  const [predictionResult, setPredictionResult] = useState<PredictionResult>({
    day14: "清醒",
    day30: "清醒",
    day90: "昏迷",
  });

  const [feedback, setFeedback] = useState<FeedbackItem[]>([
    { index: 0, timePoint: "14天", original: "清醒", approved: null, corrected: null },
    { index: 1, timePoint: "30天", original: "清醒", approved: null, corrected: null },
    { index: 2, timePoint: "90天", original: "昏迷", approved: null, corrected: null },
  ]);

  const [clinicalInfo, setClinicalInfo] = useState<ClinicalInfo>({
    anesthesia: null,
    complicationLevel: null,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [apiStartTime, setApiStartTime] = useState<number | null>(null);

  useEffect(() => {
    if (open) {
      setStep("loading");
      setProgress(0);
      setIsSubmitting(false);
      setSubmitSuccess(false);
      setFeedback([
        { index: 0, timePoint: "14天", original: "清醒", approved: null, corrected: null },
        { index: 1, timePoint: "30天", original: "清醒", approved: null, corrected: null },
        { index: 2, timePoint: "90天", original: "昏迷", approved: null, corrected: null },
      ]);
      setClinicalInfo({ anesthesia: null, complicationLevel: null });
    }
  }, [open]);

  useEffect(() => {
    if (!open || step !== "loading") return;

    setApiStartTime(Date.now());

    // 先启动一个简单的进度条动画
    const duration = 15000;
    const interval = 50;
    const steps = duration / interval;
    let currentStep = 0;

    const timer = setInterval(async () => {
      currentStep++;
      setProgress((currentStep / steps) * 100);

      if (currentStep >= steps) {
        clearInterval(timer);
      }
    }, interval);

    return () => clearInterval(timer);
  }, [open, step]);

  // 单独的效果来触发 API 调用
  useEffect(() => {
    if (!open || step !== "loading" || apiStartTime === null) return;

    const fetchPrediction = async () => {
      await predictAPI(uuid);
      // API 返回后，根据实际耗时更新进度条
      const actualDuration = Date.now() - apiStartTime;
      const actualProgress = Math.min((actualDuration / 15000) * 100, 100);
      setProgress(actualProgress);

      // 短暂延迟后切换到结果页面，让用户看到100%
      setTimeout(() => {
        setStep("result");
      }, 1000);
    };

    fetchPrediction();
  }, [open, apiStartTime]);

  // 预测 API
  const predictAPI = async (patientUuid: string): Promise<void> => {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/prediction`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ uuid: patientUuid }),
    });
    const mockResponse = await response.json();

    // 更新预测结果
    setPredictionResult({
      day14: mockResponse.data[0] as PostOpStatus,
      day30: mockResponse.data[1] as PostOpStatus,
      day90: mockResponse.data[2] as PostOpStatus,
    });

    // 重置反馈数据
    setFeedback([
      { index: 0, timePoint: "14天", original: mockResponse.data[0] as PostOpStatus, approved: null, corrected: null },
      { index: 1, timePoint: "30天", original: mockResponse.data[1] as PostOpStatus, approved: null, corrected: null },
      { index: 2, timePoint: "90天", original: mockResponse.data[2] as PostOpStatus, approved: null, corrected: null },
    ]);
  };

  const handleApproval = (index: number, approved: boolean) => {
    setFeedback((prev) =>
      prev.map((item) =>
        item.index === index
          ? {
              ...item,
              approved,
              corrected: approved ? null : item.original,
            }
          : item
      )
    );
  };

  const handleCorrection = (index: number, corrected: PostOpStatus) => {
    setFeedback((prev) =>
      prev.map((item) =>
        item.index === index ? { ...item, corrected } : item
      )
    );
  };

  const handleSubmit = async () => {
    // 验证所有反馈选项都已选择
    const unapprovedItems = feedback.filter((item) => item.approved === null);
    if (unapprovedItems.length > 0) {
      setValidationError("请对所有时间点的预测结果进行反馈（认同或不认同）");
      return;
    }

    // 验证不认同的选项必须选择正确状态
    const unapprovedWithNoCorrection = feedback.filter(
      (item) => item.approved === false && item.corrected === null
    );
    if (unapprovedWithNoCorrection.length > 0) {
      setValidationError("请为不认同的预测选择正确的状态");
      return;
    }

    // 验证临床信息
    if (clinicalInfo.anesthesia === null) {
      setValidationError("请选择是否使用麻醉药物");
      return;
    }
    if (clinicalInfo.complicationLevel === null) {
      setValidationError("请选择并发症评级");
      return;
    }

    setValidationError(null);

    const allApproved = feedback.every((item) => item.approved === true);
    const feedbackData = feedback.map((item) => item.corrected || item.original);

    const requestBody = {
      uuid,
      approval: allApproved,
      origin: feedback.map((item) => item.original),
      feedback: feedbackData,
      clinicalInfo: {
        anesthesia: clinicalInfo.anesthesia,
        complicationLevel: clinicalInfo.complicationLevel,
      },
    };

    console.log("提交反馈数据:", requestBody);

    // Mock 提交反馈 API
    await submitFeedbackAPI(requestBody);

    setIsSubmitting(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsSubmitting(false);
    setSubmitSuccess(true);
  };

  // 提交反馈 API
  const submitFeedbackAPI = async (data: {
    uuid: string;
    approval: boolean;
    origin: PostOpStatus[];
    feedback: PostOpStatus[];
    clinicalInfo: { anesthesia: "yes" | "no" | null; complicationLevel: 1 | 2 | 3 | null };
  }): Promise<void> => {
    await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/feedback`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
  };

  const handleClose = () => {
    onOpenChange(false);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
      <div className="w-[90vw] max-w-[800px] rounded-lg bg-[#082a35] shadow-xl">
        {/* 头部 */}
        <div className="flex items-center justify-between border-b border-[#2d5058] px-6 py-4">
          <h2 className="text-xl font-bold text-[#fff8e1]">术后状态预测分析</h2>
          <button
            onClick={handleClose}
            className="rounded-full p-1 text-[#fff8e1]/70 hover:bg-[#0d3540] hover:text-[#fff8e1]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* 内容区域 */}
        <div className="px-6 py-5">
          {step === "loading" && (
            <div className="flex flex-col items-center justify-center py-16">
              <Loader2 className="mb-4 h-12 w-12 animate-spin text-[#ff7f27]" />
              <p className="mb-4 text-lg text-[#fff8e1]">正在分析患者数据...</p>
              <div className="w-full max-w-md rounded-full bg-[#0d3540] px-4 py-3">
                <div
                  className="h-3 rounded-full bg-gradient-to-r from-[#ff7f27] to-[#ffb366] transition-all duration-75"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="mt-3 text-sm text-[#fff8e1]/60">
                {Math.round(progress)}% - {(15 - (progress / 100) * 15).toFixed(0)}秒
              </p>
            </div>
          )}

          {step === "result" && !submitSuccess && (
            <div className="space-y-6">
              {/* 预测结果标题 */}
              <div className="text-center">
                <h3 className="text-lg font-medium text-[#fff8e1]">预测结果</h3>
                <p className="mt-1 text-sm text-[#fff8e1]/60">
                  请医生对预测结果进行审核与反馈
                </p>
              </div>

              {/* 预测时间点卡片 */}
              <div className="grid gap-4 md:grid-cols-3">
                {feedback.map((item) => (
                  <div
                    key={item.index}
                    className={`rounded-lg border p-4 transition-colors ${
                      item.approved === true
                        ? "border-green-500/50 bg-green-500/10"
                        : item.approved === false
                        ? "border-orange-500/50 bg-orange-500/10"
                        : "border-[#2d5058] bg-[#0d3540]"
                    }`}
                  >
                    {/* 时间点标题 */}
                    <div className="mb-3 text-center">
                      <span className="text-sm font-medium text-[#fff8e1]">
                        术后 {item.timePoint}
                      </span>
                    </div>

                    {/* 预测状态 */}
                    <div className="mb-4 flex items-center justify-center">
                      <span
                        className={`rounded px-3 py-1 text-sm font-medium ${
                          item.original === "清醒"
                            ? "bg-green-500/20 text-green-400"
                            : item.original === "昏迷"
                            ? "bg-yellow-500/20 text-yellow-400"
                            : "bg-red-500/20 text-red-400"
                        }`}
                      >
                        {item.original}
                      </span>
                    </div>

                    {/* 反馈按钮 */}
                    <div className="space-y-2">
                      <button
                        onClick={() => handleApproval(item.index, true)}
                        className={`flex w-full items-center justify-center gap-1 rounded-md px-3 py-2 text-sm transition-colors ${
                          item.approved === true
                            ? "bg-green-600 text-white"
                            : "bg-[#082a35] text-green-400 hover:bg-green-600/20"
                        }`}
                      >
                        <Check className="h-4 w-4" />
                        认同
                      </button>
                      <button
                        onClick={() => handleApproval(item.index, false)}
                        className={`flex w-full items-center justify-center gap-1 rounded-md px-3 py-2 text-sm transition-colors ${
                          item.approved === false
                            ? "bg-orange-600 text-white"
                            : "bg-[#082a35] text-orange-400 hover:bg-orange-600/20"
                        }`}
                      >
                        <XCircle className="h-4 w-4" />
                        不认同
                      </button>
                    </div>

                    {/* 修正选项 */}
                    {item.approved === false && (
                      <div className="mt-3 space-y-1">
                        <p className="text-xs text-[#fff8e1]/60">选择正确状态:</p>
                        <div className="flex gap-1">
                          {(["清醒", "昏迷", "死亡"] as PostOpStatus[])
                            .filter((status) => status !== item.original)
                            .map((status) => (
                              <button
                                key={status}
                                onClick={() => handleCorrection(item.index, status)}
                                className={`flex-1 rounded px-2 py-1 text-xs transition-colors ${
                                  item.corrected === status
                                    ? status === "清醒"
                                      ? "bg-green-600 text-white"
                                      : status === "昏迷"
                                      ? "bg-yellow-600 text-white"
                                      : "bg-red-600 text-white"
                                    : "bg-[#082a35] text-[#fff8e1] hover:bg-[#2d5058]"
                                }`}
                              >
                                {status}
                              </button>
                            ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* 临床信息补充 */}
              <div className="rounded-lg border border-[#2d5058] bg-[#0d3540] p-4">
                <h4 className="mb-3 text-sm font-medium text-[#fff8e1]">补充临床信息</h4>
                <div className="grid gap-4 md:grid-cols-2">
                  {/* 麻醉药物使用 */}
                  <div>
                    <p className="mb-2 text-xs text-[#fff8e1]/60">是否使用麻醉药物</p>
                    <div className="flex gap-2">
                      <button
                        onClick={() =>
                          setClinicalInfo((prev) => ({ ...prev, anesthesia: "yes" }))
                        }
                        className={`flex-1 rounded-md px-3 py-2 text-sm transition-colors ${
                          clinicalInfo.anesthesia === "yes"
                            ? "bg-[#ff7f27] text-white"
                            : "bg-[#082a35] text-[#fff8e1] hover:bg-[#2d5058]"
                        }`}
                      >
                        是
                      </button>
                      <button
                        onClick={() =>
                          setClinicalInfo((prev) => ({ ...prev, anesthesia: "no" }))
                        }
                        className={`flex-1 rounded-md px-3 py-2 text-sm transition-colors ${
                          clinicalInfo.anesthesia === "no"
                            ? "bg-[#ff7f27] text-white"
                            : "bg-[#082a35] text-[#fff8e1] hover:bg-[#2d5058]"
                        }`}
                      >
                        否
                      </button>
                    </div>
                  </div>

                  {/* 并发症评级 */}
                  <div>
                    <p className="mb-2 text-xs text-[#fff8e1]/60">并发症评级</p>
                    <div className="flex gap-2">
                      {([1, 2, 3] as const).map((level) => (
                        <button
                          key={level}
                          onClick={() =>
                            setClinicalInfo((prev) => ({
                              ...prev,
                              complicationLevel: level,
                            }))
                          }
                          className={`flex-1 rounded-md px-3 py-2 text-sm transition-colors ${
                            clinicalInfo.complicationLevel === level
                              ? "bg-[#ff7f27] text-white"
                              : "bg-[#082a35] text-[#fff8e1] hover:bg-[#2d5058]"
                          }`}
                        >
                          {level}级
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* 提交按钮 */}
              <div className="flex justify-end gap-3 pt-2">
                {validationError && (
                  <div className="flex-1 text-left">
                    <span className="text-sm text-red-400">{validationError}</span>
                  </div>
                )}
                <button
                  onClick={handleClose}
                  className="rounded-full border border-[#2d5058] px-6 py-2 text-sm text-[#fff8e1]/80 hover:bg-[#082a35]"
                >
                  取消
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="flex items-center gap-2 rounded-full bg-[#ff7f27] px-6 py-2 text-sm font-medium text-white hover:bg-[#f49b60] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                  提交反馈
                </button>
              </div>
            </div>
          )}

          {step === "result" && submitSuccess && (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-500/20">
                <Check className="h-8 w-8 text-green-500" />
              </div>
              <h3 className="mb-2 text-xl font-medium text-[#fff8e1]">反馈提交成功</h3>
              <p className="mb-6 text-sm text-[#fff8e1]/60">
                感谢您的反馈，这将帮助模型持续优化
              </p>
              <button
                onClick={handleClose}
                className="rounded-full bg-[#ff7f27] px-8 py-2 text-sm font-medium text-white hover:bg-[#f49b60]"
              >
                关闭
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
