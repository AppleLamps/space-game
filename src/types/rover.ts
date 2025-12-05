export interface RoverPose {
  position: [number, number, number];
  /**
   * Heading in radians, where 0 points toward -Z.
   */
  heading: number;
}

export interface InputState {
  forward: boolean;
  backward: boolean;
  left: boolean;
  right: boolean;
}

