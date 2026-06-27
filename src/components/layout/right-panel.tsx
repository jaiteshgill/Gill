import { AnnotationCanvas } from './annotation-canvas'

interface RightPanelProps {
  isDarkMode: boolean
}

export function RightPanel({ isDarkMode }: RightPanelProps) {
  return (
    <div
      className="w-1/4 h-full shrink-0 overflow-hidden flex flex-col"
      style={{ backgroundColor: isDarkMode ? '#1f1f1f' : '#fafaf8' }}
    >
      <div className="flex-1 overflow-hidden">
        <AnnotationCanvas isDarkMode={isDarkMode} side="right" />
      </div>
    </div>
  )
}
