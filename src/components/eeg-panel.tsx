"use client";

const PLOT_BG = "#082a35";
const GRID_DASHED = "grey";
const GRID_MAJOR = "#e47945";
const AXIS_TEXT = "#7a919d";
const LINE_COLOR = "#99dbcf";

const Y_MIN = -100;
const Y_MAX = 100;

const TOTAL_SECONDS = 15;
const MS_PER_MINOR = 200;
const MINORS_PER_MAJOR = 10;
const SECONDS_PER_MAJOR = (MS_PER_MINOR * MINORS_PER_MAJOR) / 1000;

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
  const svgWidth = 1124;
  const svgHeight = 200;

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
    { name: "δ", value: delta },
    { name: "θ", value: theta },
    { name: "α", value: alpha },
    { name: "β", value: beta },
  ];

  return (
    <div
      className="relative h-full w-full border-r border-b border-dashboard-border"
      style={{ background: PLOT_BG }}
    >
      <svg
        className="h-full w-full"
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        preserveAspectRatio="none"
        style={{ border: "1px solid lightgray" }}
      >
        {/* 绘图区域 */}
        <g transform={`translate(${MARGIN.left}, ${MARGIN.top})`}>
          {/* 水平网格线 */}
          {[
            100, 80, 60, 40, 20, 0, -20, -40, -60, -80, -100,
          ].map((y) => {
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

          {/* 垂直网格线 - 20ms 小格虚线 + 2s 大格实线 */}
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

          

          {/* 通道标签 - 左侧边距内，避免被裁切 */}
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
        </g>

        {/* 右侧 Dashboard 面板 */}
        <g
          transform={`translate(${MARGIN.left + chartWidth + DASHBOARD.left},0)`}
        >
          {/* 边框 */}
          <rect
            x={0}
            y={0}
            width={DASHBOARD.width}
            height={DASHBOARD.height}
            fill="none"
            stroke="grey"
            strokeWidth={3}
          />

          {/* RBP 图例 - 2x2 布局 */}
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
