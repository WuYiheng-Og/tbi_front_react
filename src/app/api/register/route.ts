import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// 模拟已注册的患者数据
const patients: Map<string, object> = new Map();

// 生成 UUID 的简易实现
function generateUUID(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// POST /api/data/register - 注册新患者
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { name, phone, address, weight, height, sex, age, remark } = body;

  // 必填字段校验（address 允许空字符串）
  if (!name || !phone || weight === undefined || height === undefined || !sex || age === undefined) {
    return NextResponse.json(
      { error: "缺少必填字段: name, phone, weight, height, sex, age" },
      { status: 400 }
    );
  }

  // 生成患者 UUID
  const patientId = generateUUID();
  const patient = {
    id: patientId,
    name,
    phone,
    address,
    weight,
    height,
    sex,
    age,
    remark: remark || "",
    createdAt: new Date().toISOString(),
  };

  // 保存到内存
  patients.set(patientId, patient);

  // 直接返回纯文本 UUID
  return new Response(patientId, { status: 200 });
}
