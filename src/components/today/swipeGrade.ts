import type { Grade } from '../../services/sm2';

export function swipeDirectionToGrade(
  dx: number,
  dy: number,
  threshold: number,
): Grade | null {
  'worklet';

  const absX = Math.abs(dx);
  const absY = Math.abs(dy);

  if (absX <= threshold && absY <= threshold) {
    return null;
  }

  if (absX > absY) {
    return dx > 0 ? 'good' : 'again';
  }

  return dy > 0 ? 'hard' : 'easy';
}