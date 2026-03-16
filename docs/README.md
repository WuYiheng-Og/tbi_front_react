# TBI 多模态监测系统

本项目是一个基于 Web 的 TBI (创伤性脑损伤) 多模态可视化监测系统，支持实时脑电(EEG)、脑氧(NIRS)、脑血流(CBF)等生理参数的可视化展示与数据分析。

## 项目概述

该系统主要用于医疗机构对 TBI 患者进行多模态生理参数监测，具备以下核心功能：

- **患者管理**：新增、编辑、搜索、删除患者信息
- **实时监测**：通过 WebSocket 实时接收并展示 EEG、NIRS、CBF 数据
- **数据记录**：记录采集过程，支持备注编辑与历史回放
- **预测分析**：基于实时数据进行状态预测（清醒/昏迷等）
- **预警系统**：根据预设权重计算综合评分，异常时发出预警

## 技术栈

### 前端


| 技术                | 版本      | 说明               |
| ----------------- | ------- | ---------------- |
| Next.js           | 16.1.6  | React 全栈框架       |
| React             | 19.2.3  | UI 库             |
| TypeScript        | 5.x     | 类型安全             |
| Tailwind CSS      | 4.x     | 样式框架             |
| ECharts           | 6.0.0   | 图表可视化            |
| echarts-for-react | 3.0.6   | React ECharts 封装 |
| Lucide React      | 0.577.0 | 图标库              |


### 后端


| 技术                 | 说明          |
| ------------------ | ----------- |
| Next.js API Routes | 前后一体 API 服务 |
| WebSocket          | 实时数据推送      |


### 开发工具


| 技术        | 说明                |
| --------- | ----------------- |
| tsx       | TypeScript 执行器    |
| ESLint    | 代码检查              |
| Turbopack | 快速构建 (Next.js 16) |


## 项目结构

```
tbi-front/
├── docs/                      # 项目文档
├── scripts/                   # 脚本文件
│   ├── ws-beike-server.ts    # WebSocket 服务器（模拟数据）
│   └── ws-mock-data.ts       # 模拟数据生成器
├── src/
│   ├── app/                  # Next.js App Router（Mock后端数据）
│   │   ├── api/              # API 路由
│   │   │   ├── patients/     # 患者管理 API
│   │   │   ├── records/      # 记录管理 API
│   │   │   ├── start/        # 开始采集 API
│   │   │   ├── stop/         # 停止采集 API
│   │   │   ├── prediction/   # 预测分析 API
│   │   │   ├── feedback/     # 用户反馈 API
│   │   │   └── register/     # 患者注册 API
│   │   ├── record/           # 记录回放页面
│   │   ├── layout.tsx        # 根布局
│   │   ├── page.tsx          # 首页（监测面板）
│   │   └── globals.css       # 全局样式
│   ├── components/           # React 组件
│   │   ├── alert-card.tsx    # 预警卡片
│   │   ├── cbf-panel.tsx    # 脑血流面板
│   │   ├── control-panel.tsx # 控制面板
│   │   ├── eeg-panel.tsx    # 脑电面板
│   │   ├── nirs-panel.tsx   # 脑氧面板
│   │   ├── patient-badge.tsx      # 患者标签
│   │   ├── patient-info-dialog.tsx # 患者信息对话框
│   │   ├── prediction-dialog.tsx  # 预测结果对话框
│   │   ├── score-panel.tsx  # 评分面板
│   │   ├── sidebar.tsx      # 侧边导航
│   │   └── total-score-card.tsx # 总分卡片
│   ├── hooks/                # 自定义 Hooks
│   │   ├── use-data-buffer.ts    # 数据缓冲区
│   │   ├── use-data-stream.ts    # 实时数据流
│   │   ├── use-rbp-fetcher.ts    # RBP 数据获取
│   │   └── use-early-warning-fetcher.ts # 预警数据获取
│   └── ...
├── package.json
├── tsconfig.json
├── next.config.ts
└── README.md
```

## 核心功能模块

### 1. 患者管理模块

位于 `/api/patients` 路由，提供患者信息的 CRUD 操作：

- **患者列表**：获取所有患者，支持模糊搜索
- **新增患者**：创建新患者记录
- **编辑患者**：修改患者信息
- **删除患者**：删除患者及其相关记录

### 2. 采集控制模块

