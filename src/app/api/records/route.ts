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

// GET - 获取记录列表
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const patient_id = searchParams.get("patient_id") || "";
  const name = searchParams.get("name") || "";
  const sex = searchParams.get("sex") || "";
  const delica_mode = searchParams.get("delica_mode") || "";
  const nicolet_mode = searchParams.get("nicolet_mode") || "";
  const glory_mode = searchParams.get("glory_mode") || "";
  const collect_datetime = searchParams.get("collect_datetime") || "";
  const end_datetime = searchParams.get("end_datetime") || "";

  // 模糊搜索
  const filtered = records.filter((r) => {
    const matchPatientId = patient_id === "" || r.patient_id.includes(patient_id);
    const matchName = name === "" || r.patient_name.includes(name);
    const matchSex = sex === ""; // 暂时不支持，按 patient_name 已有数据
    const matchDelicaMode = delica_mode === "" || r.delicaMode.includes(delica_mode);
    const matchNicoletMode = nicolet_mode === "" || r.nicoletMode.includes(nicolet_mode);
    const matchGloryMode = glory_mode === "" || r.gloryMode.includes(glory_mode);
    const matchCollectDatetime = collect_datetime === "" || r.collectDateTime === collect_datetime;
    const matchEndDatetime = end_datetime === "" || r.endDateTime === end_datetime;

    return (
      matchPatientId &&
      matchName &&
      matchSex &&
      matchDelicaMode &&
      matchNicoletMode &&
      matchGloryMode &&
      matchCollectDatetime &&
      matchEndDatetime
    );
  });

  return NextResponse.json(filtered);
}

// DELETE - 删除记录
export async function DELETE(request: NextRequest) {
  const body = await request.json();
  const { record_id } = body;

  records = records.filter((r) => r.id !== record_id);

  return NextResponse.json("delete succed");
}
