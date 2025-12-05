import { act } from 'react'
import { render } from '@testing-library/react'
import { forwardRef, useImperativeHandle } from 'react'
import { useRoverControls } from './useRoverControls'

type ControlsSnapshot = ReturnType<typeof useRoverControls>

const ControlsHarness = forwardRef<ControlsSnapshot | null, { initialSpeed?: number }>(
  ({ initialSpeed }, ref) => {
    const controls = useRoverControls(initialSpeed ?? 4)
    useImperativeHandle(ref, () => controls, [controls])
    return null
  },
)
ControlsHarness.displayName = 'ControlsHarness'

describe('useRoverControls', () => {
  it('toggles drive and clears keys on disable', () => {
    const ref = { current: null as ControlsSnapshot | null }
    render(<ControlsHarness ref={ref} initialSpeed={4} />)

    act(() => {
      ref.current?.toggleDrive()
    })
    expect(ref.current?.driveEnabled).toBe(true)

    act(() => {
      const input = ref.current?.getInputState()
      if (input) input.forward = true
      ref.current?.toggleDrive()
    })
    expect(ref.current?.driveEnabled).toBe(false)
    expect(ref.current?.getInputState()).toEqual({
      forward: false,
      backward: false,
      left: false,
      right: false,
    })
  })

  it('resets speed and drive state on reset', () => {
    const ref = { current: null as ControlsSnapshot | null }
    render(<ControlsHarness ref={ref} initialSpeed={3} />)

    act(() => {
      ref.current?.toggleDrive()
      ref.current?.setSpeed(9)
      ref.current?.reset()
    })

    expect(ref.current?.driveEnabled).toBe(false)
    expect(ref.current?.speed).toBe(3)
  })
})

