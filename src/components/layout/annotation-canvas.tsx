import { useEffect, useRef } from 'react'
import { Application, Graphics } from 'pixi.js'

interface AnnotationCanvasProps {
  isDarkMode: boolean
  zoom?: number
}

export function AnnotationCanvas({ isDarkMode, zoom = 1 }: AnnotationCanvasProps) {
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
        backgroundAlpha: 0,
        resizeTo: containerRef.current!,
        antialias: true,
        resolution: window.devicePixelRatio || 1,
        autoDensity: true,
      })

      app.canvas.style.position = 'absolute'
      app.canvas.style.inset = '0'
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
  }, [isDarkMode])

  return (
    <div
      ref={containerRef}
      className="absolute inset-0"
      style={{
        backgroundColor: isDarkMode ? '#1f1f1f' : '#fafaf8',
        backgroundImage: `radial-gradient(circle, ${isDarkMode ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.15)'} 1px, transparent 1px)`,
        backgroundSize: `${32 * zoom}px ${32 * zoom}px`,
        backgroundPosition: 'center center',
        transition: 'background-size 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
      }}
    />
  )
}
