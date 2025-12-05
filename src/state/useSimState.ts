import { useReducer } from 'react'

type Mode = 'idle' | 'drive' | 'record' | 'play'

type Event =
    | { type: 'toggleDrive' }
    | { type: 'startRecord' }
    | { type: 'stopRecord' }
    | { type: 'startPlayback' }
    | { type: 'stopPlayback' }
    | { type: 'reset' }

interface SimState {
    mode: Mode
}

const initialState: SimState = { mode: 'idle' }

const transition = (state: SimState, event: Event): SimState => {
    switch (event.type) {
        case 'toggleDrive':
            if (state.mode === 'play') return { mode: 'drive' }
            return state.mode === 'idle' ? { mode: 'drive' } : { mode: 'idle' }
        case 'startRecord':
            if (state.mode === 'play') return state
            return { mode: 'record' }
        case 'stopRecord':
            if (state.mode === 'record') return { mode: 'drive' }
            return state
        case 'startPlayback':
            return { mode: 'play' }
        case 'stopPlayback':
            return { mode: 'drive' }
        case 'reset':
            return initialState
        default:
            return state
    }
}

export const useSimState = () => {
    const [state, dispatch] = useReducer(transition, initialState)
    const send = (event: Event) => dispatch(event)
    const allowInput = state.mode === 'drive' || state.mode === 'record'
    const isRecording = state.mode === 'record'
    const isPlaying = state.mode === 'play'
    return { state, send, allowInput, isRecording, isPlaying }
}
