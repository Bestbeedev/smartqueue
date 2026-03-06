import React from 'react'
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts'
import { cn } from '@/lib/utils'

interface LineChartProps {
  data: Array<Record<string, any>>
  lines: Array<{
    dataKey: string
    stroke: string
    name: string
  }>
  height?: number
  className?: string
  xAxisDataKey?: string
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-background border border-border rounded-lg shadow-lg p-3 min-w-[160px]">
        <div className="text-sm font-medium mb-2">
          {new Date(label).toLocaleDateString('fr-FR', { 
            day: 'numeric', 
            month: 'short',
            year: 'numeric'
          })}
        </div>
        <div className="space-y-1">
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <div 
                  className="w-2 h-2 rounded-full" 
                  style={{ backgroundColor: entry.color }}
                />
                <span className="text-xs text-muted-foreground">{entry.name}</span>
              </div>
              <span className="font-medium text-sm">{entry.value}</span>
            </div>
          ))}
        </div>
      </div>
    )
  }
  return null
}

export function LineChartComponent({ 
  data, 
  lines, 
  height = 300, 
  className,
  xAxisDataKey = 'date'
}: LineChartProps) {
  return (
    <div className={cn("w-full", className)}>
      <ResponsiveContainer width="100%" height={height}>
        <LineChart 
          data={data}
          margin={{ top: 20, right: 20, left: 20, bottom: 20 }}
        >
          <CartesianGrid 
            strokeDasharray="3 3" 
            className="opacity-20" 
            stroke="hsl(var(--border))"
          />
          <XAxis 
            type="category"
            dataKey={xAxisDataKey} 
            tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(value) => new Date(value).toLocaleDateString('fr-FR', { 
              day: 'numeric', 
              month: 'short' 
            })}
          />
          <YAxis 
            type="number"
            tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<CustomTooltip />} />
          {lines.map((line, index) => (
            <Line
              key={index}
              type="monotone"
              dataKey={line.dataKey}
              stroke={line.stroke}
              strokeWidth={2}
              dot={false}
              name={line.name}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
