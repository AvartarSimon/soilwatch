/**
 * Seeded random number generator for deterministic results
 */
export class SeededRandom {
  private seed: number;

  constructor(seed: number) {
    this.seed = seed;
  }

  next(): number {
    // Linear congruential generator
    this.seed = (this.seed * 9301 + 49297) % 233280;
    return this.seed / 233280;
  }

  /**
   * Returns a random integer between min (inclusive) and max (inclusive)
   */
  nextInt(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }

  /**
   * Returns a random float between min (inclusive) and max (exclusive)
   */
  nextFloat(min: number, max: number): number {
    return min + this.next() * (max - min);
  }
}

/**
 * Create a simple hash from a string
 */
export const hashString = (str: string): number => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
};

/**
 * Create a seeded random generator from a seed value
 */
export const createSeededRandom = (seed: number | string): SeededRandom => {
  const numericSeed = typeof seed === 'string' ? hashString(seed) : seed;
  return new SeededRandom(numericSeed);
};
