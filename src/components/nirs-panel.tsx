"use client";

import { useEffect, useRef } from "react";

// --- 样式与坐标常量 (保持不变) ---
const PANEL_BG = "#082a35";
const AXIS_COLOR = "#7a919d";
const THEME_RED = "#ff6d6d";
const TEXT_GRAY = "#7a919d";
const LINE_COLOR_OLD = "#4a5a68";
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

// 1. 原子组件：负责具体的动画渲染逻辑
function NIRSPanelCell({
  chNum,
  side,
  label,
  channelKey,
  dataBuffer,
  bl = "50",
  isRunning = true,
}: NIRSPanelCellProps) {
  const newPathRef = useRef<SVGPathElement>(null);
  const oldPathRef = useRef<SVGPathElement>(null);
  const rso2TextRef = useRef<SVGTextElement>(null);
  
  // 1. 移除多余的 isRunningRef useEffect，直接在渲染阶段同步 Ref
  const isRunningRef = useRef(isRunning);
  isRunningRef.current = isRunning; 

  const lastValueUpdateRef = useRef<number>(0);
  const cycleDataRef = useRef({
    currentCyclePoints: [] as { elapsed: number; y: number }[],
    prevCyclePoints: [] as { elapsed: number; y: number }[],
    cycleStartTime: 0,
  });

  const getY = (val: number) => (1 - val / 100) * SVG_HEIGHT;

  // 2. 动画循环 useEffect
  useEffect(() => {
    // 如果外部控制为停止，则不启动循环
    if (!isRunning) return;

    console.log(`[${channelKey}] 启动动画循环`);
    
    // 每次启动或重启时，重置时间戳（等待第一个数据点）
    cycleDataRef.current.cycleStartTime = 0;
    const cycleData = cycleDataRef.current;

    let requestID: number;

    const animate = () => {
      // 检查数据缓冲区
      const buffer = dataBuffer.get(channelKey);
      
      // 注意：这里我们不再在这里检测 isRunningRef.current 并 return 
      // 而是完全依赖 requestAnimationFrame 的取消机制

      if (buffer && buffer.length > 0) {
        const values = [...buffer];
        dataBuffer.set(channelKey, []); // 消费数据

        for (const value of values) {
          const pointNow = performance.now();
          // 如果还没有开始计时，则从当前时刻开始
          if (cycleData.cycleStartTime === 0) {
            cycleData.cycleStartTime = pointNow;
          }
          let elapsed = pointNow - cycleData.cycleStartTime;
          
          // 1s 节流更新右侧数值
          if (pointNow - lastValueUpdateRef.current > 1000) {
            if (rso2TextRef.current) {
              rso2TextRef.current.textContent = Number(value).toFixed(0);
            }
            lastValueUpdateRef.current = pointNow;
          }

          // 周期复位逻辑
          if (elapsed >= MS_PER_CYCLE) {
            cycleData.prevCyclePoints = cycleData.currentCyclePoints;
            cycleData.currentCyclePoints = [];
            cycleData.cycleStartTime = pointNow;
          }
          cycleData.currentCyclePoints.push({ elapsed, y: getY(value) });
        }
      }

      // 绘制逻辑
      const now = performance.now();
      const currentElapsed = cycleData.cycleStartTime > 0
        ? now - cycleData.cycleStartTime
        : 0;

      if (oldPathRef.current && cycleData.prevCyclePoints.length >= 2) {
        const visiblePrev = cycleData.prevCyclePoints.filter(p => p.elapsed >= currentElapsed);
        if (visiblePrev.length >= 2) {
          const d = visiblePrev.map((p, i) => {
            const x = (p.elapsed / MS_PER_CYCLE) * CHART_W;
            return `${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${p.y.toFixed(1)}`;
          }).join(" ");
          oldPathRef.current.setAttribute("d", d);
        } else {
          oldPathRef.current.setAttribute("d", "");
        }
      }

      if (newPathRef.current && cycleData.currentCyclePoints.length >= 2) {
        const d = cycleData.currentCyclePoints.map((p, i) => {
          const x = (p.elapsed / MS_PER_CYCLE) * CHART_W;
          return `${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${p.y.toFixed(1)}`;
        }).join(" ");
        newPathRef.current.setAttribute("d", d);
      }

      requestID = requestAnimationFrame(animate);
    };

    requestID = requestAnimationFrame(animate);

    // 3. 清理函数：这是停止循环的唯一正确方式
    return () => {
      console.log(`[${channelKey}] 停止动画循环`);
      cancelAnimationFrame(requestID);
    };
  }, [isRunning, channelKey, dataBuffer]); // 依赖项变化时会自动经历 停止 -> 启动




  const DB_INNER_W = RIGHT_W - 10;
  const DB_INNER_H = SVG_HEIGHT - 10;

  return (
    <div className="w-full h-full" style={{ background: PANEL_BG }}>
      <svg viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`} preserveAspectRatio="none" className="w-full h-full block">
        <rect x="0" y="0" width={SVG_WIDTH} height={SVG_HEIGHT} fill="none" stroke={AXIS_COLOR} strokeWidth="0.5" />
        <g>
          {[0, 50, 100].map((tick) => (
            <g key={tick}>
              <text x={LEFT_W - 10} y={tick === 100 ? getY(tick) + 12 : tick === 0 ? getY(tick) - 5 : getY(tick)} fill={TEXT_GRAY} fontSize="14" textAnchor="end" fontFamily="monospace">{tick}</text>
              <line x1={LEFT_W - 5} y1={getY(tick)} x2={LEFT_W} y2={getY(tick)} stroke={AXIS_COLOR} />
            </g>
          ))}
          <line x1={LEFT_W} y1="0" x2={LEFT_W} y2={SVG_HEIGHT} stroke={AXIS_COLOR} />
        </g>
        <g transform={`translate(${LEFT_W}, 0)`}>
          <line x1="0" y1={getY(50)} x2={CHART_W} y2={getY(50)} stroke={AXIS_COLOR} strokeDasharray="6,4" strokeOpacity="0.4" />
          <path ref={oldPathRef} fill="none" stroke={LINE_COLOR_OLD} strokeWidth="1.5" />
          <path ref={newPathRef} fill="none" stroke={THEME_RED} strokeWidth="2.5" />
        </g>
        <g transform={`translate(${LEFT_W + CHART_W + 5}, 5)`}>
          <rect width={DB_INNER_W} height={DB_INNER_H} rx="8" ry="8" fill="none" stroke={THEME_RED} strokeWidth="3" />
          <g transform="translate(12, 25)">
            <text fill={THEME_RED} fontSize="16" fontWeight="bold">Ch{chNum}</text>
            <text x="38" fill={TEXT_GRAY} fontSize="15">{side}</text>
            <text x="58" fill={TEXT_GRAY} fontSize="15">{label}</text>
            <text x={DB_INNER_W - 22} fill={THEME_RED} fontSize="14" fontWeight="bold" textAnchor="end">%rSO₂</text>
          </g>
          <text ref={rso2TextRef} x={DB_INNER_W / 2} y={DB_INNER_H / 2 + 10} fill={THEME_RED} fontSize="95" fontWeight="bold" textAnchor="middle" dominantBaseline="middle">---</text>
          <g transform={`translate(12, ${DB_INNER_H - 15})`}>
            <text fill={THEME_RED} fontSize="24" fontWeight="bold" dominantBaseline="auto">BL</text>
            <text x="38" y="-1" fill={THEME_RED} fontSize="18" fontWeight="bold" dominantBaseline="auto">{bl}</text>
          </g>
        </g>
      </svg>
    </div>
  );
}

// --- 外部导出接口 ---

interface NIRSCardProps {
  isRunning: boolean;
  dataBuffer: Map<string, number[]>;
}

// 导出左侧脑氧卡片
export function NIRSCard1({ isRunning, dataBuffer }: NIRSCardProps) {
  return (
    <NIRSPanelCell 
      chNum="1" 
      side="L" 
      label="CERE" 
      channelKey="rSO2-1" 
      dataBuffer={dataBuffer} 
      isRunning={isRunning} 
    />
  );
}

// 导出右侧脑氧卡片
export function NIRSCard2({ isRunning, dataBuffer }: NIRSCardProps) {
  return (
    <NIRSPanelCell 
      chNum="2" 
      side="R" 
      label="CERE" 
      channelKey="rSO2-2" 
      dataBuffer={dataBuffer} 
      isRunning={isRunning} 
    />
  );
}