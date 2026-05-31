import { Moon, Sun } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useTheme } from "@/components/theme-provider"

export function ModeToggle() {
    const { theme, setTheme } = useTheme()

    return (
        <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            title="Toggle theme"
        >
            <Sun className="h-4 w-4 scale-100 transition-all dark:scale-0" />
            <Moon className="absolute h-4 w-4 scale-0 transition-all dark:scale-100" />
            <span className="sr-only">Toggle theme</span>
        </Button>
    )
}
