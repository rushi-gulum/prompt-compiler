import { installChromeMock, resetChromeMock, chromeMock } from '../mocks/chrome.js';
import { getSettings, updateSettings, initDefaults, resetToDefaults, DEFAULT_SETTINGS } from '../../src/extension/shared/settings.js';

beforeAll(() => {
  installChromeMock();
});

beforeEach(() => {
  resetChromeMock();
});

describe('Settings Module', () => {
  test('DEFAULT_SETTINGS has all required fields', () => {
    expect(DEFAULT_SETTINGS.defaultAudienceLevel).toBe('professional');
    expect(DEFAULT_SETTINGS.preferredDomain).toBeNull();
    expect(DEFAULT_SETTINGS.theme).toBe('system');
    expect(DEFAULT_SETTINGS.enableContentScript).toBe(true);
    expect(DEFAULT_SETTINGS.keyboardShortcut).toBe('Ctrl+Shift+P');
  });

  test('getSettings returns defaults when storage is empty', async () => {
    const settings = await getSettings();
    expect(settings).toEqual(DEFAULT_SETTINGS);
  });

  test('initDefaults writes defaults to storage when empty', async () => {
    await initDefaults();
    expect(chromeMock.storage.local.set).toHaveBeenCalledWith({
      prompt_compiler_settings: DEFAULT_SETTINGS,
    });
  });

  test('initDefaults does NOT overwrite existing settings', async () => {
    const custom = { ...DEFAULT_SETTINGS, theme: 'dark' as const };
    await chromeMock.storage.local.set({ prompt_compiler_settings: custom });
    chromeMock.storage.local.set.mockClear();

    await initDefaults();
    // set should not be called since settings already exist
    expect(chromeMock.storage.local.set).not.toHaveBeenCalled();
  });

  test('updateSettings merges partial updates', async () => {
    await initDefaults();
    await updateSettings({ theme: 'dark' });
    const settings = await getSettings();
    expect(settings.theme).toBe('dark');
    expect(settings.defaultAudienceLevel).toBe('professional'); // unchanged
  });

  test('updateSettings preserves other fields', async () => {
    await initDefaults();
    await updateSettings({ enableContentScript: false });
    const settings = await getSettings();
    expect(settings.enableContentScript).toBe(false);
    expect(settings.theme).toBe('system');
    expect(settings.keyboardShortcut).toBe('Ctrl+Shift+P');
  });

  test('resetToDefaults restores factory settings', async () => {
    await initDefaults();
    await updateSettings({ theme: 'dark', enableContentScript: false });
    await resetToDefaults();
    const settings = await getSettings();
    expect(settings).toEqual(DEFAULT_SETTINGS);
  });

  test('getSettings returns merged defaults for partial storage', async () => {
    // Simulate storage with only some fields (e.g., from older version)
    await chromeMock.storage.local.set({
      prompt_compiler_settings: { theme: 'light' },
    });
    const settings = await getSettings();
    expect(settings.theme).toBe('light');
    expect(settings.defaultAudienceLevel).toBe('professional'); // from defaults
  });
});
