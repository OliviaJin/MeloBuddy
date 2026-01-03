'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Howl } from 'howler'

export interface AudioPlayerState {
  isPlaying: boolean
  isLoading: boolean
  currentTime: number
  duration: number
  playbackRate: number
  error: string | null
}

export interface AudioPlayerControls {
  play: () => void
  pause: () => void
  toggle: () => void
  seek: (time: number) => void
  setPlaybackRate: (rate: number) => void
  skipForward: (seconds?: number) => void
  skipBackward: (seconds?: number) => void
  setLoop: (start: number, end: number) => void
  clearLoop: () => void
}

export interface UseAudioPlayerReturn extends AudioPlayerState, AudioPlayerControls {
  loopRange: { start: number; end: number } | null
}

export function useAudioPlayer(audioUrl: string | null): UseAudioPlayerReturn {
  const [state, setState] = useState<AudioPlayerState>({
    isPlaying: false,
    isLoading: false,
    currentTime: 0,
    duration: 0,
    playbackRate: 1,
    error: null,
  })

  const [loopRange, setLoopRange] = useState<{ start: number; end: number } | null>(null)

  const howlRef = useRef<Howl | null>(null)
  const rafRef = useRef<number | null>(null)
  const loopRangeRef = useRef<{ start: number; end: number } | null>(null)

  // Keep loopRangeRef in sync
  useEffect(() => {
    loopRangeRef.current = loopRange
  }, [loopRange])

  // Update current time during playback
  const updateTime = useCallback(() => {
    if (howlRef.current && howlRef.current.playing()) {
      const currentTime = howlRef.current.seek() as number

      // Check if we need to loop
      if (loopRangeRef.current && currentTime >= loopRangeRef.current.end) {
        howlRef.current.seek(loopRangeRef.current.start)
      }

      setState(prev => ({ ...prev, currentTime }))
      rafRef.current = requestAnimationFrame(updateTime)
    }
  }, [])

  // Initialize Howl when URL changes
  useEffect(() => {
    if (!audioUrl) {
      setState(prev => ({ ...prev, isLoading: false, error: null }))
      return
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }))

    const howl = new Howl({
      src: [audioUrl],
      html5: true, // Enable streaming for large files
      preload: true,
      onload: () => {
        setState(prev => ({
          ...prev,
          isLoading: false,
          duration: howl.duration(),
          error: null,
        }))
      },
      onloaderror: (_id, error) => {
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: `加载失败: ${error}`,
        }))
      },
      onplay: () => {
        setState(prev => ({ ...prev, isPlaying: true }))
        rafRef.current = requestAnimationFrame(updateTime)
      },
      onpause: () => {
        setState(prev => ({ ...prev, isPlaying: false }))
        if (rafRef.current) {
          cancelAnimationFrame(rafRef.current)
        }
      },
      onstop: () => {
        setState(prev => ({ ...prev, isPlaying: false, currentTime: 0 }))
        if (rafRef.current) {
          cancelAnimationFrame(rafRef.current)
        }
      },
      onend: () => {
        // If loop is set, go back to loop start
        if (loopRangeRef.current) {
          howl.seek(loopRangeRef.current.start)
          howl.play()
        } else {
          setState(prev => ({ ...prev, isPlaying: false, currentTime: 0 }))
        }
      },
      onseek: () => {
        const currentTime = howl.seek() as number
        setState(prev => ({ ...prev, currentTime }))
      },
    })

    howlRef.current = howl

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current)
      }
      howl.unload()
      howlRef.current = null
    }
  }, [audioUrl, updateTime])

  const play = useCallback(() => {
    if (howlRef.current) {
      howlRef.current.play()
    }
  }, [])

  const pause = useCallback(() => {
    if (howlRef.current) {
      howlRef.current.pause()
    }
  }, [])

  const toggle = useCallback(() => {
    if (howlRef.current) {
      if (howlRef.current.playing()) {
        howlRef.current.pause()
      } else {
        howlRef.current.play()
      }
    }
  }, [])

  const seek = useCallback((time: number) => {
    if (howlRef.current) {
      howlRef.current.seek(time)
      setState(prev => ({ ...prev, currentTime: time }))
    }
  }, [])

  const setPlaybackRate = useCallback((rate: number) => {
    if (howlRef.current) {
      howlRef.current.rate(rate)
    }
    setState(prev => ({ ...prev, playbackRate: rate }))
  }, [])

  const skipForward = useCallback((seconds: number = 5) => {
    if (howlRef.current) {
      const currentTime = howlRef.current.seek() as number
      const duration = howlRef.current.duration()
      const newTime = Math.min(currentTime + seconds, duration)
      howlRef.current.seek(newTime)
      setState(prev => ({ ...prev, currentTime: newTime }))
    }
  }, [])

  const skipBackward = useCallback((seconds: number = 5) => {
    if (howlRef.current) {
      const currentTime = howlRef.current.seek() as number
      const newTime = Math.max(currentTime - seconds, 0)
      howlRef.current.seek(newTime)
      setState(prev => ({ ...prev, currentTime: newTime }))
    }
  }, [])

  const setLoop = useCallback((start: number, end: number) => {
    setLoopRange({ start, end })
  }, [])

  const clearLoop = useCallback(() => {
    setLoopRange(null)
  }, [])

  return {
    ...state,
    loopRange,
    play,
    pause,
    toggle,
    seek,
    setPlaybackRate,
    skipForward,
    skipBackward,
    setLoop,
    clearLoop,
  }
}
