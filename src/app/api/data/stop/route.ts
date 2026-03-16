import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// 模拟采集状态（随机返回成功或特定错误信息）
const errorMessages = [
  { state: 1, msg: "采集成功完成" },
  { state: 0, msg: "脑氧文件出错" },
  { state: 0, msg: "脑电数据异常" },
  { state: 0, msg: "血流信号丢失" },
];

// POST /api/data/stop - 停止数据传输
export async function POST(_request: NextRequest) {
  // 随机返回一种状态（90% 概率成功，模拟真实场景）
  const random = Math.random();
  const result = random < 0.9 ? errorMessages[0] : errorMessages[Math.floor(Math.random() * (errorMessages.length - 1)) + 1];

  return NextResponse.json(result, { status: 200 });
}
