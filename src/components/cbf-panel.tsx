"use client";

import { useEffect, useRef } from "react";

// --- 样式与坐标常量 ---
const PANEL_BG = "#082a35";
const BORDER_COLOR = "#7a919d";
const AXIS_COLOR = "#7a919d";
const LABEL_COLOR = "#6892ff";
const VALUE_COLOR = "#facc15";
const CHANNEL_BLUE = "#6892ff";
const LINE_COLOR_OLD = "#4a5a68";
const LINE_COLOR_NEW = "#99dbcf";

const SVG_WIDTH = 1124;
const SVG_HEIGHT = 200;
const LEFT_W = 100;     
const RIGHT_W = 181;    
const BOTTOM_H = 50;    
const CHART_W = SVG_WIDTH - LEFT_W - RIGHT_W;
const CHART_H = SVG_HEIGHT - BOTTOM_H;

const Y_MIN = 0;
const Y_MAX = 100;
const TICK_VALUES = [0, 20, 40, 60, 80, 100];
const TOTAL_SECONDS = 15;
const MS_PER_CYCLE = TOTAL_SECONDS * 1000;

type CBFPanelCellProps = {
  channelLabel: string;
  channelPrefix: string; // 如 "one-1" 或 "two-1"
  dataBuffer: Map<string, any[]>;
  isRunning?: boolean;
};

