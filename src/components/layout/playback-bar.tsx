import { useState } from 'react'
import { Play, Pause, Volume2, VolumeX, Mic, Maximize2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'

interface PlaybackBarProps {
  isDarkMode: boolean
}

export function PlaybackBar({ isDarkMode }: PlaybackBarProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [progress, setProgress] = useState([28])
  const [speed, setSpeed] = useState('1x')

  const totalSlides = 24
  const currentSlide = Math.max(1, Math.round((progress[0] / 100) * totalSlides))

  const speeds = ['0.5x', '0.75x', '1x', '1.25x', '1.5x', '2x']

  const cycleSpeed = () => {
    const currentIndex = speeds.indexOf(speed)
    setSpeed(speeds[(currentIndex + 1) % speeds.length])
  }

  return (
    <footer
      className="h-[56px] w-full flex items-center justify-between px-4 border-t shrink-0"
      style={{
        backgroundColor: isDarkMode ? '#242424' : '#ffffff',
        borderColor: isDarkMode ? '#333333' : '#e5e5e5',
      }}
    >
      <div className="flex items-center gap-3 w-40">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsPlaying(!isPlaying)}
          className="h-9 w-9 rounded-full hover:bg-black/5"
          style={{ color: isDarkMode ? '#e5e5e5' : '#1a1a1a' }}
        >
          {isPlaying ? (
            <Pause className="h-5 w-5" />
          ) : (
            <Play className="h-5 w-5 ml-0.5" />
          )}
        </Button>
        <span
          className="text-sm font-medium tabular-nums"
          style={{ color: isDarkMode ? '#999999' : '#666666' }}
        >
          {currentSlide} / {totalSlides}
        </span>
      </div>

      <div className="flex-1 max-w-2xl mx-8">
        <Slider
          value={progress}
          onValueChange={setProgress}
          max={100}
          step={0.1}
          className="w-full cursor-pointer"
        />
      </div>

      <div className="flex items-center gap-1 w-40 justify-end">
        <Button
          variant="ghost"
          size="sm"
          onClick={cycleSpeed}
          className="text-sm font-medium px-2 hover:bg-black/5"
          style={{ color: isDarkMode ? '#e5e5e5' : '#666666' }}
        >
          {speed}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsMuted(!isMuted)}
          className="h-9 w-9 hover:bg-black/5"
          style={{ color: isDarkMode ? '#e5e5e5' : '#666666' }}
        >
          {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 hover:bg-black/5"
          style={{ color: isDarkMode ? '#e5e5e5' : '#666666' }}
        >
          <Mic className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 hover:bg-black/5"
          style={{ color: isDarkMode ? '#e5e5e5' : '#666666' }}
        >
          <Maximize2 className="h-4 w-4" />
        </Button>
      </div>
    </footer>
  )
}
