interface CenterPanelProps {
  isDarkMode: boolean
}

export function CenterPanel({ isDarkMode }: CenterPanelProps) {
  return (
    <div
      className="w-1/2 h-full shrink-0 border-l border-r flex items-center justify-center"
      style={{
        backgroundColor: isDarkMode ? '#1f1f1f' : '#fafaf8',
        borderColor: isDarkMode ? '#333333' : '#e5e5e5',
      }}
    >
      <span
        className="text-sm"
        style={{ color: isDarkMode ? '#666666' : '#999999' }}
      >
        Slide content
      </span>
    </div>
  )
}
