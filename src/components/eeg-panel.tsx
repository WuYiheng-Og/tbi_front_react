"use client";

import { useEffect, useRef } from "react";

// --- 样式与坐标常量 ---
const PLOT_BG = "#082a35";
const GRID_DASHED = "grey";
const GRID_MAJOR = "#e47945";
const AXIS_TEXT = "#7a919d";
const LINE_COLOR = "#99dbcf";
const LINE_COLOR_OLD = "#4a5a68";

const Y_MIN = -100;
const Y_MAX = 100;
const TOTAL_SECONDS = 15;
const MS_PER_CYCLE = TOTAL_SECONDS * 1000;
const MS_PER_MINOR = 200;
const MINORS_PER_MAJOR = 10;

const MARGIN = { top: 10, bottom: 10, left: 100, right: 0 };
const DASHBOARD = { width: 180, height: 200, left: 0, top: -10 };
const SVG_WIDTH = 1124;
const SVG_HEIGHT = 200;

const minorVertCount = (TOTAL_SECONDS * 1000) / MS_PER_MINOR;

const RBP_COLORS: Record<string, string> = {
  δ: "#3176b7",
  θ: "#f78000",
  α: "#3fa116",
  β: "#ce2820",
};

// --- 原子组件 ---
interface EEGPanelCellProps {
  channelLabel: string;
  channelKey: string;
  dataBuffer: Map<string, any[]>;
  isRunning: boolean;
}

