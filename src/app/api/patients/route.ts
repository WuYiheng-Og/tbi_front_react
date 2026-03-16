import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Mock 患者数据
let patients = [
  {
    id: "P001",
    name: "张三",
    age: 45,
    sex: "男",
    height: 172,
    weight: 78,
    address: "北京市朝阳区",
    phone: "13800138000",
    remark: "高血压",
  },
  {
    id: "P002",
    name: "李四",
    age: 32,
    sex: "女",
    height: 160,
    weight: 55,
    address: "上海市浦东新区",
    phone: "13900139000",
    remark: "",
  },
  {
    id: "P003",
    name: "王五",
    age: 58,
    sex: "男",
    height: 175,
    weight: 82,
    address: "广州市天河区",
    phone: "13700137000",
    remark: "糖尿病",
  },
];

// GET - 获取患者信息（支持模糊搜索）
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const patient_id = searchParams.get("patient_id") || "";
  const name = searchParams.get("name") || "";
  const age = searchParams.get("age") || "";
  const sex = searchParams.get("sex") || "";
  const height = searchParams.get("height") || "";
  const weight = searchParams.get("weight") || "";
  const address = searchParams.get("address") || "";
  const phone = searchParams.get("phone") || "";
  const remark = searchParams.get("remark") || "";

  // 模糊搜索
  const filtered = patients.filter((p) => {
    const matchPatientId = patient_id === "" || p.id.includes(patient_id);
    const matchName = name === "" || p.name.includes(name);
    const matchAge = age === "" || String(p.age).includes(age);
    const matchSex = sex === "" || p.sex.includes(sex);
    const matchHeight = height === "" || String(p.height).includes(height);
    const matchWeight = weight === "" || String(p.weight).includes(weight);
    const matchAddress = address === "" || p.address.includes(address);
    const matchPhone = phone === "" || p.phone.includes(phone);
    const matchRemark = remark === "" || p.remark.includes(remark);

    return (
      matchPatientId &&
      matchName &&
      matchAge &&
      matchSex &&
      matchHeight &&
      matchWeight &&
      matchAddress &&
      matchPhone &&
      matchRemark
    );
  });

  return NextResponse.json(filtered);
}

// PUT - 修改患者信息
export async function PUT(request: NextRequest) {
  const body = await request.json();
  const { patient_id, ...updateData } = body;

  const index = patients.findIndex((p) => p.id === patient_id);
  if (index !== -1) {
    patients[index] = { ...patients[index], ...updateData };
    return NextResponse.json(patients[index]);
  }

  return NextResponse.json({ error: "患者不存在" }, { status: 404 });
}

// DELETE - 删除患者
export async function DELETE(request: NextRequest) {
  const body = await request.json();
  const { patient_id } = body;

  patients = patients.filter((p) => p.id !== patient_id);

  return NextResponse.json("delete success");
}
