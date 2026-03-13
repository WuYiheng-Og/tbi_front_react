export default function RecordPage() {
  return (
    <div className="h-full w-full bg-dashboard-bg px-8 py-6">
      <div className="max-w-5xl">
        <h1 className="text-2xl font-semibold text-dashboard-text">记录回放</h1>
        <p className="mt-2 text-sm text-dashboard-muted">
          当前暂无回放记录。后续可以在这里展示操作日志、任务执行历史或录像回放列表。
        </p>
      </div>
    </div>
  );
}