function EEGPanelCell({
  channelLabel,
  channelKey,
  dataBuffer,
  isRunning,
}: EEGPanelCellProps) {
  const newPathRef = useRef<SVGPathElement>(null);
  const oldPathRef = useRef<SVGPathElement>(null);
  
  // 运行状态 Ref
  const isRunningRef = useRef(isRunning);
  isRunningRef.current = isRunning;

  const cycleDataRef = useRef({
    currentCyclePoints: [] as { elapsed: number; y: number }[],
    prevCyclePoints: [] as { elapsed: number; y: number }[],
    cycleStartTime: performance.now(),
  });

  const chartWidth = SVG_WIDTH - MARGIN.left - MARGIN.right - DASHBOARD.width - DASHBOARD.left;
  const chartHeight = SVG_HEIGHT - MARGIN.top - MARGIN.bottom;

  const chartY = (y: number) => {
    const t = (y - Y_MIN) / (Y_MAX - Y_MIN);
    return (1 - t) * chartHeight;
  };

  const xToSvg = (ms: number) => {
    const t = ms / MS_PER_CYCLE;
    return t * chartWidth;
  };

  useEffect(() => {
    if (!isRunning) return;
  
    const cycleData = cycleDataRef.current;
    // 每次启动重置时间戳，防止波形跳变
    cycleData.cycleStartTime = performance.now();
    
    let requestID: number;
  
    const animate = () => {
      // 1. 获取属于本通道的特定 Buffer
      const buffer = dataBuffer.get(channelKey);
      
      if (buffer && buffer.length > 0) {
        // 拷贝并清空，防止抢占
        const values = [...buffer];
        dataBuffer.set(channelKey, []); 
  
        for (const value of values) {
          const pointNow = performance.now();
          let elapsed = pointNow - cycleData.cycleStartTime;
  
          // 2. 坐标映射计算 (EEG 数值通常在 -100 到 100)
          const centerY = chartHeight / 2;
          // 缩放系数：根据 EEG 特点，如果波形太小，可以把 100 改小（如 50）来放大波形
          const normalizedValue = Math.max(-1, Math.min(1, value / 100));
          const y = centerY - (normalizedValue * centerY * 0.8);
  
          // 3. 周期复位逻辑
          if (elapsed >= MS_PER_CYCLE) {
            cycleData.prevCyclePoints = cycleData.currentCyclePoints;
            cycleData.currentCyclePoints = [];
            cycleData.cycleStartTime = pointNow;
            elapsed = 0;
          }
          
          cycleData.currentCyclePoints.push({ elapsed, y });
        }
      }
  
      // 4. 绘图逻辑 (确保 Path 元素存在)
      const now = performance.now();
      const currentElapsed = now - cycleData.cycleStartTime;
  
      // 绘制旧路径 (灰色)
      if (oldPathRef.current && cycleData.prevCyclePoints.length >= 2) {
        const visiblePrev = cycleData.prevCyclePoints.filter(p => p.elapsed >= currentElapsed);
        if (visiblePrev.length >= 2) {
          const d = visiblePrev.map((p, i) => {
            const x = xToSvg(p.elapsed);
            return `${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${p.y.toFixed(1)}`;
          }).join(" ");
          oldPathRef.current.setAttribute("d", d);
        } else {
          oldPathRef.current.setAttribute("d", "");
        }
      }
  
      // 绘制新路径 (亮色)
      if (newPathRef.current && cycleData.currentCyclePoints.length >= 2) {
        const d = cycleData.currentCyclePoints.map((p, i) => {
          const x = xToSvg(p.elapsed);
          return `${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${p.y.toFixed(1)}`;
        }).join(" ");
        newPathRef.current.setAttribute("d", d);
      }
  
      requestID = requestAnimationFrame(animate);
    };
  
    requestID = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(requestID);
  }, [isRunning, channelKey, dataBuffer, chartWidth, chartHeight]);

  const legendWidth = DASHBOARD.width;
  const itemWidth = legendWidth / 2;
  const itemHeight = 100 / 4;

  const rbpItems = [
    { name: "δ", value: "0.0" },
    { name: "θ", value: "0.0" },
    { name: "α", value: "0.0" },
    { name: "β", value: "0.0" },
  ];

  return (
    <div className="relative h-full w-full border-r border-b border-dashboard-border" style={{ background: PLOT_BG }}>
      <svg className="h-full w-full" viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`} preserveAspectRatio="none">
        {/* 绘图区域 */}
        <g transform={`translate(${MARGIN.left}, ${MARGIN.top})`}>
          {/* 水平网格线 */}
          {[100, 60, 20, -20, -60, -100].map((y) => {
            const cy = chartY(y);
            return (
              <line key={y} x1={0} y1={cy} x2={chartWidth} y2={cy} stroke={GRID_DASHED} strokeDasharray="5,2" strokeWidth={0.5} />
            );
          })}

          {/* 垂直网格线 */}
          {Array.from({ length: minorVertCount + 1 }, (_, i) => {
            const ms = i * MS_PER_MINOR;
            const x = xToSvg(ms);
            const isMajor = i % MINORS_PER_MAJOR === 0;
            return (
              <line key={i} x1={x} y1={0} x2={x} y2={chartHeight} stroke={isMajor ? GRID_MAJOR : GRID_DASHED} strokeWidth={isMajor ? 1 : 0.5} strokeDasharray={isMajor ? "0" : "5,2"} />
            );
          })}

          {/* Y 轴刻度 */}
          {[100, 0, -100].map((y) => (
            <text key={y} x={-10} y={chartY(y)} textAnchor="end" dominantBaseline="middle" fill={AXIS_TEXT} fontSize="12" fontFamily="monospace">{y}</text>
          ))}

          {/* 通道标签 */}
          <text x={-MARGIN.left / 2 - 10} y={chartHeight / 2} textAnchor="middle" fill={AXIS_TEXT} fontSize="14" fontWeight="bold">{channelLabel}</text>

          {/* 波形路径 */}
          <path ref={oldPathRef} fill="none" stroke={LINE_COLOR_OLD} strokeWidth={1.2} />
          <path ref={newPathRef} fill="none" stroke={LINE_COLOR} strokeWidth={1.5} />
        </g>

        {/* 右侧 Dashboard */}
        <g transform={`translate(${MARGIN.left + chartWidth + DASHBOARD.left},0)`}>
          <rect x={0} y={0} width={DASHBOARD.width} height={DASHBOARD.height} fill="none" stroke="#7a919d" strokeWidth="0.5" />
          {rbpItems.map((item, i) => {
            const row = Math.floor(i / 2);
            const col = i % 2;
            const x = col * itemWidth + 15;
            const y = row * itemHeight + 25;
            return (
              <text key={item.name} x={x} y={y} fill={RBP_COLORS[item.name]} fontSize="14" fontFamily="monospace">
                {item.name}: {item.value}%
              </text>
            );
          })}
        </g>
      </svg>
    </div>
  );
}

// --- 外部导出接口 ---

interface EEGCardProps {
  isRunning: boolean;
  dataBuffer: Map<string, any[]>;
}

export function EEGCard1({ isRunning, dataBuffer }: EEGCardProps) {
  return <EEGPanelCell channelLabel="F3-参考" channelKey="EEGData_F3_Ref" dataBuffer={dataBuffer} isRunning={isRunning} />;
}

export function EEGCard2({ isRunning, dataBuffer }: EEGCardProps) {
  return <EEGPanelCell channelLabel="F4-参考" channelKey="EEGData_F4_Ref" dataBuffer={dataBuffer} isRunning={isRunning} />;
}

export function EEGCard3({ isRunning, dataBuffer }: EEGCardProps) {
  return <EEGPanelCell channelLabel="P3-参考" channelKey="EEGData_P3_Ref" dataBuffer={dataBuffer} isRunning={isRunning} />;
}

export function EEGCard4({ isRunning, dataBuffer }: EEGCardProps) {
  return <EEGPanelCell channelLabel="P4-参考" channelKey="EEGData_P4_Ref" dataBuffer={dataBuffer} isRunning={isRunning} />;
}