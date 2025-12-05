import { useCallback, useMemo, useReducer } from 'react'
import type { RoverPose } from '../types/rover'

export interface PoseSample {
    time: number
    pose: RoverPose
}

export interface ReplayState {
    isRecording: boolean
    isPlaying: boolean
    samples: PoseSample[]
    startedAt: number
    playhead: number
    duration: number
}

type Clock = () => number

type StorageLike = Pick<Storage, 'getItem' | 'setItem'>

interface ReplayOptions {
    clock?: Clock
    storage?: StorageLike
    storageKey?: string
}

type Action =
    | { type: 'startRecording'; now: number }
    | { type: 'stopRecording'; now: number; storage: StorageLike; storageKey: string }
    | { type: 'recordPose'; now: number; pose: RoverPose }
    | { type: 'startPlayback'; now: number; storage: StorageLike; storageKey: string }
    | { type: 'stopPlayback' }
    | { type: 'seek'; now: number; time: number }
    | { type: 'tick'; now: number }

const initialState: ReplayState = {
    isRecording: false,
    isPlaying: false,
    samples: [],
    startedAt: 0,
    playhead: 0,
    duration: 0,
}

const safeLoad = (storage: StorageLike, key: string): PoseSample[] => {
    try {
        const raw = storage.getItem(key)
        if (!raw) return []
        const parsed = JSON.parse(raw) as PoseSample[]
        if (!Array.isArray(parsed)) return []
        return parsed
    } catch (error) {
        console.warn('Failed to load replay', error)
        return []
    }
}

const safeSave = (storage: StorageLike, key: string, samples: PoseSample[]) => {
    try {
        storage.setItem(key, JSON.stringify(samples))
    } catch (error) {
        console.warn('Failed to save replay', error)
    }
}

const getDurationFromSamples = (samples: PoseSample[]): number => samples.at(-1)?.time ?? 0

const ghostPoseAt = (samples: PoseSample[], time: number): RoverPose | null => {
    if (!samples.length) return null
    const duration = getDurationFromSamples(samples)
    const clamped = Math.min(Math.max(time, 0), duration)
    if (clamped >= duration) return samples[samples.length - 1].pose

    let nextIndex = samples.findIndex((s) => s.time >= clamped)
    if (nextIndex <= 0) nextIndex = 1
    const prev = samples[nextIndex - 1]
    const next = samples[nextIndex]
    if (!prev || !next) return null

    const alpha = (clamped - prev.time) / Math.max(next.time - prev.time, 1)
    const lerp = (a: number, b: number) => a + (b - a) * alpha

    return {
        position: [
            lerp(prev.pose.position[0], next.pose.position[0]),
            lerp(prev.pose.position[1], next.pose.position[1]),
            lerp(prev.pose.position[2], next.pose.position[2]),
        ],
        heading: lerp(prev.pose.heading, next.pose.heading),
    }
}

const reducer = (state: ReplayState, action: Action): ReplayState => {
    switch (action.type) {
        case 'startRecording':
            return {
                isRecording: true,
                isPlaying: false,
                samples: [],
                startedAt: action.now,
                playhead: 0,
                duration: 0,
            }
        case 'stopRecording': {
            const duration = getDurationFromSamples(state.samples)
            if (state.samples.length) {
                safeSave(action.storage, action.storageKey, state.samples)
            }
            return {
                ...state,
                isRecording: false,
                isPlaying: false,
                playhead: duration,
                duration,
            }
        }
        case 'recordPose': {
            if (!state.isRecording) return state
            const time = action.now - state.startedAt
            const samples = [...state.samples, { time, pose: action.pose }]
            const duration = time
            return { ...state, samples, duration }
        }
        case 'startPlayback': {
            const samples = state.samples.length
                ? state.samples
                : safeLoad(action.storage, action.storageKey)
            if (!samples.length) return state
            const duration = getDurationFromSamples(samples)
            return {
                ...state,
                samples,
                isPlaying: true,
                isRecording: false,
                startedAt: action.now - state.playhead,
                duration,
            }
        }
        case 'stopPlayback': {
            const duration = state.duration
            const playhead = Math.min(state.playhead, duration)
            return { ...state, isPlaying: false, playhead }
        }
        case 'seek': {
            const duration = state.duration
            const playhead = Math.max(0, Math.min(action.time, duration))
            const startedAt = state.isPlaying ? action.now - playhead : state.startedAt
            return { ...state, playhead, startedAt }
        }
        case 'tick': {
            if (!state.isPlaying) return state
            const playhead = action.now - state.startedAt
            if (playhead >= state.duration) {
                return { ...state, playhead: state.duration, isPlaying: false }
            }
            return { ...state, playhead }
        }
        default:
            return state
    }
}

export const useReplay = ({
    clock = () => performance.now(),
    storage = typeof localStorage !== 'undefined'
        ? (localStorage as StorageLike)
        : {
            getItem: () => null,
            setItem: () => { },
        },
    storageKey = 'rover-replay',
}: ReplayOptions = {}) => {
    const [state, dispatch] = useReducer(reducer, initialState)

    const startRecording = useCallback(() => {
        dispatch({ type: 'startRecording', now: clock() })
    }, [clock])

    const stopRecording = useCallback(() => {
        dispatch({ type: 'stopRecording', now: clock(), storage, storageKey })
    }, [clock, storage, storageKey])

    const recordPose = useCallback(
        (pose: RoverPose) => {
            dispatch({ type: 'recordPose', now: clock(), pose })
        },
        [clock],
    )

    const startPlayback = useCallback(() => {
        dispatch({ type: 'startPlayback', now: clock(), storage, storageKey })
    }, [clock, storage, storageKey])

    const stopPlayback = useCallback(() => {
        dispatch({ type: 'stopPlayback' })
    }, [])

    const seek = useCallback(
        (time: number) => {
            dispatch({ type: 'seek', now: clock(), time })
        },
        [clock],
    )

    const tick = useCallback(() => {
        dispatch({ type: 'tick', now: clock() })
    }, [clock])

    const exportReplay = useCallback(() => {
        const samples = state.samples.length
            ? state.samples
            : storage
                ? safeLoad(storage, storageKey)
                : []
        return JSON.stringify(samples, null, 2)
    }, [state.samples, storage, storageKey])

    const ghostPose = useMemo(() => ghostPoseAt(state.samples, state.playhead), [state.samples, state.playhead])

    const getGhostPoseAtTime = useCallback(
        (time: number) => ghostPoseAt(state.samples, time),
        [state.samples],
    )

    return {
        state,
        startRecording,
        stopRecording,
        recordPose,
        startPlayback,
        stopPlayback,
        seek,
        tick,
        exportReplay,
        ghostPose,
        getGhostPoseAt: getGhostPoseAtTime,
    }
}
