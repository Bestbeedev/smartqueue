import React from 'react'
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell, LabelList } from 'recharts'
import { cn } from '@/lib/utils'

interface VerticalBarChartProps {
  data: Array<{
    name: string
    value: number
    color: string
  }>
  height?: number
  className?: string
  showLabels?: boolean
}

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload
    return (
      <div className="bg-background border border-border rounded-lg shadow-lg p-3 min-w-[140px]">
        <div className="flex items-center gap-2 mb-2">
          <div 
            className="w-3 h-3 rounded-full" 
            style={{ backgroundColor: data.color }}
          />
          <span className="font-medium text-sm">{data.name}</span>
        </div>
        <div className="text-lg font-bold">{data.value}</div>
      </div>
    )
  }
  return null
}

export function VerticalBarChart({ 
  data, 
  height = 300, 
  className,
  showLabels = true 
}: VerticalBarChartProps) {
  return (
    <div className={cn("w-full", className)}>
      <ResponsiveContainer width="100%" height={height}>
        <BarChart 
          data={data}
          margin={{ top: 20, right: 20, left: 20, bottom: 60 }}
        >
          <CartesianGrid 
            strokeDasharray="3 3" 
            className="opacity-20" 
            stroke="hsl(var(--border))"
          />
          <XAxis 
            type="category"
            dataKey="name" 
            tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
            axisLine={false}
            tickLine={false}
            height={10}
          />
          <YAxis 
            type="number"
            tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar 
            dataKey="value" 
            radius={[8, 8, 0, 0]}
            maxBarSize={60}
          >
            {showLabels && (
              <LabelList 
                dataKey="value" 
                position="top"
                fontSize={12}
                fontWeight="bold"
                fill="hsl(var(--foreground))"
              />
            )}
            {data.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={entry.color}
                className="hover:brightness-110 transition-all duration-200"
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
