"use client";

import { useEffect, useRef, useState } from "react";

// 样式常量
const PANEL_BG = "#082a35";
const AXIS_COLOR = "#7a919d";
const THEME_RED = "#ff6d6d";
const TEXT_GRAY = "#7a919d";
const LINE_COLOR_OLD = "#4a5a68";

// 坐标与逻辑常量
const SVG_WIDTH = 1124;
const SVG_HEIGHT = 200;
const LEFT_W = 100;
const RIGHT_W = 185;
const CHART_W = SVG_WIDTH - LEFT_W - RIGHT_W;

const TOTAL_SECONDS = 15;
const MS_PER_CYCLE = TOTAL_SECONDS * 1000;

type NIRSPanelCellProps = {
  chNum: string;
  side: string;
  label: string;
  channelKey: string;
  dataBuffer: Map<string, number[]>;
  bl?: string;
  isRunning?: boolean;
};

function NIRSPanelCell({
  chNum,
  side,
  label,
  channelKey,
  dataBuffer,
  bl = "50",
  isRunning = true,
}: NIRSPanelCellProps) {
  // 元素引用 - 修复了 SVGTextElement 的类型错误
  const newPathRef = useRef<SVGPathElement>(null);
  const oldPathRef = useRef<SVGPathElement>(null);
  const rso2TextRef = useRef<SVGTextElement>(null);
  
  const isRunningRef = useRef(isRunning);
  // 用于控制数值 1s 更新一次的记录器
  const lastValueUpdateRef = useRef<number>(0);

  const cycleDataRef = useRef<{
    currentCyclePoints: { elapsed: number; y: number }[];
    prevCyclePoints: { elapsed: number; y: number }[];
    cycleStartTime: number;
  }>({
    currentCyclePoints: [],
    prevCyclePoints: [],
    cycleStartTime: performance.now(),
  });

  useEffect(() => {
    isRunningRef.current = isRunning;
    if (isRunning) {
      cycleDataRef.current.cycleStartTime = performance.now();
    }
  }, [isRunning]);

  const getY = (val: number) => (1 - val / 100) * SVG_HEIGHT;

  useEffect(() => {
    const cycleData = cycleDataRef.current;

    const animate = () => {
      if (!isRunningRef.current) return;

      const now = performance.now();
      const buffer = dataBuffer.get(channelKey);

      if (buffer && buffer.length > 0) {
        const values = [...buffer];
        dataBuffer.set(channelKey, []);

        for (const value of values) {
          const pointNow = performance.now();
          let elapsed = pointNow - cycleData.cycleStartTime;
          
          // --- 数值节流更新逻辑 (1秒更新一次) ---
          if (pointNow - lastValueUpdateRef.current > 1000) {
            if (rso2TextRef.current) {
              rso2TextRef.current.textContent =  Number(value).toFixed(0);
            }
            lastValueUpdateRef.current = pointNow;
          }

          const y = getY(value);

          if (elapsed >= MS_PER_CYCLE) {
            cycleData.prevCyclePoints = cycleData.currentCyclePoints;
            cycleData.currentCyclePoints = [];
            cycleData.cycleStartTime = pointNow;
            elapsed = 0;
          }

          cycleData.currentCyclePoints.push({ elapsed, y });
        }
      }

      const currentElapsed = now - cycleData.cycleStartTime;

      // 1. 绘制旧周期路径
      if (cycleData.prevCyclePoints.length >= 2) {
        const visiblePrev = cycleData.prevCyclePoints.filter(p => p.elapsed >= currentElapsed);
        if (visiblePrev.length >= 2) {
          const d = visiblePrev.map((p, i) => {
            const x = (p.elapsed / MS_PER_CYCLE) * CHART_W;
            return `${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${p.y.toFixed(1)}`;
          }).join(" ");
          oldPathRef.current?.setAttribute("d", d);
        } else {
          oldPathRef.current?.setAttribute("d", "");
        }
      }

      // 2. 绘制当前周期路径
      if (cycleData.currentCyclePoints.length >= 2) {
        const d = cycleData.currentCyclePoints.map((p, i) => {
          const x = (p.elapsed / MS_PER_CYCLE) * CHART_W;
          return `${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${p.y.toFixed(1)}`;
        }).join(" ");
        newPathRef.current?.setAttribute("d", d);
      }

      requestAnimationFrame(animate);
    };

    const animId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animId);
  }, [channelKey, dataBuffer]);

  const DB_INNER_W = RIGHT_W - 10;
  const DB_INNER_H = SVG_HEIGHT - 10;

  return (
    <div className="w-full h-full" style={{ background: PANEL_BG }}>
      <svg viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`} preserveAspectRatio="none" className="w-full h-full block">
        <rect x="0" y="0" width={SVG_WIDTH} height={SVG_HEIGHT} fill="none" stroke={AXIS_COLOR} strokeWidth="0.5" />

        {/* 左侧 Y 轴 */}
        <g>
          {[0, 50, 100].map((tick) => (
            <g key={tick}>
              <text
                x={LEFT_W - 10}
                y={tick === 100 ? getY(tick) + 12 : tick === 0 ? getY(tick) - 5 : getY(tick)}
                fill={TEXT_GRAY} fontSize="14" textAnchor="end" fontFamily="monospace"
              >
                {tick}
              </text>
              <line x1={LEFT_W - 5} y1={getY(tick)} x2={LEFT_W} y2={getY(tick)} stroke={AXIS_COLOR} />
            </g>
          ))}
          <line x1={LEFT_W} y1="0" x2={LEFT_W} y2={SVG_HEIGHT} stroke={AXIS_COLOR} />
        </g>

        {/* 中间绘图区 */}
        <g transform={`translate(${LEFT_W}, 0)`}>
          <line x1="0" y1={getY(50)} x2={CHART_W} y2={getY(50)} stroke={AXIS_COLOR} strokeDasharray="6,4" strokeOpacity="0.4" />
          <path ref={oldPathRef} fill="none" stroke={LINE_COLOR_OLD} strokeWidth="1.5" />
          <path ref={newPathRef} fill="none" stroke={THEME_RED} strokeWidth="2.5" />
        </g>

        {/* 右侧仪表盘 */}
        <g transform={`translate(${LEFT_W + CHART_W + 5}, 5)`}>
          <rect width={DB_INNER_W} height={DB_INNER_H} rx="8" ry="8" fill="none" stroke={THEME_RED} strokeWidth="3" />
          
          <g transform="translate(12, 25)">
            <text fill={THEME_RED} fontSize="16" fontWeight="bold">Ch{chNum}</text>
            <text x="38" fill={TEXT_GRAY} fontSize="15">{side}</text>
            <text x="58" fill={TEXT_GRAY} fontSize="15">{label}</text>
            <text x={DB_INNER_W - 22} fill={THEME_RED} fontSize="14" fontWeight="bold" textAnchor="end">%rSO₂</text>
          </g>

          <text
            ref={rso2TextRef}
            x={DB_INNER_W / 2}
            y={DB_INNER_H / 2 + 10}
            fill={THEME_RED}
            fontSize="95"
            fontWeight="bold"
            textAnchor="middle"
            dominantBaseline="middle"
          >
            ---
          </text>

          <g transform={`translate(12, ${DB_INNER_H - 15})`}>
            <text fill={THEME_RED} fontSize="24" fontWeight="bold" dominantBaseline="auto">BL</text>
            <text x="38" y="-1" fill={THEME_RED} fontSize="18" fontWeight="bold" dominantBaseline="auto">{bl}</text>
          </g>
        </g>
      </svg>
    </div>
  );
}

export function NIRSCards({ isRunning = true }: { isRunning?: boolean }) {
  const [dataBuffer] = useState(() => new Map<string, number[]>());
  const esRef = useRef<EventSource | null>(null);

  useEffect(() => {
    dataBuffer.set("rSO2-1", []);
    dataBuffer.set("rSO2-2", []);

    if (!isRunning) {
      esRef.current?.close();
      return;
    }

    const es = new EventSource("/api/monitor");
    esRef.current = es;

    es.onmessage = (e) => {
      try {
        const { yldl } = JSON.parse(e.data);
        if (yldl) {
          // 适配 yldl 中的数据字段
          if (yldl["rSO2-1"] !== undefined) dataBuffer.get("rSO2-1")?.push(yldl["rSO2-1"]);
          if (yldl["rSO2-2"] !== undefined) dataBuffer.get("rSO2-2")?.push(yldl["rSO2-2"]);
        }
      } catch (err) {
        console.error("NIRS Data Error:", err);
      }
    };

    return () => es.close();
  }, [isRunning, dataBuffer]);

  return ( 
        <NIRSPanelCell chNum="1" side="L" label="CERE" channelKey="rSO2-1" dataBuffer={dataBuffer} isRunning={isRunning} />
 
  );
}
 

export function NIRSCard1({ isRunning = true }: { isRunning?: boolean }) {
  return <NIRSCards isRunning={isRunning} />;
}

export function NIRSCard2({ isRunning = true }: { isRunning?: boolean }) {
  return <NIRSCards isRunning={isRunning} />;
}