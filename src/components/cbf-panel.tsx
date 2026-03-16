"use client";

const PANEL_BG = "#082a35";
const BORDER_COLOR = "#7a919d";
const AXIS_COLOR = "#7a919d";
const LABEL_COLOR = "#6892ff";
const VALUE_COLOR = "#facc15";
const CHANNEL_BLUE = "#6892ff";

// 定义固定的坐标系常量 (模仿第二个代码的逻辑)
const SVG_WIDTH = 1124;
const SVG_HEIGHT = 200;
const LEFT_W = 100;     // 左侧 Y 轴宽度
const RIGHT_W = 181;    // 右侧标签宽度
const BOTTOM_H = 50;    // 底部数据栏高度

// 在组件外定义 Y 轴的配置
const Y_MIN = 0;
const Y_MAX = 100;
const TICK_VALUES = [0, 20, 40, 60, 80, 100];

// 计算中间绘图区的宽度
const CHART_W = SVG_WIDTH - LEFT_W - RIGHT_W;
const CHART_H = SVG_HEIGHT - BOTTOM_H;

type CBFPanelCellProps = {
  channelLabel?: string;
  peak?: string;
  mean?: string;
  pi?: string;
  ri?: string;
  sd?: string;
  dias?: string;
};

// 输入数值 (0-100)，返回在 CHART_H (140) 范围内的像素坐标
const getYPos = (val: number) => {
  const ratio = (val - Y_MIN) / (Y_MAX - Y_MIN);
  // SVG 坐标系 y 是从上往下的，所以要用 1 减去比例
  return (1 - ratio) * CHART_H;
};

function CBFPanelCell({
  channelLabel = "one-1_Env_U",
  peak = "0",
  mean = "0",
  pi = "0",
  ri = "0",
  sd = "0",
  dias = "0",
}: CBFPanelCellProps) {
  const metrics = [
    { key: "Peak", value: peak },
    { key: "Mean", value: mean },
    { key: "PI", value: pi },
    { key: "RI", value: ri },
    { key: "S/D", value: sd },
    { key: "Dias", value: dias },
  ];

  return (
    <div className="w-full h-full" style={{ background: PANEL_BG }}>
      <svg
        viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
        preserveAspectRatio="none"
        className="w-full h-full block"
      >
        {/* 1. 全局背景与外边框 */}
        <rect x="0" y="0" width={SVG_WIDTH} height={SVG_HEIGHT} fill={PANEL_BG} stroke={BORDER_COLOR} strokeWidth="1" />

        {/* 2. 左侧：Y 轴区 */}
        <g>
          {/* 绘制 Y 轴线 */}
          <line x1={LEFT_W} y1="0" x2={LEFT_W} y2={CHART_H} stroke={BORDER_COLOR} />

          {TICK_VALUES.map((tick) => {
            const y = getYPos(tick);
            return (
              <g key={tick}>
                {/* 刻度数值标签 */}
                <text
                    x={LEFT_W - 10}
                    y={tick === 100 ? y + 5 : tick === 0 ? y - 5 : y} // 100向下挪4px, 0向上挪4px
                  fill={AXIS_COLOR}
                  fontSize="12"
                  textAnchor="end" // 右对齐
                  dominantBaseline="middle" // 垂直居中
                  fontFamily="monospace"
                >
                  {tick}
                </text>

                {/* 刻度短横线 (位于轴上) */}
                <line 
                  x1={LEFT_W - 5} y1={y} 
                  x2={LEFT_W} y2={y} 
                  stroke={BORDER_COLOR} 
                />

                {/* 背景水平网格标线 (贯穿中间绘图区) */}
                {/* 使用 dasharray 5,5 虚线，或者实线，颜色设置得淡一点 */}
                <line
                  x1={LEFT_W}
                  y1={y}
                  x2={LEFT_W + CHART_W}
                  y2={y}
                  stroke={BORDER_COLOR}
                  strokeOpacity="0.3"
                  strokeDasharray="5,5"
                  strokeWidth="0.5"
                />
              </g>
            );
          })}

          {/* 垂直文本 cm/s (放在左侧空隙处) */}
          <text
            x="15"
            y={CHART_H / 2}
            fill={AXIS_COLOR}
            fontSize="12"
            textAnchor="middle"
            transform={`rotate(-90, 15, ${CHART_H / 2})`} // SVG 旋转更标准的方法
            style={{ letterSpacing: "0.1em" }}
          >
            cm/s
          </text>
        </g>

        {/* 3. 中间：绘图区 (自适应部分) */}
        <g transform={`translate(${LEFT_W}, 0)`}>
          {/* 这里预留波形绘制，它的宽度就是 CHART_W */}
          <rect width={CHART_W} height={CHART_H} fill="transparent" />
        </g>

        {/* 4. 右侧：通道标签区 */}
        <g transform={`translate(${LEFT_W + CHART_W}, 0)`}>
          {/* 左侧分割线 */}
          <line x1="0" y1="0" x2="0" y2={CHART_H} stroke={BORDER_COLOR} />
          
          <text
            x={RIGHT_W / 2}           /* 设置为右侧区域宽度的一半 */
            y={CHART_H / 2}           /* 设置为高度的一半 */
            fill={CHANNEL_BLUE}
            fontSize="19"
            fontWeight="bold"
            textAnchor="middle"       /* 水平居中关键属性 */
            dominantBaseline="middle" /* 垂直居中关键属性 */
          >
            {channelLabel}
          </text>
        </g>

        {/* 5. 底部：数据条面板 */}
        <g transform={`translate(0, ${CHART_H})`}>
          {/* 底部顶部分隔横线 */}
          <line x1="0" y1="0" x2={SVG_WIDTH} y2="0" stroke={BORDER_COLOR} />
          
          {metrics.map((m, i) => {
            const itemWidth = SVG_WIDTH / metrics.length;
            const xPos = i * itemWidth;
            const midY = BOTTOM_H / 2; // 垂直中心点

            return (
              <g key={m.key} transform={`translate(${xPos}, 0)`}>
                {/* 垂直分割线：只在格子之间画 */}
                {i > 0 && <line x1="0" y1="15" x2="0" y2={BOTTOM_H - 15} stroke={BORDER_COLOR} />}
                
                {/* Label (指标名称)：靠左对齐，留出 15 像素边距 */}
                <text
                  x="15" 
                  y={midY}
                  fill={LABEL_COLOR}
                  fontSize="15"
                  textAnchor="start"     /* 关键：靠左对齐 */
                  dominantBaseline="middle"
                >
                  {m.key}
                </text>

                {/* Value (数值)：靠右对齐，留出 15 像素边距 */}
                <text
                  x={itemWidth - 15} 
                  y={midY}
                  fill={VALUE_COLOR}
                  fontSize="15"
                  fontWeight="bold"
                  fontFamily="monospace"
                  textAnchor="end"       /* 关键：靠右对齐 */
                  dominantBaseline="middle"
                >
                  {m.value}
                </text>
              </g>
            );
          })}
        </g>
      </svg>
    </div>
  );
}

export function CBFCard1() {
  return <CBFPanelCell channelLabel="1-1_Env_U" />;
}

export function CBFCard2() {
  return <CBFPanelCell channelLabel="1-2_Env_U" />;
}