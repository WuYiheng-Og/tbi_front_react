import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = await request.json();

  // 模拟 API 响应
  const mockResponse = {
    state: 1,
    message: "反馈提交成功",
  };

  console.log("提交反馈API响应:", mockResponse);

  return NextResponse.json(mockResponse);
}
