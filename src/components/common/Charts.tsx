import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { Competency } from '@/types'

const axis = { stroke: '#73766F', fontSize: 11, fontFamily: 'Inter, sans-serif' }

const tooltipStyle = {
  borderRadius: 12,
  border: '1px solid #E8DFCF',
  background: '#FCFBF7',
  fontSize: 12,
  color: '#252825',
  boxShadow: '0 8px 24px -12px rgba(38,51,46,0.28)',
}

/** Competency radar used on the dashboard. Values are also listed as text nearby. */
export function CompetencyRadar({ competencies }: { competencies: Competency[] }) {
  const data = competencies.map((c) => ({ subject: c.label, score: c.score }))
  return (
    <div className="h-[220px] w-full sm:h-[260px]" aria-hidden>
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={data} outerRadius="66%">
          <PolarGrid stroke="#E8DFCF" />
          <PolarAngleAxis dataKey="subject" tick={{ ...axis, fontSize: 9.5 }} />
          <Radar dataKey="score" stroke="#5F8068" fill="#A8B9A3" fillOpacity={0.45} />
          <Tooltip contentStyle={tooltipStyle} formatter={(v) => [`${v}%`, 'Score']} />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  )
}

export function CompetencyBars({ competencies }: { competencies: Competency[] }) {
  const data = competencies.map((c) => ({ name: c.label.split(' ')[0], score: c.score, previous: c.previousScore }))
  return (
    <div className="h-[200px] w-full sm:h-[240px]" aria-hidden>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} barGap={4}>
          <CartesianGrid stroke="#E8DFCF" vertical={false} />
          <XAxis dataKey="name" tick={axis} axisLine={false} tickLine={false} />
          <YAxis domain={[0, 100]} tick={axis} axisLine={false} tickLine={false} width={30} />
          <Tooltip contentStyle={tooltipStyle} />
          <Bar dataKey="previous" name="Previous" fill="#E8DFCF" radius={[6, 6, 0, 0]} />
          <Bar dataKey="score" name="Current" fill="#5F8068" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

export function TrendLine({ history }: { history: { label: string; score: number }[] }) {
  return (
    <div className="h-[170px] w-full sm:h-[200px]" aria-hidden>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={history}>
          <CartesianGrid stroke="#E8DFCF" vertical={false} />
          <XAxis dataKey="label" tick={axis} axisLine={false} tickLine={false} />
          <YAxis domain={[40, 100]} tick={axis} axisLine={false} tickLine={false} width={30} />
          <Tooltip contentStyle={tooltipStyle} formatter={(v) => [`${v}%`, 'Score']} />
          <Line type="monotone" dataKey="score" stroke="#5F8068" strokeWidth={2.5} dot={{ r: 3, fill: '#5F8068' }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

export function ActivityBars({ data }: { data: { label: string; consultations: number }[] }) {
  return (
    <div className="h-[180px] w-full" aria-hidden>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid stroke="#E8DFCF" vertical={false} />
          <XAxis dataKey="label" tick={axis} axisLine={false} tickLine={false} />
          <YAxis allowDecimals={false} tick={axis} axisLine={false} tickLine={false} width={24} />
          <Tooltip contentStyle={tooltipStyle} formatter={(v) => [`${v}`, 'Consultations']} />
          <Bar dataKey="consultations" fill="#A8B9A3" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
