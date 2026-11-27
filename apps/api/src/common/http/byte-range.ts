/**
 * Byte range representation for partial content streaming.
 */
export interface ByteRange {
  readonly start: number;
  readonly end: number;
}

/**
 * Parses an HTTP `Range` header (RFC 9110) for a single byte range.
 *
 * Supports:
 * - Explicit ranges: `bytes=0-499`
 * - Prefix ranges: `bytes=500-` (from offset 500 to end of file)
 * - Suffix ranges: `bytes=-300` (last 300 bytes of file)
 *
 * Returns:
 * - `{ start, end }` for a satisfiable byte range.
 * - `null` if the header is absent, malformed, or uses a unit other than `bytes`.
 * - `'unsatisfiable'` if the range cannot be satisfied for the given resource size.
 */
export function parseRangeHeader(
  rangeHeader: string | undefined,
  totalSize: number,
): ByteRange | null | 'unsatisfiable' {
  if (!rangeHeader || typeof rangeHeader !== 'string') {
    return null;
  }

  const match = /^bytes=(\d*)-(\d*)$/.exec(rangeHeader.trim());
  if (!match) {
    return null;
  }

  const [, startStr, endStr] = match;
  if (!startStr && !endStr) {
    return null;
  }

  let start: number;
  let end: number;

  if (!startStr) {
    // Suffix range: bytes=-N (last N bytes)
    const suffixLength = parseInt(endStr, 10);
    if (suffixLength <= 0 || isNaN(suffixLength)) {
      return 'unsatisfiable';
    }
    start = Math.max(0, totalSize - suffixLength);
    end = totalSize - 1;
  } else if (!endStr) {
    // Prefix range: bytes=N- (from offset N to end of file)
    start = parseInt(startStr, 10);
    end = totalSize - 1;
  } else {
    // Explicit range: bytes=N-M
    start = parseInt(startStr, 10);
    // RFC 9110 14.1.2: a last-byte-pos at or past the end of the content is
    // read as the remainder of the content, not as unsatisfiable.
    end = Math.min(parseInt(endStr, 10), totalSize - 1);
  }

  if (
    isNaN(start) ||
    isNaN(end) ||
    start < 0 ||
    start > end ||
    start >= totalSize
  ) {
    return 'unsatisfiable';
  }

  return { start, end };
}
