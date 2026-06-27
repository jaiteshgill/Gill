import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Send } from 'lucide-react'

interface QuestionsOverlayProps {
  isDarkMode: boolean
  isOpen: boolean
}

export function QuestionsOverlay({ isDarkMode, isOpen }: QuestionsOverlayProps) {
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
      className="absolute top-0 bottom-0 right-0 flex flex-col overflow-hidden"
      style={{
        width: '28%',
        backgroundColor: isDarkMode ? '#000000' : '#ffffff',
        borderLeft: `1px solid ${isDarkMode ? '#2a2a2a' : '#e5e5e5'}`,
        transform: isOpen ? 'translateX(0)' : 'translateX(100%)',
        transition: 'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
      }}
    >
      <div className="flex-1 overflow-y-auto" />

      <div className="p-3">
        <form onSubmit={handleSubmit} className="relative">
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Ask a question..."
            className="w-full rounded-lg px-3 py-2 pr-10 text-sm focus:outline-none focus:ring-2 transition-shadow"
            style={{
              backgroundColor: isDarkMode ? '#111111' : '#f5f5f5',
              color: isDarkMode ? '#e5e5e5' : '#1a1a1a',
              borderColor: isDarkMode ? '#333333' : '#e0e0e0',
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
