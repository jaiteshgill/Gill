import { useEffect, useRef } from 'react'
import { Application, Graphics } from 'pixi.js'

interface AnnotationCanvasProps {
  isDarkMode: boolean
  side: 'left' | 'right'
}

export function AnnotationCanvas({ isDarkMode, side }: AnnotationCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const appRef = useRef<Application | null>(null)

  useEffect(() => {
    if (!containerRef.current) return

    const initPixi = async () => {
      if (appRef.current) {
        appRef.current.destroy(true)
        appRef.current = null
      }

      const app = new Application()
      await app.init({
        background: isDarkMode ? 0x2a2a2a : 0xf0eeea,
        resizeTo: containerRef.current!,
        antialias: true,
        resolution: window.devicePixelRatio || 1,
        autoDensity: true,
      })

      containerRef.current!.appendChild(app.canvas)
      appRef.current = app

      const graphics = new Graphics()
      app.stage.addChild(graphics)
    }

    initPixi()

    return () => {
      if (appRef.current) {
        appRef.current.destroy(true)
        appRef.current = null
      }
    }
  }, [isDarkMode, side])

  return (
    <div
      ref={containerRef}
      className="w-full h-full"
      style={{ backgroundColor: isDarkMode ? '#2a2a2a' : '#f0eeea' }}
    />
  )
}
