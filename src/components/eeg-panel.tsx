"use client";

import { useEffect, useRef, useState } from "react";

const PLOT_BG = "#082a35";
const GRID_DASHED = "grey";
const GRID_MAJOR = "#e47945";
const AXIS_TEXT = "#7a919d";
const LINE_COLOR = "#99dbcf";
const LINE_COLOR_OLD = "#4a5a68";

const Y_MIN = -100;
const Y_MAX = 100;

const TOTAL_SECONDS = 15;
const MS_PER_MINOR = 200;
const MINORS_PER_MAJOR = 10;
const SECONDS_PER_MAJOR = (MS_PER_MINOR * MINORS_PER_MAJOR) / 1000;

const SAMPLE_RATE = 60;
const TOTAL_POINTS = TOTAL_SECONDS * SAMPLE_RATE;

const MARGIN = { top: 10, bottom: 10, left: 100, right: 0 };
const DASHBOARD = { width: 180, height: 200, left: 0, top: -10 };

const minorVertCount = (TOTAL_SECONDS * 1000) / MS_PER_MINOR;
const majorVertCount = TOTAL_SECONDS / SECONDS_PER_MAJOR;

const RBP_COLORS: Record<string, string> = {
  δ: "#3176b7",
  θ: "#f78000",
  α: "#3fa116",
  β: "#ce2820",
};

const CHANNELS = [
  { key: "EEGData_F3_Ref", label: "F3-参考" },
  { key: "EEGData_F4_Ref", label: "F4-参考" },
  { key: "EEGData_P3_Ref", label: "P3-参考" },
  { key: "EEGData_P4_Ref", label: "P4-参考" },
];

