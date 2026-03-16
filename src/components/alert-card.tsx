"use client";

import { useEffect, useRef } from "react";
import * as echarts from "echarts";

interface AlertCardProps {
  title: string;
  value: number;
  trend?: number;
  className?: string;
}

export function AlertCard({ title, value, trend = 0, className = "" }: AlertCardProps) {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<echarts.ECharts | null>(null);
  const prevValueRef = useRef<number | null>(null);

  const getStatusInfo = (val: number) => {
    if (val >= 70) return { text: "正常", color: "#4CAF50" };
    if (val >= 60) return { text: "不佳", color: "#FFC107" };
    return { text: "异常", color: "#F44336" };
  };

  const getTrendType = (t: number) => {
    if (t > 0) return "positive";
    if (t < 0) return "negative";
    return "stable";
  };

  const trendType = getTrendType(trend);
  const statusInfo = getStatusInfo(value);

  const formattedTrendValue = () => {
    const prefix = trend > 0 ? "+" : "";
    return `${prefix}${trend.toFixed(1)}`;
  };

  // 当 trend 变化时触发重新渲染
  const trendKey = `${trend}-${value}`;

  useEffect(() => {
    if (!chartRef.current) return;

    chartInstance.current = echarts.init(chartRef.current);

    const option: echarts.EChartsOption = {
      series: [
        {
          type: "gauge",
          min: 0,
          max: 100,
          splitNumber: 10,
          radius: "100%",
          axisLine: {
            lineStyle: {
              width: 12,
              color: [
                [0.6, "#F44336"],
                [0.7, "#FFC107"],
                [1, "#4CAF50"],
              ],
            },
          },
          pointer: {
            itemStyle: {
              color: "auto",
            },
          },
          axisTick: {
            distance: -12,
            length: 4,
            lineStyle: {
              color: "#fff",
              width: 1,
            },
          },
          splitLine: {
            distance: -12,
            length: 10,
            lineStyle: {
              color: "#fff",
              width: 2,
            },
          },
          axisLabel: {
            color: "inherit",
            distance: 16,
            fontSize: 8,
          },
          detail: {
            valueAnimation: true,
            formatter: (val: number | string) => `${Math.round(Number(val))}`,
            color: "inherit",
            fontSize: 20,
            offsetCenter: [0, "70%"],
          },
          data: [{ value }],
        },
      ],
    };

    chartInstance.current.setOption(option);

    const handleResize = () => chartInstance.current?.resize();
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      chartInstance.current?.dispose();
    };
  }, []);

  useEffect(() => {
    if (chartInstance.current) {
      chartInstance.current.setOption({
        series: [{ data: [{ value }] }],
      });
    }
    prevValueRef.current = value;
  }, [value]);

  return (
    <div className={`flex items-center rounded-lg bg-[#0d3540] p-3 shadow-md ${className}`}>
    {/* 左侧：文本信息 */}
    <div className="flex flex-1 flex-col items-center">
      {/* 标题 */}
      <div className="mb-2 text-sm font-bold text-[#2196F3]">{title}</div>

      {/* 趋势指示器 */}
      <div
        key={trendKey}
        className={`mb-1 flex items-center gap-1 rounded-full px-2 py-0.5 text-xs w-fit ${
          trendType === "positive"
            ? "bg-green-100/20 text-green-600"
            : trendType === "negative"
            ? "bg-red-100/20 text-red-600"
            : "bg-gray-100/20 text-gray-500"
        }`}
      >
        <span>{trendType === "positive" ? "↑" : trendType === "negative" ? "↓" : "→"}</span>
        <span>{formattedTrendValue()}</span>
      </div>

      {/* 状态指示器 */}
      <div className="text-xs font-bold" style={{ color: statusInfo.color }}>
        {statusInfo.text}
      </div>
    </div>

    {/* 右侧：仪表盘 */}
    <div ref={chartRef} className="h-28 w-28 flex-shrink-0 ml-3" />
  </div>
  );
}
