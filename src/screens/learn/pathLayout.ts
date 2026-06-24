export type StationAlignment = 'left' | 'right' | 'center';

export interface PathLayoutOptions {
  width: number;
  nodeSize: number;
  amplitude: number;
  spacing: number;
  topPadding: number;
  bottomPadding: number;
}

export interface PathStationLayout {
  index: number;
  alignment: StationAlignment;
  x: number;
  y: number;
  centerX: number;
  centerY: number;
  size: number;
}

export interface PathLayout {
  stations: PathStationLayout[];
  contentHeight: number;
}

const ALIGNMENTS: StationAlignment[] = ['left', 'right', 'center'];

export function stationAlignment(index: number): StationAlignment {
  return ALIGNMENTS[positiveModulo(index, ALIGNMENTS.length)];
}

export function stationX(index: number, amplitude: number): number {
  const safeAmplitude = Math.abs(amplitude);

  switch (stationAlignment(index)) {
    case 'left':
      return -safeAmplitude;
    case 'right':
      return safeAmplitude;
    case 'center':
    default:
      return 0;
  }
}

export function stationY(index: number, spacing: number): number {
  return Math.max(0, index) * Math.max(0, spacing);
}

export function buildPathLayout(count: number, options: PathLayoutOptions): PathLayout {
  const stationCount = Math.max(0, Math.floor(count));
  const nodeSize = Math.max(1, options.nodeSize);
  const radius = nodeSize / 2;
  const width = Math.max(nodeSize, options.width);
  const centerX = width / 2;
  const maxOffset = Math.max(0, centerX - radius);
  const amplitude = Math.min(Math.abs(options.amplitude), maxOffset);
  const topPadding = Math.max(0, options.topPadding);
  const bottomPadding = Math.max(0, options.bottomPadding);

  // Index 0 is the FIRST level and sits at the BOTTOM (the earth); later levels
  // climb upward toward the summit, so the path reads as an ascent into light.
  const stations = Array.from({ length: stationCount }, (_, index) => {
    const cx = centerX + stationX(index, amplitude);
    const cy = topPadding + radius + stationY(stationCount - 1 - index, options.spacing);

    return {
      index,
      alignment: stationAlignment(index),
      x: cx - radius,
      y: cy - radius,
      centerX: cx,
      centerY: cy,
      size: nodeSize,
    };
  });

  return {
    stations,
    contentHeight:
      stationCount === 0
        ? topPadding + bottomPadding
        : topPadding + bottomPadding + nodeSize + stationY(stationCount - 1, options.spacing),
  };
}

function positiveModulo(value: number, divisor: number): number {
  return ((value % divisor) + divisor) % divisor;
}