位于 `/api/start` 和 `/api/stop` 路由：

- **开始采集**：初始化采集会话，记录患者 ID 和设备模式配置
- **停止采集**：结束采集会话，返回采集结果状态

### 3. 记录管理模块

位于 `/api/records` 路由：

- **记录列表**：按条件查询采集记录
- **备注编辑**：修改记录备注
- **删除记录**：删除指定记录

### 4. 实时监测模块

使用 WebSocket 实时推送数据：


| 端点                   | 频率   | 数据类型              |
| -------------------- | ---- | ----------------- |
| `/ws/beike/`         | 60Hz | EEG、NIRS、CBF 原始数据 |
| `/ws/rbp/`           | 15s  | RBP 脑血流参数         |
| `/ws/early_warning/` | 15s  | 综合评分与预警           |


### 5. 预测分析模块

位于 `/api/prediction` 路由：

- 接收患者 UUID
- 返回状态预测结果（清醒/昏迷等）

## API 接口文档

### 患者管理

#### 获取患者列表（用于搜索）

```
GET /api/patients
```

查询参数：


| 参数         | 类型     | 说明          |
| ---------- | ------ | ----------- |
| patient_id | string | 患者 ID（模糊匹配） |
| name       | string | 姓名（模糊匹配）    |
| age        | string | 年龄          |
| sex        | string | 性别          |
| height     | string | 身高          |
| weight     | string | 体重          |
| address    | string | 地址          |
| phone      | string | 电话          |
| remark     | string | 备注          |


响应示例：

```json
[
  {
    "id": "P001",
    "name": "张三",
    "age": 45,
    "sex": "男",
    "height": 172,
    "weight": 78,
    "address": "北京市朝阳区",
    "phone": "13800138000",
    "remark": "高血压"
  }
]
```

#### 获取患者列表（简化）

```
GET /api/patients/list
```

无查询参数，返回所有患者列表。

#### 新增患者

```
POST /api/register
```

请求体：

```json
{
  "name": "张三",
  "phone": "13800138000",
  "address": "北京市朝阳区",
  "weight": 78,
  "height": 172,
  "sex": "男",
  "age": 45,
  "remark": "高血压"
}
```

响应：返回患者 UUID（纯文本）

#### 修改患者信息

```
PUT /api/patients
```

请求体：

```json
{
  "patient_id": "P001",
  "name": "张三",
  "age": 46,
  ...
}
```

#### 删除患者

```
DELETE /api/patients
```

请求体：

```json
{
  "patient_id": "P001"
}
```

---

### 记录管理

#### 获取记录列表

```
GET /api/records
```

查询参数：


| 参数               | 类型     | 说明         |
| ---------------- | ------ | ---------- |
| patient_id       | string | 患者 ID      |
| name             | string | 患者姓名       |
| sex              | string | 性别         |
| delica_mode      | string | Delica 模式  |
| nicolet_mode     | string | Nicolet 模式 |
| glory_mode       | string | Glory 模式   |
| collect_datetime | string | 采集时间       |
| end_datetime     | string | 结束时间       |


响应示例：

```json
[
  {
    "id": "R001",
    "patient_id": "P001",
    "patient_name": "张三",
    "sex": "男",
    "delicaMode": "Two channel mode",
    "nicoletMode": "Four electrode mode",
    "gloryMode": "Two channel mode",
    "collectDateTime": "2024-01-15 10:30:00",
    "endDateTime": "2024-01-15 11:30:00",
    "remark": "正常采集"
  }
]
```

#### 修改记录备注

```
PUT /api/records/remark
```

请求体：

```json
{
  "record_id": "R001",
  "remark": "采集顺利完成"
}
```

#### 删除记录

```
DELETE /api/records
```

请求体：

```json
{
  "record_id": "R001"
}
```

---

### 采集控制

#### 开始采集

```
POST /api/start
```

请求体：

```json
{
  "NicoletMode": "4",
  "DelicaMode": "1",
  "GloryMode": "1",
  "id": "P001"
}
```

响应：返回记录 UUID（纯文本）

#### 停止采集

```
POST /api/stop
```

请求体：

```json
{
  "record_id": "R001"
}
```

响应：

```json
{
  "state": 1,
  "msg": "采集成功完成"
}
```

---

### 预测与分析

#### 状态预测

```
POST /api/prediction
```

请求体：

