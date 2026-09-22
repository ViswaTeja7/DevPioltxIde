import { describe, it, expect, vi, afterEach } from 'vitest';
import { en } from './locales/en';
import { resolveInitialLanguage } from './index';

describe('translation catalogue', () => {
  it('exposes the panel, terminal, explorer and common sections', () => {
    expect(Object.keys(en)).toEqual(
      expect.arrayContaining(['panel', 'terminal', 'explorer', 'common'])
    );
  });

  it('has no empty strings', () => {
    const walk = (value: unknown): string[] =>
      typeof value === 'string'
        ? value.trim()
          ? []
          : ['empty']
        : value && typeof value === 'object'
          ? Object.values(value).flatMap(walk)
          : [];
    expect(walk(en)).toEqual([]);
  });
});

describe('resolveInitialLanguage', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('defaults to English when no locale matches', () => {
    vi.stubGlobal('localStorage', { getItem: () => null });
    vi.stubGlobal('navigator', { language: 'fr-FR' });
    expect(resolveInitialLanguage()).toBe('en');
  });

  it('uses the stored override when it is supported', () => {
    vi.stubGlobal('localStorage', { getItem: () => 'en' });
    vi.stubGlobal('navigator', { language: 'de-DE' });
    expect(resolveInitialLanguage()).toBe('en');
  });

  it('survives an unavailable localStorage', () => {
    vi.stubGlobal('localStorage', {
      getItem: () => {
        throw new Error('blocked');
      }
    });
    vi.stubGlobal('navigator', { language: 'en-US' });
    expect(resolveInitialLanguage()).toBe('en');
  });
});
