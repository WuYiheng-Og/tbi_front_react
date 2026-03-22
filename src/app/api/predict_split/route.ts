import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = await request.json();
  const { uuid } = body;

  // 模拟 API 延迟
  await new Promise((resolve) => setTimeout(resolve, 1500));

  // Mock 预测结果
  const mockResponseSuccess = {
    state: 1,
    data: ["清醒", "清醒", "昏迷"],
    message: "预测成功",
  };

 const mockResponseError = {
  state: 0,
  data: ["", "", ""],
  message: "预测失败",
};

  return NextResponse.json(mockResponseError);
}
