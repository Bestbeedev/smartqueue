import React from 'react'
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts'
import { cn } from '@/lib/utils'

interface DonutChartProps {
  data: Array<{
    name: string
    value: number
    color: string
  }>
  height?: number
  className?: string
  innerRadius?: number
  outerRadius?: number
}

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload
    const total = payload.reduce((sum: number, entry: any) => sum + entry.value, 0)
    const percentage = total > 0 ? ((data.value / total) * 100).toFixed(1) : '0'
    
    return (
      <div className="bg-background border border-border rounded-lg shadow-lg p-3 min-w-[140px]">
        <div className="flex items-center gap-2 mb-2">
          <div 
            className="w-3 h-3 rounded-full" 
            style={{ backgroundColor: data.color }}
          />
          <span className="font-medium text-sm">{data.name}</span>
        </div>
        <div className="space-y-1">
          <div className="text-lg font-bold">{data.value}</div>
          <div className="text-xs text-muted-foreground">{percentage}%</div>
        </div>
      </div>
    )
  }
  return null
}

export function DonutChart({ 
  data, 
  height = 300, 
  className,
  innerRadius = 60,
  outerRadius = 80
}: DonutChartProps) {
  return (
    <div className={cn("w-full", className)}>
      <ResponsiveContainer width="100%" height={height}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={innerRadius}
            outerRadius={outerRadius}
            paddingAngle={2}
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={entry.color}
                className="hover:brightness-110 transition-all duration-200"
              />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}
