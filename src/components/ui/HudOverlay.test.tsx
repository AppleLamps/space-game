import { render } from '@testing-library/react'
import HudOverlay from './HudOverlay'

const pose = { position: [0, 0, 0] as [number, number, number], heading: Math.PI / 4 }

describe('HudOverlay', () => {
  it('renders telemetry values', () => {
    const { getByText } = render(
      <HudOverlay
        pose={pose}
        speed={5}
        driveEnabled={true}
        isRecording={false}
        isPlaying={true}
        rpm={120}
        fps={60}
        traction={0.8}
        slipping={false}
        pitch={2}
        roll={-1}
      />,
    )
    expect(getByText('Telemetry')).toBeInTheDocument()
    expect(getByText('5.0 m/s')).toBeInTheDocument()
    expect(getByText(/Drive On/)).toBeInTheDocument()
    expect(getByText(/Sensors/)).toBeInTheDocument()
    expect(getByText('120')).toBeInTheDocument()
  })
})

