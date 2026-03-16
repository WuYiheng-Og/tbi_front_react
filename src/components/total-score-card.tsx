"use client";

import { useEffect, useRef } from "react";
import * as echarts from "echarts";

interface TotalScoreCardProps {
  currentScore: number;
  dataTime?: [number, number];
}

export function TotalScoreCard({ currentScore, dataTime }: TotalScoreCardProps) {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<echarts.ECharts | null>(null);
  const scoreDataRef = useRef<number[]>([]);
  const lastDataTimeRef = useRef<[number, number] | undefined>(undefined);
  const isFirstAddRef = useRef(true);

  const formattedScore = Math.round(currentScore);

  useEffect(() => {
    if (!chartRef.current) return;

    chartInstance.current = echarts.init(chartRef.current);

    const option: echarts.EChartsOption = {
      grid: {
        top: 10,
        right: 0,
        bottom: 16,
        left: 30,
      },
      xAxis: {
        type: "category",
        data: [],
        axisLine: { show: true },
        axisTick: { show: true },
        axisLabel: {
          show: true,
          fontSize: 10,
        },
      },
      yAxis: {
        type: "value",
        min: 0,
        max: 100,
        axisLine: { show: true },
        axisTick: { show: true },
        splitLine: {
          show: true,
          lineStyle: {
            type: "dashed",
          },
        },
        axisLabel: {
          show: true,
          fontSize: 10,
        },
      },
      series: [
        {
          data: [],
          type: "line",
          smooth: true,
          symbol: "circle",
          symbolSize: 8,
          lineStyle: {
            width: 3,
          },
          itemStyle: {
            color: "#2196F3",
          },
          areaStyle: {
            color: {
              type: "linear",
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                {
                  offset: 0,
                  color: "rgba(33, 150, 243, 0.3)",
                },
                {
                  offset: 1,
                  color: "rgba(33, 150, 243, 0.1)",
                },
              ],
            },
          },
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
    if (!chartInstance.current) return;

    // 首次无数据时不添加数据点
    if (dataTime === undefined) return;

    // 首次添加数据点时，直接添加（不管时间戳是否相同）
    if (isFirstAddRef.current) {
      isFirstAddRef.current = false;
    } else {
      // 如果时间戳没变，说明是同一个数据批次，不添加新数据点
      if (
        lastDataTimeRef.current &&
        dataTime[0] === lastDataTimeRef.current[0] &&
        dataTime[1] === lastDataTimeRef.current[1]
      ) {
        return;
      }
    }

    // 更新上次数据时间
    lastDataTimeRef.current = dataTime;

    // 保持最多显示10个数据点
    if (scoreDataRef.current.length >= 10) {
      scoreDataRef.current.shift();
    }
    scoreDataRef.current.push(currentScore);

    chartInstance.current.setOption({
      xAxis: {
        data: Array.from({ length: scoreDataRef.current.length }, (_, i) => i + 1),
      },
      series: [
        {
          data: scoreDataRef.current,
        },
      ],
    });
  }, [dataTime]);

  return (
    <div className="flex items-center rounded-lg bg-[#0d3540] p-3 shadow-md flex-1">
      {/* 左侧分数显示 */}
      <div className="flex flex-col items-center justify-center pr-4">
        <div className="text-sm font-bold text-[#2196F3]">综合健康评分</div>
        <div className="text-5xl font-bold text-[#2196F3]">{formattedScore}</div>
      </div>

      {/* 右侧图表 */}
      <div ref={chartRef} className="h-24 flex-1 min-w-[200px]" />
    </div>
  );
}
