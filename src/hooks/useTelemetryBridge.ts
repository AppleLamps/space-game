import { useCallback, useEffect, useRef, useState } from 'react'
import { MathUtils } from 'three'
import type { RoverTelemetry } from '../types/rover'

interface TelemetryBridgeOptions {
    tick: () => void
    isPlaying: boolean
}

interface HudState extends RoverTelemetry {
    fps: number
}

export function useTelemetryBridge({ tick, isPlaying }: TelemetryBridgeOptions) {
    const telemetryRef = useRef<RoverTelemetry>({ rpm: 0, slipping: false, pitch: 0, roll: 0 })
    const fpsRef = useRef(0)
    const isPlayingRef = useRef(isPlaying)
    const [hudState, setHudState] = useState<HudState>({
        rpm: 0,
        slipping: false,
        pitch: 0,
        roll: 0,
        fps: 0,
    })

    useEffect(() => {
        isPlayingRef.current = isPlaying
    }, [isPlaying])

    const updateTelemetry = useCallback((next: RoverTelemetry) => {
        telemetryRef.current = next
    }, [])

    useEffect(() => {
        let frameId: number
        let lastFrame = performance.now()
        let lastHudUpdate = performance.now()
        let lastPlayheadUpdate = performance.now()

        const loop = () => {
            const now = performance.now()
            const dt = now - lastFrame || 16
            lastFrame = now

            fpsRef.current = Math.max(1, MathUtils.lerp(fpsRef.current || 60, 1000 / dt, 0.12))

            if (isPlayingRef.current && now - lastPlayheadUpdate >= 50) {
                tick()
                lastPlayheadUpdate = now
            }

            if (now - lastHudUpdate >= 150) {
                const nextHud = {
                    rpm: telemetryRef.current.rpm,
                    slipping: telemetryRef.current.slipping,
                    pitch: telemetryRef.current.pitch,
                    roll: telemetryRef.current.roll,
                    fps: fpsRef.current,
                }

                setHudState((prev) => (prev.rpm === nextHud.rpm
                    && prev.slipping === nextHud.slipping
                    && prev.pitch === nextHud.pitch
                    && prev.roll === nextHud.roll
                    && prev.fps === nextHud.fps
                    ? prev
                    : nextHud))

                lastHudUpdate = now
            }

            frameId = requestAnimationFrame(loop)
        }

        frameId = requestAnimationFrame(loop)
        return () => cancelAnimationFrame(frameId)
    }, [tick])

    return { hudState, updateTelemetry }
}
