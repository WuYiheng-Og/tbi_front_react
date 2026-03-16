"use client";

const PANEL_BG = "#082a35";
const AXIS_COLOR = "#7a919d";
const THEME_RED = "#ff6d6d"; // 图片中的特征红
const TEXT_GRAY = "#7a919d";

// 坐标系常量 (基于 1124x200)
const SVG_WIDTH = 1124;
const SVG_HEIGHT = 200;
const LEFT_W = 100;      // 左侧刻度区宽度
const RIGHT_W = 185;    // 右侧红色仪表盘宽度
const CHART_W = SVG_WIDTH - LEFT_W - RIGHT_W;

type NIRSPanelCellProps = {
  chNum?: string;
  side?: string;        // "L" or "R"
  label?: string;       // "CERE"
  rso2?: string;        // "---"
  bl?: string;          // "--"
  auc?: string;         // "--"
};

export function NIRSPanelCell({
  chNum = "1",
  side = "L",
  label = "CERE",
  rso2 = "---",
  bl = "--",
  auc = "--",
}: NIRSPanelCellProps) {
  
  // Y 轴比例计算：0 在底部，100 在顶部
  const getY = (val: number) => (1 - val / 100) * SVG_HEIGHT;

  return (
    <div className="w-full h-full" style={{ background: PANEL_BG }}>
      <svg
        viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
        preserveAspectRatio="none"
        className="w-full h-full block"
      >
        {/* 1. 整体外边框 */}
        <rect 
          x="0" y="0" width={SVG_WIDTH} height={SVG_HEIGHT} 
          fill="none" stroke={AXIS_COLOR} strokeWidth="0.5" 
        />

        {/* 2. 左侧：Y 轴刻度区 */}
        <g>
          {/* 刻度线与文字 */}
          {[0, 50, 100].map((tick) => (
            <g key={tick}>
              <text
                x={LEFT_W - 10}
                y={tick === 100 ? getY(tick) + 12 : tick === 0 ? getY(tick) - 5 : getY(tick)}
                fill={TEXT_GRAY}
                fontSize="14"
                textAnchor="end"
                fontFamily="monospace"
              >
                {tick}
              </text>
              <line 
                x1={LEFT_W - 5} y1={getY(tick)} 
                x2={LEFT_W} y2={getY(tick)} 
                stroke={AXIS_COLOR} 
              />
            </g>
          ))}
          {/* 垂直轴线 */}
          <line x1={LEFT_W} y1="0" x2={LEFT_W} y2={SVG_HEIGHT} stroke={AXIS_COLOR} />
        </g>

        {/* 3. 中间：绘图区（自适应） */}
        <g transform={`translate(${LEFT_W}, 0)`}>
          {/* 50% 处的虚线参考线 */}
          <line
            x1="0"
            y1={getY(50)}
            x2={CHART_W}
            y2={getY(50)}
            stroke={AXIS_COLOR}
            strokeDasharray="6,4"
            strokeOpacity="0.6"
          />
          {/* 底部装饰线 */}
          <line x1="0" y1={SVG_HEIGHT - 1} x2={CHART_W} y2={SVG_HEIGHT - 1} stroke={AXIS_COLOR} />
        </g>

        {/* 4. 右侧：Dashboard 仪表盘 */}
        <g transform={`translate(${LEFT_W + CHART_W + 5}, 5)`}>
          {/* 红色圆角边框 */}
          <rect
            x="0" y="0"
            width={RIGHT_W - 10}
            height={SVG_HEIGHT - 10}
            rx="8" ry="8"
            fill="none"
            stroke={THEME_RED}
            strokeWidth="3"
          />

          {/* 顶部标题行: Ch1 L CERE %rSO2 */}
          <g transform="translate(10, 22)">
            <text fill={THEME_RED} fontSize="16" fontWeight="bold">Ch{chNum}</text>
            <text x="38" fill={TEXT_GRAY} fontSize="16" fontWeight="medium">{side}</text>
            <text x="58" fill={TEXT_GRAY} fontSize="16" fontWeight="medium">{label}</text>
            <text x="110" fill={THEME_RED} fontSize="16" fontWeight="bold">%rSO₂</text>
          </g>

          {/* 中间特大数值 */}
          <text
            x={(RIGHT_W - 10) / 2}
            y={SVG_HEIGHT / 2 + 15}
            fill={THEME_RED}
            fontSize="90"
            fontWeight="bold"
            textAnchor="middle"
            style={{ letterSpacing: "-2px" }}
          >
            {rso2}
          </text>

          {/* 底部信息区 */}
          <g transform={`translate(10, ${SVG_HEIGHT - 45})`}>
            {/* BL (基线) */}
            <text fill={THEME_RED} fontSize="32" fontWeight="bold">BL</text>
            <text x="50" y="-2" fill={THEME_RED} fontSize="22" fontWeight="bold">{bl}</text>
            
            {/* AUC (面积) */}
            <text x="2" y="30" fill={THEME_RED} fontSize="14" fontWeight="bold">AUC</text>
            <text x="50" y="30" fill={THEME_RED} fontSize="16" fontWeight="bold">{auc}</text>
          </g>
        </g>
      </svg>
    </div>
  );
}

 

export function NIRSCard1() {
  return (
    <NIRSPanelCell chNum="1" side="L" label="CERE" rso2="---" bl="--" auc="--" />

  );
}

export function NIRSCard2() {
  return (
    <NIRSPanelCell chNum="2" side="R" label="CERE" rso2="75" bl="50" auc="12" />

  );
}