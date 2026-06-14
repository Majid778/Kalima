import { swipeDirectionToGrade } from '../swipeGrade';

describe('swipeDirectionToGrade', () => {
  const threshold = 64;

  it('maps horizontal swipes past the threshold to good and again', () => {
    expect(swipeDirectionToGrade(65, 0, threshold)).toBe('good');
    expect(swipeDirectionToGrade(-65, 0, threshold)).toBe('again');
  });

  it('maps vertical swipes past the threshold to easy and hard', () => {
    expect(swipeDirectionToGrade(0, -65, threshold)).toBe('easy');
    expect(swipeDirectionToGrade(0, 65, threshold)).toBe('hard');
  });

  it('returns null when the dominant axis does not cross the threshold', () => {
    expect(swipeDirectionToGrade(63, 0, threshold)).toBeNull();
    expect(swipeDirectionToGrade(0, -63, threshold)).toBeNull();
    expect(swipeDirectionToGrade(40, 52, threshold)).toBeNull();
  });

  it('uses the dominant axis when both axes cross the threshold', () => {
    expect(swipeDirectionToGrade(90, -120, threshold)).toBe('easy');
    expect(swipeDirectionToGrade(-120, 90, threshold)).toBe('again');
  });

  it('treats the exact threshold as not committed yet', () => {
    expect(swipeDirectionToGrade(64, 0, threshold)).toBeNull();
    expect(swipeDirectionToGrade(0, 64, threshold)).toBeNull();
  });
});