import { describe, it, expect } from 'vitest';
import { getLanguageFromName } from './language';

describe('getLanguageFromName', () => {
  it('maps TypeScript and JavaScript variants', () => {
    expect(getLanguageFromName('app.tsx')).toBe('typescript');
    expect(getLanguageFromName('util.ts')).toBe('typescript');
    expect(getLanguageFromName('main.js')).toBe('javascript');
    expect(getLanguageFromName('bundle.cjs')).toBe('javascript');
  });

  it('maps data and markup formats', () => {
    expect(getLanguageFromName('package.json')).toBe('json');
    expect(getLanguageFromName('README.md')).toBe('markdown');
    expect(getLanguageFromName('index.html')).toBe('html');
    expect(getLanguageFromName('styles.css')).toBe('css');
    expect(getLanguageFromName('ci.yml')).toBe('yaml');
  });

  it('maps systems languages', () => {
    expect(getLanguageFromName('main.go')).toBe('go');
    expect(getLanguageFromName('lib.rs')).toBe('rust');
    expect(getLanguageFromName('Program.cs')).toBe('csharp');
  });

  it('maps shell scripts', () => {
    expect(getLanguageFromName('deploy.sh')).toBe('shell');
    expect(getLanguageFromName('build.ps1')).toBe('powershell');
  });

  it('is case-insensitive', () => {
    expect(getLanguageFromName('DOCKERFILE')).toBe('dockerfile');
    expect(getLanguageFromName('App.TSX')).toBe('typescript');
  });

  it('falls back to plaintext for unknown extensions', () => {
    expect(getLanguageFromName('data.xyz')).toBe('plaintext');
    expect(getLanguageFromName('no-extension')).toBe('plaintext');
  });
});
