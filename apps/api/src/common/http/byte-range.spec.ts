import { describe, expect, it } from 'vitest';
import { parseRangeHeader } from './byte-range.js';

describe('byte-range', () => {
  describe('parseRangeHeader', () => {
    it('returns null when header is absent or invalid', () => {
      expect(parseRangeHeader(undefined, 1000)).toBeNull();
      expect(parseRangeHeader('', 1000)).toBeNull();
      expect(parseRangeHeader('items=0-10', 1000)).toBeNull();
      expect(parseRangeHeader('invalid', 1000)).toBeNull();
    });

    it('parses explicit byte ranges', () => {
      expect(parseRangeHeader('bytes=0-499', 1000)).toEqual({
        start: 0,
        end: 499,
      });
      expect(parseRangeHeader('bytes=500-999', 1000)).toEqual({
        start: 500,
        end: 999,
      });
    });

    it('parses prefix byte ranges', () => {
      expect(parseRangeHeader('bytes=500-', 1000)).toEqual({
        start: 500,
        end: 999,
      });
    });

    it('parses suffix byte ranges', () => {
      expect(parseRangeHeader('bytes=-300', 1000)).toEqual({
        start: 700,
        end: 999,
      });
    });

    it('clamps an explicit end at or past the end of the content', () => {
      expect(parseRangeHeader('bytes=0-1000', 1000)).toEqual({
        start: 0,
        end: 999,
      });
      expect(parseRangeHeader('bytes=0-1048575', 32)).toEqual({
        start: 0,
        end: 31,
      });
      expect(parseRangeHeader('bytes=10-99999', 32)).toEqual({
        start: 10,
        end: 31,
      });
      expect(parseRangeHeader('bytes=999-5000', 1000)).toEqual({
        start: 999,
        end: 999,
      });
    });

    it('keeps a start past the end, an inverted range and an empty resource unsatisfiable', () => {
      expect(parseRangeHeader('bytes=32-40', 32)).toBe('unsatisfiable');
      expect(parseRangeHeader('bytes=20-5', 32)).toBe('unsatisfiable');
      expect(parseRangeHeader('bytes=0-10', 0)).toBe('unsatisfiable');
    });

    it('returns unsatisfiable for out-of-bounds or inverted ranges', () => {
      expect(parseRangeHeader('bytes=1000-2000', 1000)).toBe('unsatisfiable');
      expect(parseRangeHeader('bytes=500-200', 1000)).toBe('unsatisfiable');
      expect(parseRangeHeader('bytes=-0', 1000)).toBe('unsatisfiable');
      expect(parseRangeHeader('bytes=1500-', 1000)).toBe('unsatisfiable');
    });
  });
});
