"use client";

import { useState } from "react";

export type PatientSummary = {
  name: string;
  age: string;
  delikaiModeText: string;
  nicoletModeText: string;
  yldlModeText: string;
  patientId?: string;
  nglMode: string;
  dlkMode: string;
  yldlMode: string;
  alertWeights: {
    ngl: string;
    dlk: string;
    yldl: string;
  };
};

const nglModeLabels: Record<string, string> = {
  "1": "一电极",
  "2": "二电极",
  "3": "三电极",
  "4": "四电极",
};
const channelModeLabels: Record<string, string> = {
  "1": "单通道",
  "2": "双通道",
};

type AlertWeight = {
  ngl: string;
  dlk: string;
  yldl: string;
};

type PatientForm = {
  name: string;
  age: string;
  sex: "男" | "女";
  height: string;
  weight: string;
  phone: string;
  address: string;
  others: string;
  ngl: string;
  dlk: string;
  yldl: string;
  alert: AlertWeight;
};

const initialForm: PatientForm = {
  name: "张三",
  age: "18",
  sex: "男",
  height: "180",
  weight: "70",
  phone: "13800138000",
  address: "北京市海淀区",
  others: "备注",
  // 监护模式默认值
  ngl: "4", // 尼高力：四电极监护模式
  dlk: "2", // 德力凯：双通道
  yldl: "2", // 依露得力：双通道
  alert: {
    ngl: "5", // 尼高力预警权重
    dlk: "3", // 德力凯预警权重
    yldl: "2", // 依露得力预警权重
  },
};

type PatientInfoDialogProps = {
  onCompleted?: (summary: PatientSummary) => void;
};

