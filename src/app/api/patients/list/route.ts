import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Mock 患者数据
const patients = [
  { id: "P001", name: "张三", age: 45, sex: "男", address: "北京市朝阳区", phone: "13800138000", remark: "高血压" },
  { id: "P002", name: "李四", age: 52, sex: "女", address: "上海市浦东新区", phone: "13900139000", remark: "糖尿病" },
  { id: "P003", name: "王五", age: 38, sex: "男", address: "广州市天河区", phone: "13700137000", remark: "冠心病" },
];

// GET - 获取所有患者信息
export async function GET() {
  return NextResponse.json(patients);
}
