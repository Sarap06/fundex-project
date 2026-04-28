interface SwimlaneProps {
  title: string;
  x: number;
  y: number;
  width: number;
  height: number;
  color?: string;
  subtitle?: string;
}

export function Swimlane({
  title,
  x,
  y,
  width,
  height,
  color = 'emerald',
  subtitle,
}: SwimlaneProps) {
  const colorClasses: Record<string, string> = {
    emerald: 'bg-emerald-950/30 border-emerald-700/40',
    blue: 'bg-blue-950/30 border-blue-700/40',
    purple: 'bg-purple-950/30 border-purple-700/40',
  };

  const titleColorClasses: Record<string, string> = {
    emerald: 'text-emerald-400',
    blue: 'text-blue-400',
    purple: 'text-purple-400',
  };

  return (
    <div
      className={`absolute border-2 rounded-xl ${colorClasses[color] || colorClasses.emerald}`}
      style={{
        left: `${x}px`,
        top: `${y}px`,
        width: `${width}px`,
        height: `${height}px`,
      }}
    >
      <div className="p-6">
        <h2 className={`text-xl font-semibold ${titleColorClasses[color] || titleColorClasses.emerald}`}>
          {title}
        </h2>
        {subtitle && <p className="text-neutral-400 text-sm mt-1">{subtitle}</p>}
      </div>
    </div>
  );
}