export function PatientInfoDialog({ onCompleted }: PatientInfoDialogProps) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<PatientForm>(initialForm);
  const [buttonLabel, setButtonLabel] = useState("录入病人信息");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  function handleChange<K extends keyof PatientForm>(key: K, value: PatientForm[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleAlertChange(key: keyof AlertWeight, value: string) {
    setForm((prev) => ({ ...prev, alert: { ...prev.alert, [key]: value } }));
  }

  function validateField(field: string, value?: string) {
    const current = { ...form };
    if (value !== undefined) {
      if (field === "alertNgl" || field === "alertDlk" || field === "alertYldl") {
        const key = field === "alertNgl" ? "ngl" : field === "alertDlk" ? "dlk" : "yldl";
        current.alert = { ...current.alert, [key]: value };
      } else {
        (current as any)[field] = value;
      }
    }

    switch (field) {
      case "name":
        if (!current.name) return "请输入姓名。";
        return "";
      case "age": {
        if (!current.age) return "请输入年龄。";
        const num = Number(current.age);
        if (Number.isNaN(num) || num <= 0 || num > 120) {
          return "年龄请输入 1-120 的数字。";
        }
        return "";
      }
      case "sex":
        if (!current.sex) return "请选择性别。";
        return "";
      case "height": {
        if (!current.height) return "请输入身高。";
        const num = Number(current.height);
        if (Number.isNaN(num) || num < 30 || num > 250) {
          return "身高请输入 30-250 范围内的数字（单位 cm）。";
        }
        return "";
      }
      case "weight": {
        if (!current.weight) return "请输入体重。";
        const num = Number(current.weight);
        if (Number.isNaN(num) || num <= 0 || num > 300) {
          return "体重请输入 1-300 范围内的数字。";
        }
        return "";
      }
      case "phone": {
        if (!current.phone) return "请输入联系电话。";
        const phonePattern = /^1[3-9]\d{9}$/;
        if (!phonePattern.test(current.phone)) {
          return "联系电话格式不正确，请输入 11 位手机号。";
        }
        return "";
      }
      case "alertNgl": {
        const num = Number(current.alert.ngl);
        if (current.alert.ngl && Number.isNaN(num)) {
          return "尼高力预警权重请输入数字。";
        }
        return "";
      }
      case "alertDlk": {
        const num = Number(current.alert.dlk);
        if (current.alert.dlk && Number.isNaN(num)) {
          return "德力凯预警权重请输入数字。";
        }
        return "";
      }
      case "alertYldl": {
        const num = Number(current.alert.yldl);
        if (current.alert.yldl && Number.isNaN(num)) {
          return "依露得力预警权重请输入数字。";
        }
        return "";
      }
      default:
        return "";
    }
  }

  function runFieldValidation(field: string, value?: string) {
    const message = validateField(field, value);
    setErrors((prev) => ({ ...prev, [field]: message }));
    return message;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const fieldsToValidate = [
      "name",
      "age",
      "sex",
      "height",
      "weight",
      "phone",
      "alertNgl",
      "alertDlk",
      "alertYldl",
    ];

    const newErrors: Record<string, string> = {};
    fieldsToValidate.forEach((field) => {
      const msg = validateField(field);
      if (msg) {
        newErrors[field] = msg;
      }
    });

    if (Object.values(newErrors).some((m) => m)) {
      setErrors((prev) => ({ ...prev, ...newErrors }));
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/data/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          phone: form.phone,
          address: form.address,
          weight: form.weight,
          height: form.height,
          sex: form.sex,
          age: form.age,
          remark: form.others,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to register patient");
      }

      const patientId = await response.text();

      setButtonLabel(`${form.name} - ${form.age}岁 - ${form.sex}`);
      setOpen(false);
      onCompleted?.({
        name: form.name,
        age: form.age,
        delikaiModeText: channelModeLabels[form.dlk] ?? "--",
        nicoletModeText: nglModeLabels[form.ngl] ?? "--",
        yldlModeText: channelModeLabels[form.yldl] ?? "--",
        patientId,
        nglMode: form.ngl,
        dlkMode: form.dlk,
        yldlMode: form.yldl,
        alertWeights: {
          ngl: form.alert.ngl,
          dlk: form.alert.dlk,
          yldl: form.alert.yldl,
        },
      });
    } catch (error) {
      console.error("Failed to register patient:", error);
      setErrors((prev) => ({ ...prev, submit: "注册失败，请重试" }));
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleOpen() {
    // 每次打开时重置为默认配置
    setForm(initialForm);
    setErrors({});
    setOpen(true);
  }

  function handleClose() {
    setOpen(false);
  }

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        className="rounded-md bg-[#ff7f27] px-4 py-2 text-xs font-medium text-white shadow-sm transition hover:bg-[#f49b60]"
      >
        {buttonLabel}
      </button>

      {open && (
        <div className="fixed inset-0 z-40 flex items-start justify-center bg-black/70">
          <div className="mt-[6vh] w-[90vw] max-w-[46vw] rounded-lg bg-[#082a35] text-[#fff8e1] shadow-xl">
            <div className="flex items-start justify-between px-10 pt-10 pb-3">
              <div>
                <h2 className="text-[1.4em] font-bold">病人信息录入</h2>
              </div>
              <button
                type="button"
                onClick={handleClose}
                className="text-sm text-[#fff8e1]/70 hover:text-[#fff8e1]"
              >
                ✕
              </button>
            </div>

            <form className="space-y-4 px-10 pb-6 text-[13px]" onSubmit={handleSubmit}>
              {/* 第一排：姓名 / 年龄 / 性别 */}
              <div className="flex flex-wrap gap-6">
                <div className="min-w-[160px] flex-1 space-y-1">
                  <label className="block text-[12px] text-[#fff8e1]">
                    <span className="mr-1 text-[#ff7f27]">*</span>姓名
                  </label>
                  <input
                    className="h-8 w-full border-0 border-b border-[#2d5058] bg-[#082a35] px-0 text-[13px] text-[#fff8e1] outline-none focus:border-[#ff7f27]"
                    value={form.name}
                    onChange={(e) => handleChange("name", e.target.value)}
                    onBlur={() => runFieldValidation("name")}
                  />
                  {errors.name && (
                    <p className="mt-1 text-[11px] text-[#ff7f27]">{errors.name}</p>
                  )}
                </div>
                <div className="min-w-[160px] flex-1 space-y-1">
                  <label className="block text-[12px] text-[#fff8e1]">
                    <span className="mr-1 text-[#ff7f27]">*</span>年龄
                  </label>
                  <input
                    className="h-8 w-full border-0 border-b border-[#2d5058] bg-[#082a35] px-0 text-[13px] text-[#fff8e1] outline-none focus:border-[#ff7f27]"
                    value={form.age}
                    onChange={(e) => handleChange("age", e.target.value)}
                    onBlur={() => runFieldValidation("age")}
                  />
                  {errors.age && (
                    <p className="mt-1 text-[11px] text-[#ff7f27]">{errors.age}</p>
                  )}
                </div>
                <div className="min-w-[160px] flex-1 space-y-1">
                  <label className="block text-[12px] text-[#fff8e1]">
                    <span className="mr-1 text-[#ff7f27]">*</span>性别
                  </label>
                  <div className="mt-3 flex gap-6 text-[13px] text-[#fff8e1]">
                    <label className="flex items-center gap-1">
                      <input
                        type="radio"
                        name="sex"
                        value="男"
                        checked={form.sex === "男"}
                        onChange={() => {
                          handleChange("sex", "男");
                          runFieldValidation("sex", "男");
                        }}
                        className="h-3 w-3 accent-[#ff7f27]"
                      />
                      <span>男</span>
                    </label>
                    <label className="flex items-center gap-1">
                      <input
                        type="radio"
                        name="sex"
                        value="女"
                        checked={form.sex === "女"}
                        onChange={() => {
                          handleChange("sex", "女");
                          runFieldValidation("sex", "女");
                        }}
                        className="h-3 w-3 accent-[#ff7f27]"
                      />
                      <span>女</span>
                    </label>
                  </div>
                  {errors.sex && (
                    <p className="mt-1 text-[11px] text-[#ff7f27]">{errors.sex}</p>
                  )}
                </div>
              </div>

              {/* 第二排：身高 / 体重 / 联系电话 */}
              <div className="flex flex-wrap gap-6">
                <div className="min-w-[160px] flex-1 space-y-1">
                  <label className="block text-[12px] text-[#fff8e1]">
                    <span className="mr-1 text-[#ff7f27]">*</span>身高(cm)
                  </label>
                  <input
                    className="h-8 w-full border-0 border-b border-[#2d5058] bg-[#082a35] px-0 text-[13px] text-[#fff8e1] outline-none focus:border-[#ff7f27]"
                    value={form.height}
                    onChange={(e) => handleChange("height", e.target.value)}
                    onBlur={() => runFieldValidation("height")}
                  />
                  {errors.height && (
                    <p className="mt-1 text-[11px] text-[#ff7f27]">{errors.height}</p>
                  )}
                </div>
                <div className="min-w-[160px] flex-1 space-y-1">
                  <label className="block text-[12px] text-[#fff8e1]">
                    <span className="mr-1 text-[#ff7f27]">*</span>体重(kg)
                  </label>
                  <input
                    className="h-8 w-full border-0 border-b border-[#2d5058] bg-[#082a35] px-0 text-[13px] text-[#fff8e1] outline-none focus:border-[#ff7f27]"
                    value={form.weight}
                    onChange={(e) => handleChange("weight", e.target.value)}
                    onBlur={() => runFieldValidation("weight")}
                  />
                  {errors.weight && (
                    <p className="mt-1 text-[11px] text-[#ff7f27]">{errors.weight}</p>
                  )}
                </div>
                <div className="min-w-[160px] flex-1 space-y-1">
                  <label className="block text-[12px] text-[#fff8e1]">
                    <span className="mr-1 text-[#ff7f27]">*</span>联系电话
                  </label>
                  <input
                    className="h-8 w-full border-0 border-b border-[#2d5058] bg-[#082a35] px-0 text-[13px] text-[#fff8e1] outline-none focus:border-[#ff7f27]"
                    value={form.phone}
                    onChange={(e) => handleChange("phone", e.target.value)}
                    onBlur={() => runFieldValidation("phone")}
                  />
                  {errors.phone && (
                    <p className="mt-1 text-[11px] text-[#ff7f27]">{errors.phone}</p>
                  )}
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-[12px] text-[#fff8e1]">
                  家庭住址
                </label>
                <input
                  className="h-8 w-full border-0 border-b border-[#2d5058] bg-[#082a35] px-0 text-[13px] text-[#fff8e1] outline-none focus:border-[#ff7f27]"
                  value={form.address}
                  onChange={(e) => handleChange("address", e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[12px] text-[#fff8e1]">
                  备注
                </label>
                <textarea
                  rows={2}
                  className="w-full border border-[#2d5058] bg-[#082a35] px-2 py-2 text-[13px] text-[#fff8e1] outline-none focus:border-[#ff7f27]"
                  value={form.others}
                  onChange={(e) => handleChange("others", e.target.value)}
                />
              </div>

              <div className="space-y-3">
                <h3 className="text-[12px] font-medium text-[#fff8e1]">
                  监护模式与预警权重
                </h3>

                <div className="grid gap-8 md:grid-cols-2">
                  {/* 左列：监护模式 */}
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <label className="block text-[12px] text-[#fff8e1]">
                        尼高力
                      </label>
                      <select
                        className="h-8 w-full border-0 border-b border-[#2d5058] bg-[#082a35] px-0 text-[13px] text-[#fff8e1] outline-none focus:border-[#ff7f27]"
                        value={form.ngl}
                        onChange={(e) => handleChange("ngl", e.target.value)}
                      >
                        <option value="">请选择监护模式</option>
                        <option value="1">一电极监护模式</option>
                        <option value="2">二电极监护模式</option>
                        <option value="3">三电极监护模式</option>
                        <option value="4">四电极监护模式</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[12px] text-[#fff8e1]">德力凯</label>
                      <select
                        className="h-8 w-full border-0 border-b border-[#2d5058] bg-[#082a35] px-0 text-[13px] text-[#fff8e1] outline-none focus:border-[#ff7f27]"
                        value={form.dlk}
                        onChange={(e) => handleChange("dlk", e.target.value)}
                      >
                        <option value="">请选择监护模式</option>
                        <option value="1">单通道监护模式</option>
                        <option value="2">双通道监护模式</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[12px] text-[#fff8e1]">依露得力</label>
                      <select
                        className="h-8 w-full border-0 border-b border-[#2d5058] bg-[#082a35] px-0 text-[13px] text-[#fff8e1] outline-none focus:border-[#ff7f27]"
                        value={form.yldl}
                        onChange={(e) => handleChange("yldl", e.target.value)}
                      >
                        <option value="">请选择监护模式</option>
                        <option value="1">单通道监护模式</option>
                        <option value="2">双通道监护模式</option>
                      </select>
                    </div>
                  </div>

                  {/* 右列：对应预警权重 */}
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <label className="block text-[12px] text-[#fff8e1]">
                        尼高力预警权重
                      </label>
                      <input
                        type="number"
                        className="h-8 w-full border-0 border-b border-[#2d5058] bg-[#082a35] px-0 text-[13px] text-[#fff8e1] outline-none focus:border-[#ff7f27]"
                        value={form.alert.ngl}
                        onChange={(e) => handleAlertChange("ngl", e.target.value)}
                        onBlur={() => runFieldValidation("alertNgl")}
                      />
                      {errors.alertNgl && (
                        <p className="mt-1 text-[11px] text-[#ff7f27]">{errors.alertNgl}</p>
                      )}
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[12px] text-[#fff8e1]">
                        德力凯预警权重
                      </label>
                      <input
                        type="number"
                        className="h-8 w-full border-0 border-b border-[#2d5058] bg-[#082a35] px-0 text-[13px] text-[#fff8e1] outline-none focus:border-[#ff7f27]"
                        value={form.alert.dlk}
                        onChange={(e) => handleAlertChange("dlk", e.target.value)}
                        onBlur={() => runFieldValidation("alertDlk")}
                      />
                      {errors.alertDlk && (
                        <p className="mt-1 text-[11px] text-[#ff7f27]">{errors.alertDlk}</p>
                      )}
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[12px] text-[#fff8e1]">
                        依露得力预警权重
                      </label>
                      <input
                        type="number"
                        className="h-8 w-full border-0 border-b border-[#2d5058] bg-[#082a35] px-0 text-[13px] text-[#fff8e1] outline-none focus:border-[#ff7f27]"
                        value={form.alert.yldl}
                        onChange={(e) => handleAlertChange("yldl", e.target.value)}
                        onBlur={() => runFieldValidation("alertYldl")}
                      />
                      {errors.alertYldl && (
                        <p className="mt-1 text-[11px] text-[#ff7f27]">{errors.alertYldl}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-4 flex justify-end pt-2">
                <button
                  type="button"
                  onClick={handleClose}
                  className="mr-4 h-8 rounded-full border border-[#2d5058] px-6 text-xs text-[#fff8e1]/80 hover:bg-[#082a35]"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="h-8 rounded-full bg-[#ff7f27] px-8 text-xs font-medium text-white hover:bg-[#f49b60]"
                >
                  保存
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

