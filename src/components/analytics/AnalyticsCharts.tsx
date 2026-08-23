import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { CompletionTrendPoint, PriorityBreakdownPoint, SprintVelocityPoint, StatusDistributionPoint } from '@/features/analytics/selectors'
import { PRIORITY_SERIES } from '@/features/analytics/selectors'

/** Shared chart styling so all four visualisations feel cohesive. */
const AXIS_CLASS = { fontSize: 12 } as const

const TOOLTIP_STYLE = {
  backgroundColor: 'rgba(17, 24, 39, 0.95)',
  border: 'none',
  borderRadius: '0.5rem',
  color: '#f9fafb',
  fontSize: '12px',
} as const

const STATUS_COLORS: Record<string, string> = {
  Backlog: '#9ca3af',
  'In Progress': '#3b82f6',
  Review: '#a855f7',
  Done: '#10b981',
}

const PRIORITY_COLORS: Record<string, string> = {
  high: '#ef4444',
  medium: '#f59e0b',
  low: '#6b7280',
}

interface ChartCardProps {
  title: string
  description: string
  children: React.ReactNode
}

/** Card shell used by the analytics page for each chart. */
export function ChartCard({ title, description, children }: ChartCardProps) {
  return (
    <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-900">
      <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">{title}</h2>
      <p className="mb-3 text-xs text-gray-500 dark:text-gray-400">{description}</p>
      {children}
    </section>
  )
}

export function SprintVelocityChart({ data }: { data: SprintVelocityPoint[] }) {
  return (
    <div role="img" aria-label="Bar chart of completed tasks per sprint" className="h-[280px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.25} vertical={false} />
          <XAxis dataKey="name" tick={AXIS_CLASS} tickLine={false} axisLine={false} />
          <YAxis allowDecimals={false} tick={AXIS_CLASS} tickLine={false} axisLine={false} />
          <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: 'rgba(99,102,241,0.08)' }} />
          <Legend wrapperStyle={AXIS_CLASS} />
          <Bar
            name="Completed"
            dataKey="completed"
            fill="#6366f1"
            radius={[4, 4, 0, 0]}
            maxBarSize={48}
            animationDuration={600}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

export function TaskStatusChart({ data }: { data: StatusDistributionPoint[] }) {
  return (
    <div role="img" aria-label="Donut chart of task status distribution" className="h-[280px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="count"
            nameKey="label"
            innerRadius="55%"
            outerRadius="80%"
            paddingAngle={2}
            animationDuration={600}
          >
            {data.map((point) => (
              <Cell key={point.status} fill={STATUS_COLORS[point.label] ?? '#9ca3af'} />
            ))}
          </Pie>
          <Tooltip contentStyle={TOOLTIP_STYLE} />
          <Legend wrapperStyle={AXIS_CLASS} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}

export function PriorityBreakdownChart({ data }: { data: PriorityBreakdownPoint[] }) {
  return (
    <div
      role="img"
      aria-label="Stacked bar chart of task priorities across board columns"
      className="h-[280px] w-full"
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.25} vertical={false} />
          <XAxis dataKey="label" tick={AXIS_CLASS} tickLine={false} axisLine={false} />
          <YAxis allowDecimals={false} tick={AXIS_CLASS} tickLine={false} axisLine={false} />
          <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: 'rgba(99,102,241,0.08)' }} />
          <Legend wrapperStyle={AXIS_CLASS} />
          {PRIORITY_SERIES.map((series) => (
            <Bar
              key={series.key}
              name={series.label}
              dataKey={series.key}
              stackId="priority"
              fill={PRIORITY_COLORS[series.key]}
              maxBarSize={48}
              animationDuration={600}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

export function CompletionTrendChart({ data }: { data: CompletionTrendPoint[] }) {
  return (
    <div
      role="img"
      aria-label="Line chart of completed tasks per day over the last two weeks"
      className="h-[280px] w-full"
    >
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.25} vertical={false} />
          <XAxis dataKey="label" tick={AXIS_CLASS} tickLine={false} axisLine={false} interval="preserveStartEnd" />
          <YAxis allowDecimals={false} tick={AXIS_CLASS} tickLine={false} axisLine={false} />
          <Tooltip contentStyle={TOOLTIP_STYLE} />
          <Line
            name="Completions"
            type="monotone"
            dataKey="count"
            stroke="#6366f1"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
            animationDuration={700}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
