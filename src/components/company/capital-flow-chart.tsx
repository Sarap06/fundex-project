'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { ChevronDown } from 'lucide-react';
import { formatCurrency } from '@/services/allocation-service';

interface FlowDataPoint {
  month: string;
  inflows: number;
  outflows: number;
}

interface CapitalFlowChartProps {
  data: FlowDataPoint[];
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-xl border border-stone-200/80 bg-white px-4 py-3 shadow-xl shadow-stone-200/40">
      <p className="mb-2.5 text-xs font-medium text-stone-400">{label}</p>
      {payload.map((entry: any) => {
        const isInflow = entry.dataKey === 'inflows';
        return (
          <div key={entry.dataKey} className="flex items-center gap-2.5 py-0.5">
            <span
              className="h-2.5 w-2.5 rounded-sm"
              style={{ backgroundColor: isInflow ? '#C0B87A' : '#292524' }}
            />
            <span className="text-xs font-semibold tabular-nums text-stone-800">
              {formatCurrency(Math.abs(entry.value))}
            </span>
            <span className={`ml-1 text-xs font-medium ${isInflow ? 'text-emerald-500' : 'text-red-400'}`}>
              {isInflow ? '↑' : '↓'} 2.5%
            </span>
          </div>
        );
      })}
    </div>
  );
}

export function CapitalFlowChart({ data }: CapitalFlowChartProps) {
  const chartData = data.map((d) => ({
    ...d,
    outflows: d.outflows > 0 ? -d.outflows : d.outflows,
  }));

  const totalInflows = data.reduce((sum, d) => sum + d.inflows, 0);
  const totalOutflows = data.reduce((sum, d) => sum + d.outflows, 0);
  const hasData = totalInflows > 0 || totalOutflows > 0;

  return (
    <div className="rounded-2xl border border-stone-100 bg-white p-6 font-sans shadow-sm md:p-7">
      {/* Header row */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <h3 className="text-base font-semibold text-stone-900">
          Monthly Capital Flow
        </h3>
        <div className="flex items-center gap-5">
          {/* Legend */}
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm bg-fundex-gold" />
            <span className="text-xs text-stone-500">Capital Inflow</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm bg-stone-800" />
            <span className="text-xs text-stone-500">Distributions</span>
          </div>
          {/* Date range dropdown */}
          <button
            type="button"
            className="flex items-center gap-1.5 rounded-full border border-stone-200 px-3 py-1.5 text-xs font-medium text-stone-600 transition-colors hover:bg-stone-50"
          >
            Last 6 Months
            <ChevronDown className="h-3 w-3 text-stone-400" />
          </button>
        </div>
      </div>

      {/* Total metric */}
      <div className="mt-3 flex items-baseline gap-3">
        <p className="text-3xl font-bold tabular-nums tracking-tight text-stone-900">
          {formatCurrency(totalInflows)}
        </p>
        {totalInflows > 0 && (
          <span className="text-sm font-semibold text-emerald-500">+18% from last month</span>
        )}
      </div>

      {/* Chart */}
      {!hasData ? (
        <div className="mt-6 flex h-[280px] flex-col items-center justify-center rounded-xl border border-dashed border-stone-200 bg-stone-50/50">
          <p className="text-sm font-medium text-stone-400">No capital flow data yet</p>
          <p className="mt-1 text-xs text-stone-300">Allocations will appear here as they are funded</p>
        </div>
      ) : (
        <div className="mt-5 h-[280px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 10, right: 5, left: -15, bottom: 0 }}
              barGap={3}
              barCategoryGap="20%"
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#f5f5f4"
                vertical={false}
              />
              <XAxis
                dataKey="month"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: '#a8a29e', fontWeight: 500 }}
                dy={10}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: '#a8a29e' }}
                tickFormatter={(v: number) =>
                  v === 0 ? '$0' : `$${Math.abs(v / 1000).toFixed(0)}K`
                }
              />
              <Tooltip
                content={<CustomTooltip />}
                cursor={{ fill: 'rgba(0,0,0,0.02)', radius: 8 }}
              />
              <ReferenceLine
                y={0}
                stroke="#d6d3d1"
                strokeDasharray="6 4"
                strokeWidth={1}
              />
              <Bar
                dataKey="inflows"
                fill="#C0B87A"
                radius={[6, 6, 0, 0]}
                maxBarSize={36}
              />
              <Bar
                dataKey="outflows"
                fill="#292524"
                radius={[0, 0, 6, 6]}
                maxBarSize={36}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
