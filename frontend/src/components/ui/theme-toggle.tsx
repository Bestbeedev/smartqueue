import * as React from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "@/components/theme-provider"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <Button variant="ghost" size="icon" className="h-9 w-9">
        <div className="h-5 w-5 animate-pulse bg-gray-300 rounded" />
      </Button>
    )
  }

  const isDark = theme === "dark"

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className={cn(
        "h-9 w-9 transition-all duration-300",
        "hover:bg-gray-400/20  rounded-full hover:scale-110"
      )}
    >
      {isDark ? (
        <Sun className="h-5 w-5 text-yellow-500 transition-all duration-300" />
      ) : (
        <Moon className="h-5 w-5 text-blue-600 transition-all duration-300" />
      )}
      <span className="sr-only">
        {isDark ? "Basculer en mode clair" : "Basculer en mode sombre"}
      </span>
    </Button>
  )
}
