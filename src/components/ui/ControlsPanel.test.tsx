import { render } from '@testing-library/react'
import ControlsPanel from './ControlsPanel'

const mockControls = {
  driveEnabled: true,
  speed: 4,
  setSpeed: () => {},
  toggleDrive: () => {},
  reset: () => {},
  resetSignal: 0,
  getInputState: () => ({ forward: false, backward: false, left: false, right: false }),
}

const pose = { position: [1, 2, 3] as [number, number, number], heading: Math.PI / 2 }

describe('ControlsPanel', () => {
  it('renders status and buttons', () => {
    const { getByText } = render(
      <ControlsPanel
        controls={mockControls}
        pose={pose}
        onResetCamera={() => {}}
        onStartRecord={() => {}}
        onStopRecord={() => {}}
        isRecording={false}
        onStartPlayback={() => {}}
        onStopPlayback={() => {}}
        isPlaying={false}
        hasRecording={false}
      />,
    )
    expect(getByText('Interactive Lab')).toBeInTheDocument()
    expect(getByText('Driving: ON')).toBeInTheDocument()
    expect(getByText('Reset Camera')).toBeInTheDocument()
  })
})

