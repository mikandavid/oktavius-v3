import { describe, expect, it } from 'vitest';

import { isValidBic, isValidIban, normalizeBankIdentifier } from './bankIdentifiers';

describe('normalizeBankIdentifier', () => {
  it('strips spaces and uppercases', () => {
    expect(normalizeBankIdentifier(' at61 1904 3002 3457 3201 ')).toBe('AT611904300234573201');
  });
});

describe('isValidIban', () => {
  it('accepts a valid IBAN (with spacing)', () => {
    expect(isValidIban('AT61 1904 3002 3457 3201')).toBe(true);
    expect(isValidIban('DE89370400440532013000')).toBe(true);
  });

  it('rejects a wrong checksum', () => {
    expect(isValidIban('AT61 1904 3002 3457 3202')).toBe(false);
  });

  it('rejects malformed input', () => {
    expect(isValidIban('')).toBe(false);
    expect(isValidIban('ABC')).toBe(false);
    expect(isValidIban('1234567890123456')).toBe(false);
  });
});

describe('isValidBic', () => {
  it('accepts 8- and 11-char BICs', () => {
    expect(isValidBic('GIBAATWWXXX')).toBe(true);
    expect(isValidBic('DEUTDEFF')).toBe(true);
    expect(isValidBic('gibaatww')).toBe(true);
  });

  it('rejects malformed BICs', () => {
    expect(isValidBic('')).toBe(false);
    expect(isValidBic('GIBA1TWW')).toBe(false);
    expect(isValidBic('TOOLONGBICVALUE')).toBe(false);
  });
});
