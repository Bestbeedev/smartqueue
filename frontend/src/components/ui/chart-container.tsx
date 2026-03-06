import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface ChartContainerProps {
  title: string
  description?: string
  children: React.ReactNode
  className?: string
  actions?: React.ReactNode
}

export function ChartContainer({
  title,
  description,
  children,
  className,
  actions
}: ChartContainerProps) {
  return (
    <Card className={cn(
      "bg-card border-border transition-all duration-300 hover:shadow-xl",
      "shadow-lg shadow-gray-900/10 dark:shadow-black/20",
      className
    )}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div className="space-y-1">
          <CardTitle className="text-base font-semibold text-foreground transition-colors duration-300">
            {title}
          </CardTitle>
          {description && (
            <p className="text-sm text-muted-foreground transition-colors duration-300">
              {description}
            </p>
          )}
        </div>
        {actions && (
          <div className="flex items-center space-x-2">
            {actions}
          </div>
        )}
      </CardHeader>
      <CardContent className="pt-0">
        {children}
      </CardContent>
    </Card>
  )
}
