interface FlowNodeProps {
  label: string;
  x: number;
  y: number;
  type?: 'default' | 'start' | 'module' | 'decision';
  width?: number;
  height?: number;
}

export function FlowNode({
  label,
  x,
  y,
  type = 'default',
  width = 160,
  height = 60,
}: FlowNodeProps) {
  const styles = {
    default: 'bg-neutral-800 border-neutral-600 text-neutral-100',
    start: 'bg-emerald-900/40 border-emerald-600 text-emerald-100',
    module: 'bg-neutral-700 border-neutral-500 text-neutral-50',
    decision: 'bg-neutral-800 border-amber-600/60 text-neutral-100',
  };

  return (
    <div
      className={`absolute border-2 rounded-lg flex items-center justify-center px-4 py-2 text-sm font-medium transition-all hover:scale-105 ${styles[type]}`}
      style={{
        left: `${x}px`,
        top: `${y}px`,
        width: `${width}px`,
        height: `${height}px`,
      }}
    >
      <div className="text-center leading-tight">{label}</div>
    </div>
  );
}
