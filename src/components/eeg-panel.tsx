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

// --- 玫瑰图组件 (南丁格尔玫瑰图) ---
function RoseChart({ data }: { data: number[] }) {
  const outerRadius = 45;
  const innerRadius = 0;
  const colors = ["#3176b7", "#f78000", "#3fa116", "#ce2820"];
  const total = data.reduce((sum, v) => sum + v, 0) || 1;

  let startAngle = -90;
  const slices = data.map((value, i) => {
    const angle = (value / total) * 360;
    const start = startAngle;
    startAngle += angle;
    // 玫瑰图：半径根据比例变化，外圈半径 = (value/total)*100 + base
    const outerR = innerRadius + ((value / total) * 100 + 20);
    return { start, angle, color: colors[i], value, outerR: Math.min(outerR, outerRadius) };
  });

  return (
    <g>
      {slices.map((slice, i) => {
        if (slice.angle === 0) return null;
        const startRad = (slice.start * Math.PI) / 180;
        const endRad = ((slice.start + slice.angle) * Math.PI) / 180;
        const x1 = Math.cos(startRad) * slice.outerR;
        const y1 = Math.sin(startRad) * slice.outerR;
        const x2 = Math.cos(endRad) * slice.outerR;
        const y2 = Math.sin(endRad) * slice.outerR;
        const largeArc = slice.angle > 180 ? 1 : 0;
        const d = `M 0 0 L ${x1.toFixed(1)} ${y1.toFixed(1)} A ${slice.outerR} ${slice.outerR} 0 ${largeArc} 1 ${x2.toFixed(1)} ${y2.toFixed(1)} Z`;
        return <path key={i} d={d} fill={slice.color} stroke="#082a35" strokeWidth={1} />;
      })}
      {/* 中心圆 */}
      <circle cx={0} cy={0} r={8} fill="#082a35" />
      <text x={0} y={3} textAnchor="middle" fill="#fff" fontSize="6" fontWeight="bold">RBP</text>
    </g>
  );
}

// --- 原子组件 ---
interface EEGPanelCellProps {
  channelLabel: string;
  channelKey: string;
  dataBuffer: Map<string, { value: number; timestamp: number }[]>;
  isRunning: boolean;
  rbpData?: Record<string, number[]>;
}