```json
{
  "uuid": "patient-uuid-12345"
}
```

响应：

```json
{
  "state": 1,
  "data": ["清醒", "清醒", "昏迷"],
  "message": "预测成功"
}
```

#### 用户反馈

```
POST /api/feedback
```

请求体：

```json
{
  "uuid": "patient-uuid-12345",
  "feedback": "用户反馈内容"
}
```

响应：

```json
{
  "state": 1,
  "message": "反馈提交成功"
}
```

---

## 环境配置

### 环境变量

在项目根目录下创建 `.env.local` 文件：

```bash
# 生产环境
# NEXT_PUBLIC_API_BASE_URL=http://localhost:8000/data 
# NEXT_PUBLIC_WS_URL=ws://127.0.0.1:8000

# 开发环境
NEXT_PUBLIC_API_BASE_URL=/api
NEXT_PUBLIC_WS_URL=ws://localhost:8081
```

### 开发环境配置

1. 安装依赖：

```bash
npm install
```

1. 启动 Next.js 开发服务器：

```bash
npm run dev
```

1. 启动 WebSocket 模拟服务器（另一终端）：

```bash
npx tsx scripts/ws-beike-server.ts
```

访问地址：

- 全栈应用：`http://localhost:3000`
- WebSocket 服务器：`ws://localhost:8081`

### 生产环境构建

```bash
# Step1：修改.env.local 文件的环境变量
# 生产环境
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000/data 
NEXT_PUBLIC_WS_URL=ws://127.0.0.1:8000

# Step2：启动前端项目
npm run dev

# Step3：启动后端项目（略）
```

---

## 开发规范

### 代码规范

1. **TypeScript**：所有新增代码必须使用 TypeScript，启用严格模式
2. **组件规范**：
  - 使用函数式组件
  - 使用 Hooks 管理状态
  - 组件文件使用 PascalCase 命名
3. **样式规范**：
  - 使用 Tailwind CSS
  - 自定义样式放在 `globals.css` 或组件内
  - 使用 CSS 变量管理主题色

### Git 提交规范

使用 Conventional Commits 格式：

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

类型说明：

- `feat`: 新功能
- `fix`: Bug 修复
- `docs`: 文档更新
- `style`: 代码格式
- `refactor`: 重构
- `test`: 测试
- `chore`: 构建/工具

示例：

```
feat(patient): 添加患者搜索功能

新增按姓名、电话模糊搜索患者的功能
```

### 目录规范

```
src/
├── app/           # 页面路由
├── components/   # UI 组件（按功能模块组织）
├── hooks/        # 自定义 Hooks
├── lib/          # 工具函数
├── types/        # 类型定义
└── styles/       # 样式文件
```

### 命名规范


| 类型    | 命名规则             | 示例                      |
| ----- | ---------------- | ----------------------- |
| 组件文件  | PascalCase       | `PatientInfoDialog.tsx` |
| Hooks | camelCase，use 前缀 | `useDataStream.ts`      |
| 工具函数  | camelCase        | `formatDate.ts`         |
| 类型/接口 | PascalCase       | `PatientSummary`        |
| 常量    | UPPER_SNAKE_CASE | `MAX_BUFFER_SIZE`       |


### API 设计规范

1. 使用 RESTful 风格
2. 所有 API 路由添加 `dynamic = 'force-dynamic'`
3. 返回 JSON 格式响应
4. 错误响应包含错误信息

---

## 常见问题

### Q: WebSocket 连接失败？

确保：（这里是前端mock的ws）

1. WebSocket 服务器已启动：`npx tsx scripts/ws-beike-server.ts`
2. 环境变量 `NEXT_PUBLIC_WS_URL` 配置正确

### Q: 数据不显示？

1. 检查浏览器控制台 WebSocket 连接状态
2. 确认已选择患者并点击开始采集
3. 查看网络请求是否正常

### Q: 如何添加新的监测模块？

1. 在 `components/` 创建新的面板组件
2. 在 `hooks/` 添加对应的数据获取 Hook
3. 在主页面引入并配置 WebSocket

---

## 相关文档

- [Next.js 文档](https://nextjs.org/docs)
- [React 文档](https://react.dev)
- [Tailwind CSS 文档](https://tailwindcss.com/docs)
- [ECharts 文档](https://echarts.apache.org/zh/documents.html)

