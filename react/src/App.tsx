import { Button } from "@/components/ui/button"
import { useTheme } from "./components/ui/theme-provider"

function App() {
  const { theme, setTheme } = useTheme()

  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-background text-foreground">
      <Button onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
        {theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
      </Button>
    </div>
  )
}

export default App