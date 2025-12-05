import { useSyncExternalStore } from 'react'
import { ROVER_TUNING_PRESETS, type RoverTuning } from '../constants/rover'
import { CAMERA_PRESETS } from '../constants/camera'
import { MINIMAP_DEFAULT_ZOOM, MINIMAP_ZOOM_RANGE } from '../constants/minimap'

export type SettingsState = {
    rover: RoverTuning
    camera: {
        chaseOffset: [number, number, number]
        topHeight: number
    }
    minimap: {
        defaultZoom: number
        zoomRange: [number, number]
    }
}

const defaultState: SettingsState = {
    rover: ROVER_TUNING_PRESETS.default,
    camera: {
        chaseOffset: CAMERA_PRESETS.chase.offset,
        topHeight: CAMERA_PRESETS.top.position[1],
    },
    minimap: {
        defaultZoom: MINIMAP_DEFAULT_ZOOM,
        zoomRange: MINIMAP_ZOOM_RANGE,
    },
}

type Listener = () => void
const listeners = new Set<Listener>()
let state: SettingsState = defaultState

const emit = () => {
    listeners.forEach((l) => l())
}

export const settingsStore = {
    subscribe: (listener: Listener) => {
        listeners.add(listener)
        return () => listeners.delete(listener)
    },
    getSnapshot: () => state,
    setState: (next: SettingsState) => {
        state = next
        emit()
    },
}

export const setSettings = (partial: Partial<SettingsState>) => {
    settingsStore.setState({ ...state, ...partial })
}

export const setRoverPreset = (name: string) => {
    const preset = ROVER_TUNING_PRESETS[name] ?? ROVER_TUNING_PRESETS.default
    setSettings({ rover: preset })
}

export const updateRoverTuning = (partial: Partial<RoverTuning>) => {
    setSettings({ rover: { ...state.rover, ...partial } })
}

export const useSettings = () => {
    return useSyncExternalStore(settingsStore.subscribe, settingsStore.getSnapshot)
}
