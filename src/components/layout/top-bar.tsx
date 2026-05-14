import { Settings, User, Sun, Moon } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface TopBarProps {
  isDarkMode: boolean
  onToggleDarkMode: () => void
}

export function TopBar({ isDarkMode, onToggleDarkMode }: TopBarProps) {
  return (
    <header
      className="h-[60px] w-full flex items-center justify-between px-4 border-b shrink-0 relative"
      style={{
        backgroundColor: isDarkMode ? '#242424' : '#ffffff',
        borderColor: isDarkMode ? '#333333' : '#e5e5e5',
      }}
    >
      <div className="flex items-center gap-3">
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: '#5b7fa6' }}
        >
          <span className="text-white font-bold text-lg">G</span>
        </div>
        <span
          className="font-semibold text-lg"
          style={{ color: isDarkMode ? '#f5f4f0' : '#1a1a1a' }}
        >
          Gill
        </span>
      </div>

      <div className="absolute left-1/2 -translate-x-1/2">
        <h1
          className="text-base font-medium"
          style={{ color: isDarkMode ? '#e5e5e5' : '#1a1a1a' }}
        >
          ECE 124 — Digital Logic
        </h1>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleDarkMode}
          className="hover:bg-black/5"
          style={{ color: isDarkMode ? '#e5e5e5' : '#666666' }}
        >
          {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="hover:bg-black/5"
          style={{ color: isDarkMode ? '#e5e5e5' : '#666666' }}
        >
          <Settings className="h-5 w-5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="hover:bg-black/5"
          style={{ color: isDarkMode ? '#e5e5e5' : '#666666' }}
        >
          <User className="h-5 w-5" />
        </Button>
      </div>
    </header>
  )
}
