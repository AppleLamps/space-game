import { render } from '@testing-library/react'
import HudOverlay from './HudOverlay'

const pose = { position: [0, 0, 0] as [number, number, number], heading: Math.PI / 4 }

describe('HudOverlay', () => {
  it('renders telemetry values', () => {
    const { getByText } = render(
      <HudOverlay pose={pose} speed={5} driveEnabled={true} isRecording={false} isPlaying={true} />,
    )
    expect(getByText('Telemetry')).toBeInTheDocument()
    expect(getByText('5.0 m/s')).toBeInTheDocument()
    expect(getByText('On')).toBeInTheDocument()
    expect(getByText(/Playback/)).toBeInTheDocument()
  })
})

