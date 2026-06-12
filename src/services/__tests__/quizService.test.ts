import {
  mulberry32,
  shuffle,
  generateQuiz,
  gradeQuiz,
  type QuizWord,
  type QuizQuestion,
} from '../quizService';

const TODAY = '2025-01-01';

describe('quizService', () => {
  describe('mulberry32', () => {
    it('produces deterministic sequences for the same seed', () => {
      const rng1 = mulberry32(12345);
      const rng2 = mulberry32(12345);

      const seq1 = [rng1(), rng1(), rng1()];
      const seq2 = [rng2(), rng2(), rng2()];

      expect(seq1).toEqual(seq2);
    });

    it('produces different sequences for different seeds', () => {
      const rng1 = mulberry32(12345);
      const rng2 = mulberry32(54321);

      const seq1 = [rng1(), rng1(), rng1()];
      const seq2 = [rng2(), rng2(), rng2()];

      expect(seq1).not.toEqual(seq2);
    });

    it('produces values between 0 and 1', () => {
      const rng = mulberry32(99999);
      for (let i = 0; i < 100; i++) {
        const value = rng();
        expect(value).toBeGreaterThanOrEqual(0);
        expect(value).toBeLessThan(1);
      }
    });
  });

  describe('shuffle', () => {
    it('preserves array length', () => {
      const rng = mulberry32(123);
      const arr = [1, 2, 3, 4, 5];
      const shuffled = shuffle(arr, rng);
      expect(shuffled.length).toBe(arr.length);
    });

    it('shuffles deterministically with same seed', () => {
      const arr = ['a', 'b', 'c', 'd'];
      const rng1 = mulberry32(456);
      const rng2 = mulberry32(456);

      const shuffled1 = shuffle(arr, rng1);
      const shuffled2 = shuffle(arr, rng2);

      expect(shuffled1).toEqual(shuffled2);
    });

    it('does not modify the original array', () => {
      const original = [1, 2, 3];
      const copy = [...original];
      const rng = mulberry32(789);
      shuffle(original, rng);
      expect(original).toEqual(copy);
    });
  });

  describe('generateQuiz', () => {
    const levelWords: QuizWord[] = [
      { id: 1, arabic: 'القرآن', transliteration: 'quran', meaning: 'the Quran', levelId: 1 },
      { id: 2, arabic: 'علم', transliteration: 'ilm', meaning: 'knowledge', levelId: 1 },
      { id: 3, arabic: 'دين', transliteration: 'deen', meaning: 'religion', levelId: 1 },
      { id: 4, arabic: 'نور', transliteration: 'nur', meaning: 'light', levelId: 1 },
      { id: 5, arabic: 'حكمة', transliteration: 'hikma', meaning: 'wisdom', levelId: 1 },
    ];

    const globalPool: QuizWord[] = [
      { id: 100, arabic: 'كتاب', transliteration: 'kitab', meaning: 'book', levelId: 2 },
      { id: 101, arabic: 'قلم', transliteration: 'qalam', meaning: 'pen', levelId: 2 },
    ];

    it('generates expected number of questions', () => {
      const rng = mulberry32(111);
      const quiz = generateQuiz(levelWords, globalPool, rng, 10);
      expect(quiz.length).toBeLessThanOrEqual(10);
    });

    it('alternates between MC and matching questions', () => {
      const rng = mulberry32(222);
      const quiz = generateQuiz(levelWords, globalPool, rng, 10);
      
      let mcCount = 0;
      let matchingCount = 0;
      for (const q of quiz) {
        if (q.kind === 'multiple-choice') mcCount++;
        if (q.kind === 'matching') matchingCount++;
      }
      
      expect(mcCount + matchingCount).toBe(quiz.length);
      expect(mcCount).toBeGreaterThan(0);
      expect(matchingCount).toBeGreaterThan(0);
    });

    it('generates MC questions with correct structure', () => {
      const rng = mulberry32(333);
      const quiz = generateQuiz(levelWords, globalPool, rng, 20);
      
      for (const q of quiz) {
        if (q.kind === 'multiple-choice') {
          expect(q.options.length).toBe(4);
          expect(q.options).toContain(q.correct);
          // Check no duplicates
          const unique = new Set(q.options);
          expect(unique.size).toBe(q.options.length);
        }
      }
    });

    it('generates matching questions with 4 pairs each', () => {
      const rng = mulberry32(444);
      const quiz = generateQuiz(levelWords, globalPool, rng, 20);
      
      for (const q of quiz) {
        if (q.kind === 'matching') {
          expect(q.pairs.length).toBe(4);
          expect(q.meaningBank.length).toBe(4);
        }
      }
    });

    it('gracefully handles level with < 4 words', () => {
      const smallLevel: QuizWord[] = [
        { id: 1, arabic: 'أ', transliteration: 'a', meaning: 'aleph', levelId: 1 },
        { id: 2, arabic: 'ب', transliteration: 'b', meaning: 'ba', levelId: 1 },
      ];
      
      const rng = mulberry32(555);
      const quiz = generateQuiz(smallLevel, globalPool, rng, 5);
      
      // Should not crash, should be all MC
      expect(quiz.length).toBeGreaterThan(0);
      for (const q of quiz) {
        expect(q.kind).toBe('multiple-choice');
      }
    });

    it('produces deterministic output with same seed', () => {
      const rng1 = mulberry32(666);
      const quiz1 = generateQuiz(levelWords, globalPool, rng1, 10);
      
      const rng2 = mulberry32(666);
      const quiz2 = generateQuiz(levelWords, globalPool, rng2, 10);
      
      expect(quiz1.length).toBe(quiz2.length);
      for (let i = 0; i < quiz1.length; i++) {
        const q1 = quiz1[i];
        const q2 = quiz2[i];
        if (q1.kind === 'multiple-choice' && q2.kind === 'multiple-choice') {
          expect(q1.wordId).toBe(q2.wordId);
          expect(q1.options).toEqual(q2.options);
        }
      }
    });
  });

  describe('gradeQuiz', () => {
    it('returns 100% for all correct answers', () => {
      const questions: QuizQuestion[] = [
        {
          kind: 'multiple-choice',
          wordId: 1,
          arabic: 'علم',
          transliteration: 'ilm',
          correct: 'knowledge',
          options: ['knowledge', 'book', 'pen', 'light'],
        },
        {
          kind: 'multiple-choice',
          wordId: 2,
          arabic: 'كتاب',
          transliteration: 'kitab',
          correct: 'book',
          options: ['knowledge', 'book', 'pen', 'light'],
        },
      ];

      const answers: (string | Record<number, string>)[] = ['knowledge', 'book'];
      const result = gradeQuiz(questions, answers);

      expect(result.score).toBe(2);
      expect(result.total).toBe(2);
      expect(result.percent).toBe(1);
      expect(result.passed).toBe(true);
    });

    it('passes at 80% threshold', () => {
      const questions: QuizQuestion[] = Array(5)
        .fill(null)
        .map((_, i) => ({
          kind: 'multiple-choice' as const,
          wordId: i,
          arabic: 'word',
          transliteration: 'word',
          correct: 'meaning',
          options: ['meaning', 'other1', 'other2', 'other3'],
        }));

      // 4/5 = 80%
      const answers: (string | Record<number, string>)[] = ['meaning', 'meaning', 'meaning', 'meaning', 'wrong'];
      const result = gradeQuiz(questions, answers);

      expect(result.percent).toBe(0.8);
      expect(result.passed).toBe(true);
    });

    it('fails at 79% threshold', () => {
      const questions: QuizQuestion[] = Array(100)
        .fill(null)
        .map((_, i) => ({
          kind: 'multiple-choice' as const,
          wordId: i,
          arabic: 'word',
          transliteration: 'word',
          correct: 'meaning',
          options: ['meaning', 'other1', 'other2', 'other3'],
        }));

      // 79/100 = 0.79
      const answers: (string | Record<number, string>)[] = Array(79)
        .fill('meaning')
        .concat(Array(21).fill('wrong'));
      const result = gradeQuiz(questions, answers);

      expect(result.percent).toBeLessThan(0.8);
      expect(result.passed).toBe(false);
    });

    it('handles matching questions with atomic scoring', () => {
      const matchingQ: QuizQuestion = {
        kind: 'matching',
        pairs: [
          { wordId: 1, arabic: 'أ', meaning: 'aleph' },
          { wordId: 2, arabic: 'ب', meaning: 'ba' },
        ],
        meaningBank: ['aleph', 'ba'],
      };

      // All correct
      const answersAllCorrect: (string | Record<number, string>)[] = [
        { 1: 'aleph', 2: 'ba' },
      ];
      const result1 = gradeQuiz([matchingQ], answersAllCorrect);
      expect(result1.score).toBe(1);
      expect(result1.total).toBe(1);

      // One wrong
      const answersPartial: (string | Record<number, string>)[] = [
        { 1: 'ba', 2: 'ba' },
      ];
      const result2 = gradeQuiz([matchingQ], answersPartial);
      expect(result2.score).toBe(0);
      expect(result2.total).toBe(1);
    });

    it('returns 0% for no correct answers', () => {
      const questions: QuizQuestion[] = [
        {
          kind: 'multiple-choice',
          wordId: 1,
          arabic: 'علم',
          transliteration: 'ilm',
          correct: 'knowledge',
          options: ['knowledge', 'book', 'pen', 'light'],
        },
      ];

      const answers: (string | Record<number, string>)[] = ['wrong'];
      const result = gradeQuiz(questions, answers);

      expect(result.score).toBe(0);
      expect(result.percent).toBe(0);
      expect(result.passed).toBe(false);
    });

    it('handles empty quiz', () => {
      const result = gradeQuiz([], []);
      expect(result.score).toBe(0);
      expect(result.total).toBe(0);
      expect(result.percent).toBe(0);
      expect(result.passed).toBe(false);
    });
  });
});