function EEGPanelCell({
  channelLabel,
  channelKey,
  dataBuffer,
  isRunning,
  rbpData = {},
}: EEGPanelCellProps) {
  const newPathRef = useRef<SVGPathElement>(null);
  const oldPathRef = useRef<SVGPathElement>(null);

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
    cycleData.cycleStartTime = performance.now();

    let requestID: number;

    const animate = () => {
      const buffer = dataBuffer.get(channelKey);

      if (buffer && buffer.length > 0) {
        const values = [...buffer];
        dataBuffer.set(channelKey, []);

        for (const item of values) {
          const { value, timestamp } = item;
          const pointNow = timestamp || performance.now();
          let elapsed = pointNow - cycleData.cycleStartTime;

          const centerY = chartHeight / 2;
          const normalizedValue = Math.max(-1, Math.min(1, value / 100));
          const y = centerY - (normalizedValue * centerY * 0.8);

          if (elapsed >= MS_PER_CYCLE) {
            cycleData.prevCyclePoints = cycleData.currentCyclePoints;
            cycleData.currentCyclePoints = [];
            cycleData.cycleStartTime = pointNow;
            elapsed = 0;
          }

          cycleData.currentCyclePoints.push({ elapsed, y });
        }
      }

      const now = performance.now();
      const currentElapsed = now - cycleData.cycleStartTime;

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
    { name: "δ", value: "0.0", color: RBP_COLORS["δ"] },
    { name: "θ", value: "0.0", color: RBP_COLORS["θ"] },
    { name: "α", value: "0.0", color: RBP_COLORS["α"] },
    { name: "β", value: "0.0", color: RBP_COLORS["β"] },
  ];

  const channelRBP = rbpData[channelKey] || [];

  return (
    <div className="relative h-full w-full border-r border-b border-dashboard-border" style={{ background: PLOT_BG }}>
      <svg className="h-full w-full" viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`} preserveAspectRatio="none">
        <g transform={`translate(${MARGIN.left}, ${MARGIN.top})`}>
          {[100, 60, 20, -20, -60, -100].map((y) => {
            const cy = chartY(y);
            return (
              <line key={y} x1={0} y1={cy} x2={chartWidth} y2={cy} stroke={GRID_DASHED} strokeDasharray="5,2" strokeWidth={0.5} />
            );
          })}

          {Array.from({ length: minorVertCount + 1 }, (_, i) => {
            const ms = i * MS_PER_MINOR;
            const x = xToSvg(ms);
            const isMajor = i % MINORS_PER_MAJOR === 0;
            return (
              <line key={i} x1={x} y1={0} x2={x} y2={chartHeight} stroke={isMajor ? GRID_MAJOR : GRID_DASHED} strokeWidth={isMajor ? 1 : 0.5} strokeDasharray={isMajor ? "0" : "5,2"} />
            );
          })}

          {[100, 0, -100].map((y) => (
            <text key={y} x={-10} y={chartY(y)} textAnchor="end" dominantBaseline="middle" fill={AXIS_TEXT} fontSize="12" fontFamily="monospace">{y}</text>
          ))}

          <text x={-MARGIN.left / 2 - 10} y={chartHeight / 2} textAnchor="middle" fill={AXIS_TEXT} fontSize="14" fontWeight="bold">{channelLabel}</text>

          <path ref={oldPathRef} fill="none" stroke={LINE_COLOR_OLD} strokeWidth={1.2} />
          <path ref={newPathRef} fill="none" stroke={LINE_COLOR} strokeWidth={1.5} />
        </g>

        {/* 右侧 Dashboard - 玫瑰图 */}
        <g transform={`translate(${MARGIN.left + chartWidth + DASHBOARD.left},0)`}>
          <rect x={0} y={0} width={DASHBOARD.width} height={DASHBOARD.height} fill="none" stroke="#7a919d" strokeWidth={0.5} />

          {/* 顶部图例和数值 */}
          <g>
            {rbpItems.map((item, i) => {
              const row = Math.floor(i / 2);
              const col = i % 2;
              const x = col * itemWidth + 10;
              const y = row * 20 + 20;
              const displayValue = channelRBP[i] !== undefined ? channelRBP[i].toFixed(1) : "0.0";
              return (
                <text key={item.name} x={x} y={y} fill={item.color} fontSize="15" fontFamily="monospace">
                  {item.name}: {displayValue}%
                </text>
              );
            })}
          </g>

          {/* 底部玫瑰图 */}
          <g transform={`translate(${DASHBOARD.width / 2}, ${DASHBOARD.height/1.6})`}>
            {channelRBP.length >= 4 ? (
              <RoseChart data={channelRBP.slice(0, 4)} />
            ) : (
              <RoseChart data={[0, 0, 0, 0]} />
            )}
          </g>
        </g>
      </svg>
    </div>
  );
}

// --- 外部导出接口 ---

interface EEGCardProps {
  isRunning: boolean;
  dataBuffer: Map<string, { value: number; timestamp: number }[]>;
  rbpData?: Record<string, number[]>; 
}

export function EEGCard1({ isRunning, dataBuffer, rbpData }: EEGCardProps) {
  return <EEGPanelCell channelLabel="F3-参考" channelKey="EEGData_F3_Ref" dataBuffer={dataBuffer} isRunning={isRunning} rbpData={rbpData} />;
}

export function EEGCard2({ isRunning, dataBuffer, rbpData }: EEGCardProps) {
  return <EEGPanelCell channelLabel="F4-参考" channelKey="EEGData_F4_Ref" dataBuffer={dataBuffer} isRunning={isRunning} rbpData={rbpData} />;
}

export function EEGCard3({ isRunning, dataBuffer, rbpData }: EEGCardProps) {
  return <EEGPanelCell channelLabel="P3-参考" channelKey="EEGData_P3_Ref" dataBuffer={dataBuffer} isRunning={isRunning} rbpData={rbpData} />;
}

export function EEGCard4({ isRunning, dataBuffer, rbpData }: EEGCardProps) {
  return <EEGPanelCell channelLabel="P4-参考" channelKey="EEGData_P4_Ref" dataBuffer={dataBuffer} isRunning={isRunning} rbpData={rbpData} />;
}
