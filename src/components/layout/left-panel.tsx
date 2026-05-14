import { AnnotationCanvas } from './annotation-canvas'

interface LeftPanelProps {
  isDarkMode: boolean
}

export function LeftPanel({ isDarkMode }: LeftPanelProps) {
  return (
    <div
      className="w-1/4 h-full shrink-0 overflow-hidden flex flex-col"
      style={{ backgroundColor: isDarkMode ? '#2a2a2a' : '#f0eeea' }}
    >
      <div className="px-4 pt-3 pb-2">
        <span
          className="text-xs font-medium uppercase tracking-wider"
          style={{ color: isDarkMode ? '#666666' : '#999999' }}
        >
          Gill&apos;s Notes
        </span>
      </div>
      <div className="flex-1 overflow-hidden">
        <AnnotationCanvas isDarkMode={isDarkMode} side="left" />
      </div>
    </div>
  )
}
