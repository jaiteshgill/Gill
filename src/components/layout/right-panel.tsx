import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Send } from 'lucide-react'
import { AnnotationCanvas } from './annotation-canvas'

interface RightPanelProps {
  isDarkMode: boolean
}

export function RightPanel({ isDarkMode }: RightPanelProps) {
  const [question, setQuestion] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (question.trim()) {
      console.log('Question asked:', question)
      setQuestion('')
    }
  }

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
          Your Questions
        </span>
      </div>

      <div className="flex-1 overflow-hidden">
        <AnnotationCanvas isDarkMode={isDarkMode} side="right" />
      </div>

      <div className="p-3">
        <form onSubmit={handleSubmit} className="relative">
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Ask a question..."
            className="w-full rounded-lg px-3 py-2 pr-10 text-sm focus:outline-none focus:ring-2 transition-shadow"
            style={{
              backgroundColor: isDarkMode ? '#1f1f1f' : '#ffffff',
              color: isDarkMode ? '#e5e5e5' : '#1a1a1a',
              borderColor: isDarkMode ? '#404040' : '#e0e0e0',
              borderWidth: '1px',
              borderStyle: 'solid',
            }}
          />
          <Button
            type="submit"
            size="icon"
            variant="ghost"
            className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
            style={{
              color: question.trim() ? '#5b7fa6' : isDarkMode ? '#555555' : '#aaaaaa',
            }}
            disabled={!question.trim()}
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  )
}
