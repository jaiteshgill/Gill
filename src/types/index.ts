/**
 * Gill — Shared TypeScript Types
 */

export interface Slide {
  id: string
  index: number
  rawText: string
  imageUrl?: string
}

export interface SlideMap {
  slides: Slide[]
  totalSlides: number
  sourceFileName: string
}

export interface TutorSegment {
  slideRef: string
  voiceScript: string
  boardCmds: BoardCommand[]
  pauseAfterMs: number
}

export interface TutorPlan {
  segments: TutorSegment[]
}

export type TextStyle = {
  fontSize?: number
  fontWeight?: 'normal' | 'bold'
  color?: string
  opacity?: number
}

export type Region = {
  x: number
  y: number
  width: number
  height: number
}

export type ShapeSpec =
  | { kind: 'line'; x1: number; y1: number; x2: number; y2: number; color?: string; thickness?: number }
  | { kind: 'rect'; x: number; y: number; width: number; height: number; color?: string; fill?: boolean }
  | { kind: 'circle'; cx: number; cy: number; radius: number; color?: string; fill?: boolean }
  | { kind: 'arrow'; x1: number; y1: number; x2: number; y2: number; color?: string }

export type BoardCommand =
  | { type: 'write';     id: string; content: string; x: number; y: number; style?: TextStyle }
  | { type: 'formula';   id: string; latex: string;   x: number; y: number }
  | { type: 'draw';      id: string; shape: ShapeSpec }
  | { type: 'highlight'; id: string; region: Region; color?: string; opacity?: number }
  | { type: 'erase';     id: string }
  | { type: 'clear';     scope: 'all' | 'region'; region?: Region }
  | { type: 'pause';     durationMs: number }

export interface WordTimestamp {
  word: string
  startMs: number
  endMs: number
}

export interface TTSResult {
  audioUrl: string
  wordTimestamps: WordTimestamp[]
  durationMs: number
}

export type AudioCue = {
  kind: 'play' | 'pause'
  audioUrl?: string
}

export type SidebarCue = {
  slideRef: string
  highlightLine?: number
}

export type TimelineEventPayload = BoardCommand | AudioCue | SidebarCue

export interface TimelineEvent {
  id: string
  triggerMs: number
  kind: 'board' | 'audio' | 'sidebar' | 'pause'
  payload: TimelineEventPayload
}

export interface Timeline {
  events: TimelineEvent[]
  totalDurationMs: number
}

export type PlaybackStatus = 'idle' | 'loading' | 'playing' | 'paused' | 'ended' | 'error'

export interface PlaybackState {
  status: PlaybackStatus
  currentMs: number
  speed: number
  error?: string
}

export interface AnthropicMessage {
  role: 'user' | 'assistant'
  content: string
}

export type TTSProvider = 'elevenlabs' | 'openai'
