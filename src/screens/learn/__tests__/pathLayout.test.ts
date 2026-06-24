import {
  buildPathLayout,
  stationX,
  stationY,
} from '../pathLayout';

describe('learn path layout', () => {
  it('alternates stations left, right, then center', () => {
    const amplitude = 72;

    expect([0, 1, 2, 3, 4, 5].map((index) => stationX(index, amplitude))).toEqual([
      -72,
      72,
      0,
      -72,
      72,
      0,
    ]);
  });

  it('keeps station centers inside horizontal bounds', () => {
    const layout = buildPathLayout(6, {
      width: 320,
      nodeSize: 80,
      amplitude: 220,
      spacing: 132,
      topPadding: 48,
      bottomPadding: 64,
    });

    for (const station of layout.stations) {
      expect(station.centerX).toBeGreaterThanOrEqual(40);
      expect(station.centerX).toBeLessThanOrEqual(280);
      expect(station.x).toBeGreaterThanOrEqual(0);
      expect(station.x + station.size).toBeLessThanOrEqual(320);
    }
  });

  it('uses stable vertical spacing between stations', () => {
    expect(stationY(0, 128)).toBe(0);
    expect(stationY(3, 128)).toBe(384);

    const layout = buildPathLayout(4, {
      width: 360,
      nodeSize: 76,
      amplitude: 88,
      spacing: 140,
      topPadding: 52,
      bottomPadding: 72,
    });

    // Ascent: index 0 (first level) is at the bottom, later levels climb up.
    expect(layout.stations.map((station) => station.centerY)).toEqual([
      510,
      370,
      230,
      90,
    ]);
    expect(layout.contentHeight).toBe(620);
  });
});