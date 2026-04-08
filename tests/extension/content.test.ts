/**
 * @jest-environment jsdom
 */
import { platforms } from '../../src/extension/content/platforms.js';

describe('Platform Adapters', () => {
  test('has 5 platform adapters', () => {
    expect(platforms).toHaveLength(5);
  });

  test('all adapters have required interface methods', () => {
    for (const adapter of platforms) {
      expect(typeof adapter.name).toBe('string');
      expect(typeof adapter.matchUrl).toBe('function');
      expect(typeof adapter.findInputElement).toBe('function');
      expect(typeof adapter.getInputText).toBe('function');
      expect(typeof adapter.setInputText).toBe('function');
      expect(typeof adapter.getButtonAnchor).toBe('function');
    }
  });

  test('ChatGPT adapter matches correct URLs', () => {
    const chatgpt = platforms.find((p) => p.name === 'ChatGPT')!;
    expect(chatgpt.matchUrl('https://chat.openai.com/c/123')).toBe(true);
    expect(chatgpt.matchUrl('https://chatgpt.com/')).toBe(true);
    expect(chatgpt.matchUrl('https://claude.ai/')).toBe(false);
  });

  test('Claude adapter matches correct URLs', () => {
    const claude = platforms.find((p) => p.name === 'Claude')!;
    expect(claude.matchUrl('https://claude.ai/chat/123')).toBe(true);
    expect(claude.matchUrl('https://chatgpt.com/')).toBe(false);
  });

  test('Gemini adapter matches correct URLs', () => {
    const gemini = platforms.find((p) => p.name === 'Gemini')!;
    expect(gemini.matchUrl('https://gemini.google.com/app')).toBe(true);
    expect(gemini.matchUrl('https://google.com/')).toBe(false);
  });

  test('Perplexity adapter matches correct URLs', () => {
    const pplx = platforms.find((p) => p.name === 'Perplexity')!;
    expect(pplx.matchUrl('https://www.perplexity.ai/search')).toBe(true);
    expect(pplx.matchUrl('https://perplexity.ai/')).toBe(true);
    expect(pplx.matchUrl('https://chatgpt.com/')).toBe(false);
  });

  test('each adapter name is unique', () => {
    const names = platforms.map((p) => p.name);
    expect(new Set(names).size).toBe(names.length);
  });

  test('ChatGPT adapter gets/sets textarea text', () => {
    const chatgpt = platforms.find((p) => p.name === 'ChatGPT')!;
    const textarea = document.createElement('textarea');
    textarea.value = 'hello world';
    expect(chatgpt.getInputText(textarea)).toBe('hello world');

    chatgpt.setInputText(textarea, 'new text');
    expect(textarea.value).toBe('new text');
  });

  test('Claude adapter handles contenteditable div', () => {
    const claude = platforms.find((p) => p.name === 'Claude')!;
    const div = document.createElement('div');
    div.textContent = 'test content';
    expect(claude.getInputText(div)).toBe('test content');

    claude.setInputText(div, 'updated');
    expect(div.textContent).toBe('updated');
    expect(div.innerHTML).toBe('<p>updated</p>');
  });
});
