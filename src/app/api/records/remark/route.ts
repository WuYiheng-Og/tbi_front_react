import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Mock 记录数据
let records = [
  {
    id: "R001",
    patient_id: "P001",
    patient_name: "张三",
    delicaMode: "2",
    nicoletMode: "4",
    gloryMode: "2",
    collectDateTime: "2024-01-15 10:30:00",
    endDateTime: "2024-01-15 11:30:00",
    remark: "正常采集",
  },
  {
    id: "R002",
    patient_id: "P002",
    patient_name: "李四",
    delicaMode: "2",
    nicoletMode: "4",
    gloryMode: "2",
    collectDateTime: "2024-01-16 14:00:00",
    endDateTime: "2024-01-16 15:00:00",
    remark: "采集顺利完成",
  },
];

// PUT - 修改记录备注
export async function PUT(request: NextRequest) {
  const body = await request.json();
  const { record_id, remark } = body;

  const index = records.findIndex((r) => r.id === record_id);
  if (index !== -1) {
    records[index].remark = remark;
    return NextResponse.json(records[index]);
  }

  return NextResponse.json({ error: "记录不存在" }, { status: 404 });
}
