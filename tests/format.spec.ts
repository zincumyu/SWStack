import { describe, expect, it } from 'vitest'
import { formatCompact, formatNumber } from '@/utils/format'

describe('format helpers', () => {
  it('formats numbers with thousands separators', () => {
    expect(formatNumber(1234567)).toBe('1,234,567')
  })

  it('compacts large counts', () => {
    expect(formatCompact(999)).toBe('999')
    expect(formatCompact(1500)).toBe('1.5k')
    expect(formatCompact(2000)).toBe('2k')
    expect(formatCompact(3_400_000)).toBe('3.4m')
  })
})
