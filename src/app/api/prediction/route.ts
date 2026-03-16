import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = await request.json();
  const { uuid } = body;

  // 模拟 API 延迟
  await new Promise((resolve) => setTimeout(resolve, 1500));

  // Mock 预测结果
  const mockResponse = {
    state: 1,
    data: ["清醒", "清醒", "昏迷"],
    message: "预测成功",
  };

  return NextResponse.json(mockResponse);
}
