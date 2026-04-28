interface FlowArrowProps {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  color?: string;
  dashed?: boolean;
}

export function FlowArrow({
  x1,
  y1,
  x2,
  y2,
  color = '#10b981',
  dashed = false,
}: FlowArrowProps) {
  return (
    <svg
      className="absolute pointer-events-none"
      style={{
        left: 0,
        top: 0,
        width: '100%',
        height: '100%',
        overflow: 'visible',
      }}
    >
      <defs>
        <marker
          id={`arrowhead-${color.replace('#', '')}`}
          markerWidth="10"
          markerHeight="10"
          refX="9"
          refY="3"
          orient="auto"
        >
          <polygon points="0 0, 10 3, 0 6" fill={color} opacity="0.8" />
        </marker>
      </defs>
      <line
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        stroke={color}
        strokeWidth="2"
        strokeDasharray={dashed ? '5,5' : '0'}
        opacity="0.6"
        markerEnd={`url(#arrowhead-${color.replace('#', '')})`}
      />
    </svg>
  );
}
