import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

function transferElectrode(value: string) {
  switch (value) {
    case "Single electrode mode":
      return "一电极";
    case "Two electrode mode":
      return "二电极";
    case "Three electrode mode":
      return "三电极";
    case "Four electrode mode":
      return "四电极";
    default:
      return "未知电极";
  }
}

function transferChannel(value: string) {
  switch (value) {
    case "Single channel mode":
      return "单通道";
    case "Two channel mode":
      return "双通道";
    default:
      return "未知通道";
  }
}

// Mock 记录数据
let records = [
  {
    id: "R001",
    patient_id: "P001",
    patient_name: "张三",
    sex: "男",
    delicaMode: "Two channel mode",
    nicoletMode: "Four electrode mode",
    gloryMode: "Two channel mode",
    collectDateTime: "2024-01-15 10:30:00",
    endDateTime: "2024-01-15 11:30:00",
    remark: "正常采集",
  },
  {
    id: "R002",
    patient_id: "P002",
    patient_name: "李四",
    sex: "女",
    delicaMode: "Two channel mode",
    nicoletMode: "Four electrode mode",
    gloryMode: "Two channel mode",
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
    const matchSex = sex === "" || (r.sex && r.sex.includes(sex));
    const matchDelicaMode =
      delica_mode === "" ||
      r.delicaMode.includes(delica_mode) ||
      transferElectrode(r.delicaMode).includes(delica_mode);
    const matchNicoletMode =
      nicolet_mode === "" ||
      r.nicoletMode.includes(nicolet_mode) ||
      transferChannel(r.nicoletMode).includes(nicolet_mode);
    const matchGloryMode =
      glory_mode === "" ||
      r.gloryMode.includes(glory_mode) ||
      transferElectrode(r.gloryMode).includes(glory_mode);
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
