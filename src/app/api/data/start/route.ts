import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// 模拟正在进行的采集会话
const activeSessions: Map<string, object> = new Map();

// 生成 UUID 的简易实现
function generateUUID(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// POST /api/data/start - 开始数据传输
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { NicoletMode, DelicaMode, GloryMode, id } = body;

  // 必填字段校验
  if (!NicoletMode || !DelicaMode || !GloryMode || !id) {
    return NextResponse.json(
      { error: "缺少必填字段: NicoletMode, DelicaMode, GloryMode, id" },
      { status: 400 }
    );
  }

  // 生成记录 UUID
  const recordId = generateUUID();

  // 保存采集会话信息
  const session = {
    recordId,
    patientId: id,
    nicoletMode: NicoletMode,
    delicaMode: DelicaMode,
    gloryMode: GloryMode,
    startTime: new Date().toISOString(),
  };

  activeSessions.set(recordId, session);

  // 直接返回纯文本 recordId
  return new Response(recordId, { status: 200 });
}
