"use client";

import { useState, useEffect } from "react";

// 患者类型定义
interface Patient {
  id: string;
  name: string;
  age: number;
  sex: string;
  height: number;
  weight: number;
  address: string;
  phone: string;
  remark: string;
}

// 记录类型定义
interface Record {
  id: string;
  patient_id: string;
  patient_name: string;
  delicaMode: string;
  nicoletMode: string;
  gloryMode: string;
  collectDateTime: string;
  endDateTime: string;
  remark: string;
}

export default function RecordPage() {
  const transferElectrode = (value: string) => {
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
  };

  const transferChannel = (value: string) => {
    switch (value) {
      case "Single channel mode":
        return "单通道";
      case "Two channel mode":
        return "双通道";
      default:
        return "未知通道";
    }
  };

  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [records, setRecords] = useState<Record[]>([]);
  const [searchName, setSearchName] = useState("");
  const [editingRemark, setEditingRemark] = useState<string | null>(null);
  const [remarkValue, setRemarkValue] = useState("");
  const [loading, setLoading] = useState(false);

  // 患者编辑状态
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
  const [patientForm, setPatientForm] = useState({
    name: "",
    age: 0,
    sex: "",
    height: 0,
    weight: 0,
    address: "",
    phone: "",
    remark: "",
  });

  // 获取患者列表
  const fetchPatients = async () => {
    try {
      const params = new URLSearchParams();
      if (searchName) {
        params.set("name", searchName);
      }
      const res = await fetch(`/api/patients?${params}`);
      const data = await res.json();
      setPatients(data);
    } catch (error) {
      console.error("获取患者列表失败:", error);
    }
  };

  // 获取记录列表
  const fetchRecords = async (patientId: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/records?patient_id=${patientId}`);
      const data = await res.json();
      setRecords(data);
    } catch (error) {
      console.error("获取记录列表失败:", error);
    } finally {
      setLoading(false);
    }
  };

  // 初始加载患者列表
  useEffect(() => {
    fetchPatients();
  }, []);

  // 搜索患者
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchPatients();
    }, 300);
    return () => clearTimeout(timer);
  }, [searchName]);

  // 选中患者时获取记录
  useEffect(() => {
    if (selectedPatient) {
      fetchRecords(selectedPatient.id);
    } else {
      setRecords([]);
    }
  }, [selectedPatient]);

  // 处理患者选择
  const handleSelectPatient = (patient: Patient) => {
    setSelectedPatient(patient);
  };

  // 开始编辑备注
  const handleStartEditRemark = (record: Record) => {
    setEditingRemark(record.id);
    setRemarkValue(record.remark);
  };

  // 保存备注
  const handleSaveRemark = async (recordId: string) => {
    try {
      const res = await fetch("/api/records/remark", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ record_id: recordId, remark: remarkValue }),
      });
      if (res.ok) {
        const updatedRecord = await res.json();
        setRecords((prev) =>
          prev.map((r) => (r.id === recordId ? { ...r, remark: updatedRecord.remark } : r))
        );
      }
    } catch (error) {
      console.error("保存备注失败:", error);
    } finally {
      setEditingRemark(null);
      setRemarkValue("");
    }
  };

  // 取消编辑备注
  const handleCancelEditRemark = () => {
    setEditingRemark(null);
    setRemarkValue("");
  };

  // 删除记录
  const handleDeleteRecord = async (recordId: string) => {
    if (!confirm("确定要删除这条记录吗？")) return;

    try {
      const res = await fetch("/api/records", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ record_id: recordId }),
      });
      if (res.ok) {
        setRecords((prev) => prev.filter((r) => r.id !== recordId));
      }
    } catch (error) {
      console.error("删除记录失败:", error);
    }
  };

  // 刷新当前患者记录
  const handleRefresh = () => {
    if (selectedPatient) {
      fetchRecords(selectedPatient.id);
    }
  };

  // 开始编辑患者
  const handleStartEditPatient = (patient: Patient) => {
    setEditingPatient(patient);
    setPatientForm({
      name: patient.name,
      age: patient.age,
      sex: patient.sex,
      height: patient.height,
      weight: patient.weight,
      address: patient.address,
      phone: patient.phone,
      remark: patient.remark,
    });
  };

  // 取消编辑患者
  const handleCancelEditPatient = () => {
    setEditingPatient(null);
    setPatientForm({
      name: "",
      age: 0,
      sex: "",
      height: 0,
      weight: 0,
      address: "",
      phone: "",
      remark: "",
    });
  };

  // 保存患者信息
  const handleSavePatient = async () => {
    if (!editingPatient) return;

    try {
      const res = await fetch("/api/patients", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ patient_id: editingPatient.id, ...patientForm }),
      });

      if (res.ok) {
        const updatedPatient = await res.json();
        setPatients((prev) =>
          prev.map((p) => (p.id === editingPatient.id ? updatedPatient : p))
        );
        setSelectedPatient(updatedPatient);
        setEditingPatient(null);
          setPatientForm({
            name: "",
            age: 0,
            sex: "",
            height: 0,
            weight: 0,
            address: "",
            phone: "",
            remark: "",
          });
      }
    } catch (error) {
      console.error("保存患者信息失败:", error);
    }
  };

  // 删除患者
  const handleDeletePatient = async (patientId: string) => {
    if (!confirm("确定要删除该患者吗？删除后该患者的所有记录也会被删除。")) return;

    try {
      const res = await fetch("/api/patients", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ patient_id: patientId }),
      });

      if (res.ok) {
        setPatients((prev) => prev.filter((p) => p.id !== patientId));
        if (selectedPatient?.id === patientId) {
          setSelectedPatient(null);
          setRecords([]);
        }
      }
    } catch (error) {
      console.error("删除患者失败:", error);
    }
  };

  return (
    <div className="h-full w-full bg-dashboard-bg px-6 py-6">
      <div className="mx-auto flex h-full max-w-7xl flex-col">
        <div className="mb-5 flex items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-dashboard-text">
              患者信息与记录管理
            </h1>
            <p className="mt-1 text-sm text-dashboard-muted">
              先选择患者，再查看/维护该患者的记录（备注支持编辑）。
            </p>
          </div>
          <div className="flex items-center gap-2 text-sm text-dashboard-muted">
            <span className="rounded-full border border-dashboard-border bg-dashboard-panel px-3 py-1">
              患者 {patients.length}
            </span>
            <span className="rounded-full border border-dashboard-border bg-dashboard-panel px-3 py-1">
              记录 {selectedPatient ? records.length : 0}
            </span>
          </div>
        </div>

        <div className="grid flex-1 grid-cols-12 gap-4 overflow-hidden">
        {/* 左侧患者列表 */}
          <div className="col-span-12 flex flex-col overflow-hidden rounded-xl border border-dashboard-border bg-dashboard-panel shadow-[0_0_0_1px_rgba(255,255,255,0.02)] md:col-span-5">
            <div className="border-b border-dashboard-border p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-medium text-dashboard-text">患者</div>
                  <div className="mt-0.5 text-xs text-dashboard-muted">点击选择患者查看记录</div>
                </div>
                <span className="rounded-full border border-dashboard-border bg-dashboard-bg px-2.5 py-1 text-xs text-dashboard-muted">
                  共 {patients.length} 人
                </span>
              </div>
              <div className="relative mt-3">
                <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-dashboard-muted">
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-4.35-4.35m1.85-5.15a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder="按姓名搜索…"
                  value={searchName}
                  onChange={(e) => setSearchName(e.target.value)}
                  className="w-full rounded-lg border border-dashboard-border bg-dashboard-bg py-2 pl-9 pr-3 text-sm text-dashboard-text placeholder-dashboard-muted outline-none focus:border-dashboard-accent"
                />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto">
              {patients.length === 0 ? (
                <div className="p-6 text-center text-sm text-dashboard-muted">暂无患者数据</div>
              ) : (
                <ul className="divide-y divide-dashboard-border">
                  {patients.map((patient) => (
                    <li
                      key={patient.id}
                      onClick={() => handleSelectPatient(patient)}
                      className={`group cursor-pointer px-4 py-3 transition-colors ${
                        selectedPatient?.id === patient.id
                          ? "bg-dashboard-accent/15"
                          : "hover:bg-dashboard-border/20"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border text-dashboard-text ${
                            selectedPatient?.id === patient.id
                              ? "border-dashboard-accent bg-dashboard-accent/15"
                              : "border-dashboard-border bg-dashboard-bg"
                          }`}
                        >
                          <span className="text-sm font-semibold">{patient.name.charAt(0)}</span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <div className="truncate text-sm font-medium text-dashboard-text">
                              {patient.name}
                            </div>
                            <span className="rounded border border-dashboard-border bg-dashboard-bg px-1.5 py-0.5 text-[11px] text-dashboard-muted">
                              {patient.id}
                            </span>
                          </div>
                          <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-dashboard-muted">
                            <span>{patient.sex}</span>
                            <span>{patient.age} 岁</span>
                            <span>{patient.height} cm</span>
                            <span>{patient.weight} kg</span>
                          </div>
                        </div>
                        <div className="flex gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100"> 
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeletePatient(patient.id);
                            }}
                            className="rounded-md border border-dashboard-border bg-dashboard-bg p-1.5 text-dashboard-muted hover:border-red-400 hover:text-red-400"
                            title="删除"
                          >
                            <svg
                              className="h-4 w-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                              />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

        {/* 右侧记录列表 */}
          <div className="col-span-12 flex flex-col overflow-hidden rounded-xl border border-dashboard-border bg-dashboard-panel shadow-[0_0_0_1px_rgba(255,255,255,0.02)] md:col-span-7">
            {selectedPatient ? (
              <>
                {/* 患者信息头部 */}
                <div className="border-b border-dashboard-border p-4">
                {editingPatient ? (
                  /* 编辑模式 */
                  <div className="space-y-3">
                    <h2 className="text-lg font-medium text-dashboard-text">编辑患者信息</h2>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-sm text-dashboard-muted">姓名</label>
                        <input
                          type="text"
                          value={patientForm.name}
                          onChange={(e) => setPatientForm({ ...patientForm, name: e.target.value })}
                          className="w-full px-3 py-1.5 bg-dashboard-bg border border-dashboard-border rounded text-dashboard-text text-sm focus:outline-none focus:border-dashboard-accent"
                        />
                      </div>
                      <div>
                        <label className="text-sm text-dashboard-muted">年龄</label>
                        <input
                          type="number"
                          value={patientForm.age}
                          onChange={(e) => setPatientForm({ ...patientForm, age: parseInt(e.target.value) || 0 })}
                          className="w-full px-3 py-1.5 bg-dashboard-bg border border-dashboard-border rounded text-dashboard-text text-sm focus:outline-none focus:border-dashboard-accent"
                        />
                      </div>
                      <div>
                        <label className="text-sm text-dashboard-muted">身高 (cm)</label>
                        <input
                          type="number"
                          value={patientForm.height}
                          onChange={(e) =>
                            setPatientForm({ ...patientForm, height: parseInt(e.target.value) || 0 })
                          }
                          className="w-full px-3 py-1.5 bg-dashboard-bg border border-dashboard-border rounded text-dashboard-text text-sm focus:outline-none focus:border-dashboard-accent"
                        />
                      </div>
                      <div>
                        <label className="text-sm text-dashboard-muted">体重 (kg)</label>
                        <input
                          type="number"
                          value={patientForm.weight}
                          onChange={(e) =>
                            setPatientForm({ ...patientForm, weight: parseInt(e.target.value) || 0 })
                          }
                          className="w-full px-3 py-1.5 bg-dashboard-bg border border-dashboard-border rounded text-dashboard-text text-sm focus:outline-none focus:border-dashboard-accent"
                        />
                      </div>
                      <div>
                        <label className="text-sm text-dashboard-muted">性别</label>
                        <select
                          value={patientForm.sex}
                          onChange={(e) => setPatientForm({ ...patientForm, sex: e.target.value })}
                          className="w-full px-3 py-1.5 bg-dashboard-bg border border-dashboard-border rounded text-dashboard-text text-sm focus:outline-none focus:border-dashboard-accent"
                        >
                          <option value="">请选择</option>
                          <option value="男">男</option>
                          <option value="女">女</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-sm text-dashboard-muted">电话</label>
                        <input
                          type="text"
                          value={patientForm.phone}
                          onChange={(e) => setPatientForm({ ...patientForm, phone: e.target.value })}
                          className="w-full px-3 py-1.5 bg-dashboard-bg border border-dashboard-border rounded text-dashboard-text text-sm focus:outline-none focus:border-dashboard-accent"
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="text-sm text-dashboard-muted">地址</label>
                        <input
                          type="text"
                          value={patientForm.address}
                          onChange={(e) => setPatientForm({ ...patientForm, address: e.target.value })}
                          className="w-full px-3 py-1.5 bg-dashboard-bg border border-dashboard-border rounded text-dashboard-text text-sm focus:outline-none focus:border-dashboard-accent"
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="text-sm text-dashboard-muted">备注</label>
                        <input
                          type="text"
                          value={patientForm.remark}
                          onChange={(e) => setPatientForm({ ...patientForm, remark: e.target.value })}
                          className="w-full px-3 py-1.5 bg-dashboard-bg border border-dashboard-border rounded text-dashboard-text text-sm focus:outline-none focus:border-dashboard-accent"
                        />
                      </div>
                    </div>
                    <div className="flex gap-2 justify-end">
                      <button
                        onClick={handleCancelEditPatient}
                        className="px-3 py-1.5 text-dashboard-muted hover:text-dashboard-text text-sm"
                      >
                        取消
                      </button>
                      <button
                        onClick={handleSavePatient}
                        className="px-3 py-1.5 bg-dashboard-accent text-white rounded text-sm hover:bg-dashboard-accent/80"
                      >
                        保存
                      </button>
                    </div>
                  </div>
                ) : (
                  /* 查看模式 */
                  <div className="flex items-center justify-between">
                    <div>
                        <div className="flex items-center gap-2">
                          <h2 className="text-lg font-medium text-dashboard-text">
                            {selectedPatient.name}
                          </h2>
                          <span className="rounded-md border border-dashboard-border bg-dashboard-bg px-2 py-0.5 text-xs text-dashboard-muted">
                            {selectedPatient.id}
                          </span>
                        </div>
                        <div className="mt-2 flex flex-wrap gap-2 text-xs text-dashboard-muted">
                          <span className="rounded-md border border-dashboard-border bg-dashboard-bg px-2 py-1">
                            {selectedPatient.sex}
                          </span>
                          <span className="rounded-md border border-dashboard-border bg-dashboard-bg px-2 py-1">
                            {selectedPatient.age} 岁
                          </span>
                          <span className="rounded-md border border-dashboard-border bg-dashboard-bg px-2 py-1">
                            {selectedPatient.height} cm
                          </span>
                          <span className="rounded-md border border-dashboard-border bg-dashboard-bg px-2 py-1">
                            {selectedPatient.weight} kg
                          </span>
                        </div>
                        <div className="mt-2 text-sm text-dashboard-muted">
                          {selectedPatient.address} · {selectedPatient.phone}
                        </div>
                      {selectedPatient.remark && (
                        <p className="text-sm text-dashboard-accent mt-1">
                          备注：{selectedPatient.remark}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleStartEditPatient(selectedPatient)}
                        className="rounded-lg border border-dashboard-border bg-dashboard-bg px-3 py-2 text-sm text-dashboard-muted hover:border-dashboard-accent hover:text-dashboard-accent"
                      >
                        编辑患者
                      </button>
                      <button
                        onClick={handleRefresh}
                        className="rounded-lg bg-dashboard-accent px-3 py-2 text-sm font-medium text-white hover:bg-dashboard-accent/85"
                      >
                        刷新
                      </button>
                    </div>
                  </div>
                )}
              </div>
              <div className="flex-1 overflow-y-auto p-4">
                {loading ? (
                  <div className="text-center text-dashboard-muted py-8">加载中...</div>
                ) : records.length === 0 ? (
                  <div className="text-center text-dashboard-muted py-8">暂无记录</div>
                ) : (
                  <div className="space-y-3">
                    {records.map((record) => (
                      <div
                        key={record.id}
                        className="rounded-xl border border-dashboard-border bg-dashboard-bg p-4 transition-colors hover:border-dashboard-accent/60"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <div className="text-dashboard-text font-medium">记录</div>
                            <span className="rounded-md border border-dashboard-border bg-dashboard-panel px-2 py-0.5 text-xs text-dashboard-muted">
                              {record.id}
                            </span>
                          </div>
                          <button
                            onClick={() => handleDeleteRecord(record.id)}
                            className="rounded-lg border border-dashboard-border bg-dashboard-panel px-2.5 py-1.5 text-sm text-dashboard-muted hover:border-red-400 hover:text-red-400"
                          >
                            删除
                          </button>
                        </div>
                        <div className="grid grid-cols-2 gap-3 text-sm mb-3">
                          <div>
                            <span className="text-dashboard-muted">采集时间：</span>
                            <span className="text-dashboard-text">{record.collectDateTime}</span>
                          </div>
                          <div>
                            <span className="text-dashboard-muted">结束时间：</span>
                            <span className="text-dashboard-text">{record.endDateTime}</span>
                          </div>
                          <div>
                            <span className="text-dashboard-muted">Delica模式：</span>
                            <span className="text-dashboard-text">
                              {transferElectrode(record.delicaMode)}
                            </span>
                          </div>
                          <div>
                            <span className="text-dashboard-muted">Nicolet模式：</span>
                            <span className="text-dashboard-text">
                              {transferChannel(record.nicoletMode)}
                            </span>
                          </div>
                          <div>
                            <span className="text-dashboard-muted">Glory模式：</span>
                            <span className="text-dashboard-text">
                              {transferElectrode(record.gloryMode)}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-dashboard-muted text-sm">备注：</span>
                          {editingRemark === record.id ? (
                            <div className="flex items-center gap-2 flex-1">
                              <input
                                type="text"
                                value={remarkValue}
                                onChange={(e) => setRemarkValue(e.target.value)}
                                className="flex-1 rounded-lg border border-dashboard-border bg-dashboard-panel px-3 py-2 text-sm text-dashboard-text outline-none focus:border-dashboard-accent"
                                autoFocus
                              />
                              <button
                                onClick={() => handleSaveRemark(record.id)}
                                className="rounded-lg bg-dashboard-accent px-3 py-2 text-sm font-medium text-white hover:bg-dashboard-accent/85"
                              >
                                保存
                              </button>
                              <button
                                onClick={handleCancelEditRemark}
                                className="rounded-lg border border-dashboard-border bg-dashboard-panel px-3 py-2 text-sm text-dashboard-muted hover:text-dashboard-text"
                              >
                                取消
                              </button>
                            </div>
                          ) : (
                            <span
                              onClick={() => handleStartEditRemark(record)}
                              className="cursor-pointer rounded-lg border border-transparent px-2 py-1 text-sm text-dashboard-text hover:border-dashboard-accent/60 hover:text-dashboard-accent"
                            >
                              {record.remark || "点击添加备注"}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl border border-dashboard-border bg-dashboard-bg text-dashboard-muted">
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4a4 4 0 100 8 4 4 0 000-8zM6 20a6 6 0 0112 0"
                    />
                  </svg>
                </div>
                <p className="mt-3 text-sm text-dashboard-muted">请选择一个患者查看其记录</p>
              </div>
            </div>
          )}
        </div>
        </div>
      </div>
    </div>
  );
}
