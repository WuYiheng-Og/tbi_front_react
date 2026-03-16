import { NextResponse } from "next/server";

export async function GET() {
  // TODO: 实现真正的 WebSocket 预警评分获取逻辑
  // 这里先用模拟数据返回
  const mockData = {
    ngl: Math.floor(Math.random() * 101),
    dlk: Math.floor(Math.random() * 101),
    yldl: Math.floor(Math.random() * 101),
    total_score_new: Math.floor(Math.random() * 101),
  };

  return NextResponse.json({ data: mockData });
}
