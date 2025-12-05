import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { DEFAULT_SPEED } from '../constants/simulation'
import type { InputState } from '../types/rover'

const KEY_BINDINGS: Record<string, keyof InputState> = {
  w: 'forward',
  ArrowUp: 'forward',
  s: 'backward',
  ArrowDown: 'backward',
  a: 'left',
  ArrowLeft: 'left',
  d: 'right',
  ArrowRight: 'right',
}

export interface RoverControls {
  driveEnabled: boolean
  speed: number
  setSpeed: (value: number) => void
  toggleDrive: () => void
  reset: () => void
  resetSignal: number
  getInputState: () => InputState
}

export function useRoverControls(initialSpeed = DEFAULT_SPEED): RoverControls {
  const [driveEnabled, setDriveEnabled] = useState(false)
  const [speed, setSpeedState] = useState(initialSpeed)
  const [resetSignal, setResetSignal] = useState(0)
  const keysRef = useRef<InputState>({
    forward: false,
    backward: false,
    left: false,
    right: false,
  })
  const driveEnabledRef = useRef(driveEnabled)

  useEffect(() => {
    driveEnabledRef.current = driveEnabled
  }, [driveEnabled])

  const clearKeys = useCallback(() => {
    keysRef.current = { forward: false, backward: false, left: false, right: false }
  }, [])

  const getInputState = useCallback(() => keysRef.current, [])

  const toggleDrive = useCallback(() => {
    setDriveEnabled((current) => {
      if (current) {
        clearKeys()
      }
      return !current
    })
  }, [clearKeys])

  const setSpeed = useCallback((value: number) => {
    setSpeedState(value)
  }, [])

  const reset = useCallback(() => {
    clearKeys()
    setDriveEnabled(false)
    setSpeed(initialSpeed)
    setResetSignal((value) => value + 1)
  }, [clearKeys, initialSpeed])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const key = event.key.length === 1 ? event.key.toLowerCase() : event.key
      const mapped = KEY_BINDINGS[key]
      if (!mapped || !driveEnabledRef.current) return

      event.preventDefault()
      keysRef.current = { ...keysRef.current, [mapped]: true }
    }

    const handleKeyUp = (event: KeyboardEvent) => {
      const key = event.key.length === 1 ? event.key.toLowerCase() : event.key
      const mapped = KEY_BINDINGS[key]
      if (!mapped || !driveEnabledRef.current) return

      event.preventDefault()
      keysRef.current = { ...keysRef.current, [mapped]: false }
    }

    const handleBlur = () => {
      clearKeys()
    }

    const handleVisibility = () => {
      if (document.visibilityState === 'hidden') {
        clearKeys()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    window.addEventListener('blur', handleBlur)
    document.addEventListener('visibilitychange', handleVisibility)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
      window.removeEventListener('blur', handleBlur)
      document.removeEventListener('visibilitychange', handleVisibility)
    }
  }, [clearKeys])

  const controls = useMemo<RoverControls>(
    () => ({
      driveEnabled,
      speed,
      setSpeed,
      toggleDrive,
      reset,
      resetSignal,
      getInputState,
    }),
    [driveEnabled, speed, toggleDrive, reset, resetSignal, getInputState],
  )

  return controls
}

