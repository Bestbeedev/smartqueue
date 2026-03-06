import React from "react"
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
  LabelList,
} from "recharts"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

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
  className,
}: StatusChartProps) {
  const validData = data.filter(
    (item) =>
      item &&
      typeof item.value === "number" &&
      !isNaN(item.value) &&
      item.value >= 0
  )

  const total = validData.reduce((sum, item) => sum + item.value, 0)

  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload || !payload.length) return null

    const item = payload[0].payload
    const percentage =
      total > 0 ? ((item.value / total) * 100).toFixed(1) : "0"

    return (
      <div className="bg-background border rounded-lg shadow-md p-3">
        <div className="flex items-center gap-2 mb-2">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: item.color }}
          />
          <span className="font-semibold">{item.name}</span>
        </div>

        <div className="text-sm space-y-1">
          <div className="flex justify-between">
            <span>Valeur</span>
            <span className="font-medium">{item.value}</span>
          </div>

          <div className="flex justify-between">
            <span>Pourcentage</span>
            <span>{percentage}%</span>
          </div>
        </div>
      </div>
    )
  }

  if (validData.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>

        <CardContent>
          <div className="flex items-center justify-center h-52 text-muted-foreground">
            Aucune donnée disponible
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* summary cards */}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {validData.map((item, index) => {
            const percentage =
              total > 0
                ? ((item.value / total) * 100).toFixed(1)
                : "0"

            return (
              <div
                key={index}
                className="p-4 border rounded-lg text-center"
              >
                <div className="flex justify-center items-center gap-2 mb-2">
                  {item.icon || (
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
                  )}
                  <span className="text-sm">{item.name}</span>
                </div>

                <div className="text-xl font-bold">{item.value}</div>

                <div className="text-xs text-muted-foreground">
                  {percentage}%
                </div>

                {showTrend && item.trend && (
                  <Badge
                    variant={
                      item.trend.isPositive
                        ? "default"
                        : "destructive"
                    }
                    className="mt-2"
                  >
                    {item.trend.isPositive ? "+" : ""}
                    {item.trend.value}%
                  </Badge>
                )}
              </div>
            )
          })}
        </div>

        {/* CHART */}

        <ResponsiveContainer width="100%" height={height}>
          <BarChart
            data={validData}
            margin={{ top: 20, right: 20, left: 0, bottom: 10 }}
          >
            <CartesianGrid strokeDasharray="3 3" opacity={0.2} />

            <XAxis
              dataKey="name"
              tick={{ fontSize: 12 }}
              axisLine={false}
              tickLine={false}
            />

            <YAxis
              tick={{ fontSize: 12 }}
              axisLine={false}
              tickLine={false}
            />

            <Tooltip content={<CustomTooltip />} />

            <Bar dataKey="value" radius={[8, 8, 0, 0]}>
              <LabelList
                dataKey="value"
                position="top"
                fontSize={12}
              />

              {validData.map((entry, index) => (
                <Cell key={index} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>

        {/* total */}

        <div className="flex justify-between border-t pt-3">
          <span className="text-sm text-muted-foreground">
            Total
          </span>

          <span className="font-semibold">{total}</span>
        </div>
      </CardContent>
    </Card>
  )
}