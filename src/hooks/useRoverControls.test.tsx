import { renderHook, act } from '@testing-library/react-hooks'
import { useRoverControls } from './useRoverControls'

describe('useRoverControls', () => {
  it('toggles drive and clears keys on disable', () => {
    const { result } = renderHook(() => useRoverControls(4))
    act(() => {
      result.current.toggleDrive()
    })
    expect(result.current.driveEnabled).toBe(true)

    act(() => {
      result.current.getInputState().forward = true
      result.current.toggleDrive()
    })
    expect(result.current.driveEnabled).toBe(false)
    expect(result.current.getInputState()).toEqual({
      forward: false,
      backward: false,
      left: false,
      right: false,
    })
  })

  it('resets speed and drive state on reset', () => {
    const { result } = renderHook(() => useRoverControls(3))
    act(() => {
      result.current.toggleDrive()
      result.current.setSpeed(9)
      result.current.reset()
    })
    expect(result.current.driveEnabled).toBe(false)
    expect(result.current.speed).toBe(3)
  })
})

