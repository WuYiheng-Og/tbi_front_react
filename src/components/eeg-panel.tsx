"use client";

const PLOT_BG = "#1a2d3c";
const GRID_DASHED = "#3d5a6c";
const GRID_MAJOR = "#c4a574";
const AXIS_TEXT = "#e2e8f0";
const CHANNEL_TEXT = "#94a3b8";

const Y_TICKS = [100, 80, 60, 40, 20, 0, -20, -40, -60, -80, -100];
const Y_MIN = -100;
const Y_MAX = 100;

const TOTAL_SECONDS = 15;
const MS_PER_MINOR = 200;
const MINORS_PER_MAJOR = 10;
const SECONDS_PER_MAJOR = (MS_PER_MINOR * MINORS_PER_MAJOR) / 1000;

const minorVertCount = (TOTAL_SECONDS * 1000) / MS_PER_MINOR;
const majorVertCount = TOTAL_SECONDS / SECONDS_PER_MAJOR;

type EEGPanelCellProps = {
  channelLabel: string;
  delta?: string;
  theta?: string;
  alpha?: string;
  beta?: string;
};

function EEGPanelCell({
  channelLabel,
  delta = "0.0",
  theta = "0.0",
  alpha = "0.0",
  beta = "0.0",
}: EEGPanelCellProps) {
  const paddingLeft = 36;
  const paddingRight = 72;
  const paddingTop = 24;
  const paddingBottom = 20;
  const width = 400;
  const height = 240;
  const plotWidth = width - paddingLeft - paddingRight;
  const plotHeight = height - paddingTop - paddingBottom;

  const yToSvg = (y: number) => {
    const t = (y - Y_MIN) / (Y_MAX - Y_MIN);
    return paddingTop + (1 - t) * plotHeight;
  };

  const xToSvg = (ms: number) => {
    const t = ms / (TOTAL_SECONDS * 1000);
    return paddingLeft + t * plotWidth;
  };

  return (
    <div className="relative flex h-full w-full flex-col border-r border-b border-dashboard-border" style={{ background: PLOT_BG }}>
      {/* 频谱功率指示器 - 右上角 2x2 */}
      <div className="absolute right-2 top-2 z-10 grid grid-cols-2 gap-x-3 gap-y-0.5 text-[10px]">
        <span className="text-[#60a5fa]">δ {delta}</span>
        <span className="text-[#fb923c]">θ {theta}</span>
        <span className="text-[#4ade80]">α {alpha}</span>
        <span className="text-[#f87171]">β {beta}</span>
      </div>

      {/* 网格 + Y 轴 + X 轴时间标签 */}
      <svg
        className="h-full w-full"
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
      >
        {/* 水平虚线网格 (对应 Y 刻度) */}
        {Y_TICKS.map((y) => {
          const sy = yToSvg(y);
          return (
            <line
              key={y}
              x1={paddingLeft}
              y1={sy}
              x2={width - paddingRight}
              y2={sy}
              stroke={GRID_DASHED}
              strokeWidth="0.5"
              strokeDasharray="3 2"
            />
          );
        })}

        {/* 垂直虚线 (20ms 小格) + 黄色实线 (2s 大格) */}
        {Array.from({ length: minorVertCount + 1 }, (_, i) => {
          const ms = i * MS_PER_MINOR;
          const x = xToSvg(ms);
          const isMajor = i % MINORS_PER_MAJOR === 0;
          return (
            <line
              key={i}
              x1={x}
              y1={paddingTop}
              x2={x}
              y2={height - paddingBottom}
              stroke={isMajor ? GRID_MAJOR : GRID_DASHED}
              strokeWidth={isMajor ? 1 : 0.5}
              strokeDasharray={isMajor ? "0" : "3 2"}
            />
          );
        })}

        {/* Y 轴刻度标签 */}
        {Y_TICKS.map((y) => (
          <text
            key={y}
            x={paddingLeft - 6}
            y={yToSvg(y)}
            textAnchor="end"
            dominantBaseline="middle"
            fill={AXIS_TEXT}
            fontSize="10"
            fontFamily="system-ui, sans-serif"
          >
            {y}
          </text>
        ))}

        
      </svg>

      {/* 通道标签 - 左下角 */}
      <div
        className="absolute bottom-1 left-2 z-10 text-[10px]"
        style={{ color: CHANNEL_TEXT }}
      >
        {channelLabel}
      </div>
    </div>
  );
}

export function EEGCard1() {
  return <EEGPanelCell channelLabel="F3-参考" />;
}

export function EEGCard2() {
  return <EEGPanelCell channelLabel="F4-参考" />;
}

export function EEGCard3() {
  return <EEGPanelCell channelLabel="P3-参考" />;
}

export function EEGCard4() {
  return <EEGPanelCell channelLabel="P4-参考" />;
}
