import type { CSSProperties } from 'react'

interface SliderProps {
    value: number
    min: number
    max: number
    step?: number
    onChange: (value: number) => void
    ariaValueText?: string
    disabled?: boolean
    color?: 'orange' | 'purple' | 'slate'
}

const COLOR_MAP: Record<NonNullable<SliderProps['color']>, { fill: string; track: string }> = {
    orange: { fill: '#f97316', track: '#1f2937' },
    purple: { fill: '#a855f7', track: '#1f2937' },
    slate: { fill: '#e2e8f0', track: '#1f2937' },
}

const Slider = ({
    value,
    min,
    max,
    step = 1,
    onChange,
    ariaValueText,
    disabled = false,
    color = 'orange',
}: SliderProps) => {
    const clamped = Math.min(Math.max(value, min), max)
    const percent = ((clamped - min) / (max - min || 1)) * 100
    const { fill, track } = COLOR_MAP[color]

    const style: CSSProperties = {
        background: `linear-gradient(to right, ${fill} ${percent}%, ${track} ${percent}%)`,
        ['--slider-thumb' as string]: fill,
        ['--slider-track' as string]: track,
    }

    return (
        <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={clamped}
            onChange={(event) => onChange(Number(event.target.value))}
            aria-valuetext={ariaValueText}
            disabled={disabled}
            className="slider-input h-3 w-full cursor-pointer rounded-full focus-visible:outline-2 focus-visible:outline-orange-400 disabled:cursor-not-allowed disabled:opacity-60"
            style={style}
        />
    )
}

export default Slider