function CBFPanelCell({
  channelLabel,
  channelPrefix,
  dataBuffer,
  isRunning = true,
}: CBFPanelCellProps) {
  // 元素引用
  const newPathRef = useRef<SVGPathElement>(null);
  const oldPathRef = useRef<SVGPathElement>(null);
  const metricRefs = useRef<(SVGTextElement | null)[]>([]);

  // 同步运行状态
  const isRunningRef = useRef(isRunning);
  isRunningRef.current = isRunning;

  const lastValueUpdateRef = useRef<number>(0);
  const cycleDataRef = useRef({
    currentCyclePoints: [] as { elapsed: number; y: number }[],
    prevCyclePoints: [] as { elapsed: number; y: number }[],
    cycleStartTime: performance.now(),
  });

  const getYPos = (val: number) => {
    const ratio = (val - Y_MIN) / (Y_MAX - Y_MIN);
    return (1 - ratio) * CHART_H;
  };

  useEffect(() => {
    if (!isRunning) return;

    console.log(`[CBF-${channelPrefix}] 启动动画循环`);
    cycleDataRef.current.cycleStartTime = performance.now();
    const cycleData = cycleDataRef.current;
    let requestID: number;

    const animate = () => {
      const buffer = dataBuffer.get(channelPrefix);

      if (buffer && buffer.length > 0) {
        const dataBatch = [...buffer];
        dataBuffer.set(channelPrefix, []); // 消费数据

        for (const dataObj of dataBatch) {
          const pointNow = performance.now();
          let elapsed = pointNow - cycleData.cycleStartTime;

          // --- 1秒节流更新底部 6 个数值 ---
          if (pointNow - lastValueUpdateRef.current > 1000) {
            const m = metricRefs.current;
            // 批量更新文本节点
            if (m[0]) m[0].textContent = Number(dataObj[`${channelPrefix}_Peak_U`]).toFixed(1);
            if (m[1]) m[1].textContent = Number(dataObj[`${channelPrefix}_Mean_U`]).toFixed(1);
            if (m[2]) m[2].textContent = Number(dataObj[`${channelPrefix}_PI_U`]).toFixed(2);
            if (m[3]) m[3].textContent = Number(dataObj[`${channelPrefix}_RI_U`]).toFixed(2);
            if (m[4]) m[4].textContent = Number(dataObj[`${channelPrefix}_S/D_U`]).toFixed(2);
            if (m[5]) m[5].textContent = Number(dataObj[`${channelPrefix}_Dias_U`]).toFixed(1);
            lastValueUpdateRef.current = pointNow;
          }

          // 波形渲染：使用 Env 曲线
          const envVal = dataObj[`${channelPrefix}_Env_U`] || 0;
          const y = getYPos(envVal);

          // 周期复位逻辑
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

      // 绘制旧路径 (擦除逻辑)
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

      // 绘制新路径
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
    return () => {
      console.log(`[CBF-${channelPrefix}] 停止动画循环`);
      cancelAnimationFrame(requestID);
    };
  }, [isRunning, channelPrefix, dataBuffer]);

  const metricsLabels = ["Peak", "Mean", "PI", "RI", "S/D", "Dias"];

  return (
    <div className="w-full h-full" style={{ background: PANEL_BG }}>
      <svg viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`} preserveAspectRatio="none" className="w-full h-full block">
        <rect x="0" y="0" width={SVG_WIDTH} height={SVG_HEIGHT} fill={PANEL_BG} stroke={BORDER_COLOR} strokeWidth="1" />

        {/* Y 轴刻度 */}
        <g>
          <line x1={LEFT_W} y1="0" x2={LEFT_W} y2={CHART_H} stroke={BORDER_COLOR} />
          {TICK_VALUES.map((tick) => {
            const y = getYPos(tick);
            return (
              <g key={tick}>
                <text x={LEFT_W - 10} y={tick === 100 ? y + 8 : tick === 0 ? y - 5 : y} fill={AXIS_COLOR} fontSize="12" textAnchor="end" dominantBaseline="middle" fontFamily="monospace">
                  {tick}
                </text>
                <line x1={LEFT_W - 5} y1={y} x2={LEFT_W} y2={y} stroke={BORDER_COLOR} />
                <line x1={LEFT_W} y1={y} x2={LEFT_W + CHART_W} y2={y} stroke={BORDER_COLOR} strokeOpacity="0.2" strokeDasharray="5,5" />
              </g>
            );
          })}
          <text x="15" y={CHART_H / 2} fill={AXIS_COLOR} fontSize="12" textAnchor="middle" transform={`rotate(-90, 15, ${CHART_H / 2})`}>cm/s</text>
        </g>

        {/* 绘图区 */}
        <g transform={`translate(${LEFT_W}, 0)`}>
          <path ref={oldPathRef} fill="none" stroke={LINE_COLOR_OLD} strokeWidth="1.5" />
          <path ref={newPathRef} fill="none" stroke={LINE_COLOR_NEW} strokeWidth="2.5" />
        </g>

        {/* 通道标签 */}
        <g transform={`translate(${LEFT_W + CHART_W}, 0)`}>
          <line x1="0" y1="0" x2="0" y2={CHART_H} stroke={BORDER_COLOR} />
          <text x={RIGHT_W / 2} y={CHART_H / 2} fill={CHANNEL_BLUE} fontSize="19" fontWeight="bold" textAnchor="middle" dominantBaseline="middle">
            {channelLabel}
          </text>
        </g>

        {/* 底部数据面板 */}
        <g transform={`translate(0, ${CHART_H})`}>
          <line x1="0" y1="0" x2={SVG_WIDTH} y2="0" stroke={BORDER_COLOR} />
          {metricsLabels.map((label, i) => {
            const itemWidth = SVG_WIDTH / 6;
            return (
              <g key={label} transform={`translate(${i * itemWidth}, 0)`}>
                {i > 0 && <line x1="0" y1="15" x2="0" y2={BOTTOM_H - 15} stroke={BORDER_COLOR} />}
                <text x="15" y={BOTTOM_H / 2} fill={LABEL_COLOR} fontSize="13" dominantBaseline="middle">{label}</text>
                <text 
                  ref={el => { metricRefs.current[i] = el; }} 
                  x={itemWidth - 15} y={BOTTOM_H / 2} fill={VALUE_COLOR} fontSize="15" fontWeight="bold" fontFamily="monospace" textAnchor="end" dominantBaseline="auto"
                >
                  ---
                </text>
              </g>
            );
          })}
        </g>
      </svg>
    </div>
  );
}

// --- 外部导出接口 ---

interface CBFCardProps {
  isRunning: boolean;
  dataBuffer: Map<string, any[]>;
}

export function CBFCard1({ isRunning, dataBuffer }: CBFCardProps) {
  return (
    <CBFPanelCell 
      channelLabel="one-1_Env_U" 
      channelPrefix="one-1" 
      dataBuffer={dataBuffer} 
      isRunning={isRunning} 
    />
  );
}

export function CBFCard2({ isRunning, dataBuffer }: CBFCardProps) {
  return (
    <CBFPanelCell 
      channelLabel="two-1_Env_U" 
      channelPrefix="two-1" 
      dataBuffer={dataBuffer} 
      isRunning={isRunning} 
    />
  );
}