function EEGPanelCell({
  channelLabel,
  channelKey,
  dataBuffer,
}: {
  channelLabel: string;
  channelKey: string;
  dataBuffer: Map<string, number[]>;
}) {
  const svgWidth = 1124;
  const svgHeight = 200;
  const newPathRef = useRef<SVGPathElement>(null);
  const oldPathRef = useRef<SVGPathElement>(null);

  const chartWidth = svgWidth - MARGIN.left - MARGIN.right - DASHBOARD.width - DASHBOARD.left;
  const chartHeight = svgHeight - MARGIN.top - MARGIN.bottom;

  const chartY = (y: number) => {
    const t = (y - Y_MIN) / (Y_MAX - Y_MIN);
    return (1 - t) * chartHeight;
  };

  const xToSvg = (ms: number) => {
    const t = ms / (TOTAL_SECONDS * 1000);
    return MARGIN.left + t * chartWidth;
  };

  const legendWidth = DASHBOARD.width;
  const legendHeight = 100;
  const itemWidth = legendWidth / 2;
  const itemHeight = legendHeight / 4;

  const rbpItems = [
    { name: "δ", value: "0.0" },
    { name: "θ", value: "0.0" },
    { name: "α", value: "0.0" },
    { name: "β", value: "0.0" },
  ];

  useEffect(() => {
    let currentCyclePoints: { elapsed: number; y: number }[] = [];
    let prevCyclePoints: { elapsed: number; y: number }[] = [];
    let cycleStartTime = performance.now();
    const MS_PER_CYCLE = TOTAL_SECONDS * 1000;

    const animate = (timestamp: number) => {
      const buffer = dataBuffer.get(channelKey);
      if (buffer && buffer.length > 0) {
        const values = buffer.slice();
        dataBuffer.set(channelKey, []);

        for (const value of values) {
          const now = performance.now();
          const elapsed = now - cycleStartTime;
          
          const centerY = chartHeight / 2;
          const normalizedValue = Math.max(-1, Math.min(1, value / 100));
          const y = centerY - normalizedValue * centerY * 0.8;

          currentCyclePoints.push({ elapsed, y });

          // 检查是否需要开始新周期
          if (elapsed >= MS_PER_CYCLE) {
            prevCyclePoints = currentCyclePoints;
            currentCyclePoints = [];
            cycleStartTime = now;
          }
        }
      }

      // 计算当前周期已过去的时间
      const now = performance.now();
      const currentElapsed = now - cycleStartTime;
      const eraseElapsed = currentElapsed;

      // 绘制上一周期（灰色）- 只显示超出当前进度的部分
      if (prevCyclePoints.length > 0) {
        const visiblePrevPoints = prevCyclePoints.filter((p) => p.elapsed >= eraseElapsed);
        if (visiblePrevPoints.length >= 2) {
          const d = visiblePrevPoints
            .map((p, i) => {
              const x = (p.elapsed / MS_PER_CYCLE) * chartWidth;
              return `${i === 0 ? "M" : "L"} ${x.toFixed(2)} ${p.y.toFixed(2)}`;
            })
            .join(" ");
          if (oldPathRef.current) {
            oldPathRef.current.setAttribute("d", d);
          }
        } else if (oldPathRef.current) {
          oldPathRef.current.setAttribute("d", "");
        }
      }

      // 绘制当前周期（新数据，亮色）
      if (currentCyclePoints.length >= 2) {
        const d = currentCyclePoints
          .map((p, i) => {
            const x = (p.elapsed / MS_PER_CYCLE) * chartWidth;
            return `${i === 0 ? "M" : "L"} ${x.toFixed(2)} ${p.y.toFixed(2)}`;
          })
          .join(" ");
        if (newPathRef.current) {
          newPathRef.current.setAttribute("d", d);
        }
      }

      requestAnimationFrame(animate);
    };

    const animId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animId);
  }, [channelKey, dataBuffer, chartWidth, chartHeight]);

  return (
    <div
      className="relative h-full w-full border-r border-b border-dashboard-border"
      style={{ background: PLOT_BG }}
    >
      <svg
        className="h-full w-full"
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        preserveAspectRatio="none"
      >
        {/* 绘图区域 */}
        <g transform={`translate(${MARGIN.left}, ${MARGIN.top})`}>
          {/* 水平网格线 */}
          {[100, 80, 60, 40, 20, 0, -20, -40, -60, -80, -100].map((y) => {
            const cy = chartY(y);
            return (
              <line
                key={y}
                x1={0}
                y1={cy}
                x2={chartWidth}
                y2={cy}
                stroke={GRID_DASHED}
                strokeDasharray="5,2"
                strokeWidth={0.5}
              />
            );
          })}

          {/* 垂直网格线 */}
          {Array.from({ length: minorVertCount + 1 }, (_, i) => {
            const ms = i * MS_PER_MINOR;
            const x = xToSvg(ms) - MARGIN.left;
            const isMajor = i % MINORS_PER_MAJOR === 0;
            return (
              <line
                key={i}
                x1={x}
                y1={0}
                x2={x}
                y2={chartHeight}
                stroke={isMajor ? GRID_MAJOR : GRID_DASHED}
                strokeWidth={isMajor ? 1 : 0.5}
                strokeDasharray={isMajor ? "0" : "5,2"}
              />
            );
          })}

          {/* Y 轴刻度标签 */}
          {[100, 80, 60, 40, 20, 0, -20, -40, -60, -80, -100].map((y) => (
            <text
              key={y}
              x={-10}
              y={chartY(y)}
              textAnchor="end"
              dominantBaseline="middle"
              fill={AXIS_TEXT}
              fontSize="12"
              fontFamily="system-ui, sans-serif"
            >
              {y}
            </text>
          ))}

          {/* 通道标签 */}
          <text
            x={-MARGIN.left / 2 - 10}
            y={chartHeight / 2}
            textAnchor="middle"
            fill={AXIS_TEXT}
            fontSize="14"
            fontFamily="system-ui, sans-serif"
          >
            {channelLabel}
          </text>

          {/* EEG 旧数据 - 灰色 */}
          <path
            ref={oldPathRef}
            fill="none"
            stroke={LINE_COLOR_OLD}
            strokeWidth={1.5}
            strokeLinejoin="round"
            strokeLinecap="round"
          />

          {/* EEG 新数据 - 亮色 */}
          <path
            ref={newPathRef}
            fill="none"
            stroke={LINE_COLOR}
            strokeWidth={1.5}
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        </g>

        {/* 右侧 Dashboard 面板 */}
        <g transform={`translate(${MARGIN.left + chartWidth + DASHBOARD.left},0)`}>
          <rect
            x={0}
            y={0}
            width={DASHBOARD.width}
            height={DASHBOARD.height}
            fill="none"
            stroke="grey"
            strokeWidth={3}
          />

          {rbpItems.map((item, i) => {
            const row = Math.floor(i / 2);
            const col = i % 2;
            const x = col * itemWidth + itemWidth / 60;
            const y = row * itemHeight + itemHeight / 4;
            return (
              <text
                key={item.name}
                x={x + 15}
                y={y + 15}
                fill={RBP_COLORS[item.name]}
                fontSize="14"
                fontFamily="system-ui, sans-serif"
              >
                {item.name}: {item.value}%
              </text>
            );
          })}
        </g>
      </svg>
    </div>
  );
}

export function EEGCards() {
  const [dataBuffer] = useState(() => new Map<string, number[]>());
  const esRef = useRef<EventSource | null>(null);

  useEffect(() => {
    const buffer = dataBuffer;

    for (const ch of CHANNELS) {
      buffer.set(ch.key, []);
    }

    const es = new EventSource("/api/eeg");
    esRef.current = es;

    es.onmessage = (e) => {
      try {
        const { eeg } = JSON.parse(e.data);
        for (const ch of CHANNELS) {
          const key = ch.key;
          const arr = buffer.get(key);
          if (arr && eeg[key] !== undefined) {
            arr.push(eeg[key]);
          }
        }
      } catch (err) {
        console.error("Failed to parse EEG data:", err);
      }
    };

    es.onerror = () => {
      console.log("EventSource closed, reconnecting...");
    };

    return () => {
      es.close();
    };
  }, [dataBuffer]);

  return (
    <>
      {CHANNELS.map((ch) => (
        <EEGPanelCell
          key={ch.key}
          channelLabel={ch.label}
          channelKey={ch.key}
          dataBuffer={dataBuffer}
        />
      ))}
    </>
  );
}

export function EEGCard1() {
  return <EEGCards />;
}

export function EEGCard2() {
  return null;
}

export function EEGCard3() {
  return null;
}

export function EEGCard4() {
  return null;
}
