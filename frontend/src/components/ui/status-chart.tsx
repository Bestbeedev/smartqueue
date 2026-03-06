import React from 'react'
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell } from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface StatusData {
  name: string
  value: number
  color: string
  icon?: React.ReactNode
  trend?: {
    value: number
    isPositive: boolean
  }
}

interface StatusChartProps {
  title: string
  description: string
  data: StatusData[]
  height?: number
  showTrend?: boolean
  className?: string
}

export function StatusChart({ 
  title, 
  description, 
  data, 
  height = 300, 
  showTrend = false,
  className 
}: StatusChartProps) {
  const total = data.reduce((sum, item) => sum + item.value, 0)

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-background border rounded-lg shadow-lg p-3">
          <div className="flex items-center gap-2 mb-2">
            <div 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: data.color }}
            />
            <span className="font-medium">{data.name}</span>
          </div>
          <div className="text-sm text-muted-foreground">
            {data.value} éléments ({((data.value / total) * 100).toFixed(1)}%)
          </div>
          {data.trend && (
            <div className={cn(
              "text-xs mt-1",
              data.trend.isPositive ? "text-green-600" : "text-red-600"
            )}>
              {data.trend.isPositive ? "↑" : "↓"} {Math.abs(data.trend.value)}%
            </div>
          )}
        </div>
      )
    }
    return null
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {data.map((item, index) => (
              <div 
                key={index} 
                className="flex flex-col items-center p-3 rounded-lg border bg-muted/30"
              >
                <div className="flex items-center gap-2 mb-2">
                  {item.icon || (
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: item.color }}
                    />
                  )}
                  <span className="text-sm font-medium">{item.name}</span>
                </div>
                <div className="text-2xl font-bold">{item.value}</div>
                <div className="text-xs text-muted-foreground">
                  {((item.value / total) * 100).toFixed(1)}%
                </div>
                {showTrend && item.trend && (
                  <Badge 
                    variant={item.trend.isPositive ? "default" : "destructive"}
                    className="mt-1 text-xs"
                  >
                    {item.trend.isPositive ? "+" : ""}{item.trend.value}%
                  </Badge>
                )}
              </div>
            ))}
          </div>

          {/* Horizontal Bar Chart */}
          <ResponsiveContainer width="100%" height={height}>
            <BarChart 
              data={data} 
              layout="horizontal"
              margin={{ top: 20, right: 30, left: 60, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis 
                type="number" 
                tick={{ fontSize: 12 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis 
                type="category" 
                dataKey="name" 
                tick={{ fontSize: 12 }}
                axisLine={false}
                tickLine={false}
                width={80}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar 
                dataKey="value" 
                radius={[0, 8, 8, 0]}
                className="fill-primary"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>

          {/* Total Summary */}
          <div className="flex justify-between items-center pt-2 border-t">
            <span className="text-sm text-muted-foreground">Total</span>
            <span className="text-lg font-semibold">{total}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
