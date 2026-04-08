# Privacy Policy — Prompt Compiler

**Last updated:** April 7, 2026

## Overview

Prompt Compiler is a Chrome Extension that transforms raw ideas into structured, expert-level prompts. This privacy policy explains how we handle your data.

## Data Collection

### What We Collect
- **Prompt text**: The ideas you type into the extension are processed locally in your browser. They are never sent to our servers.
- **Compilation results**: Stored locally in your browser's `chrome.storage` for history purposes (up to 200 entries).
- **User preferences**: Theme, audience level, domain preferences, and other settings are stored locally.

### What We Do NOT Collect
- We do **not** collect analytics, telemetry, or usage statistics.
- We do **not** store or transmit personal information.
- We do **not** track your browsing history or activity.
- We do **not** use cookies for tracking purposes.

## Third-Party Services

### Groq API (Optional)
When you **optionally** enable the Hybrid LLM Mode and provide your own Groq API key:
- Your prompt text is sent to the [Groq API](https://groq.com) for enhanced intent analysis.
- Groq processes the text according to their [privacy policy](https://groq.com/privacy-policy/).
- Your API key is stored in encrypted session storage and is never transmitted to our servers.
- You can disable this feature at any time in the extension settings.

**If you do not enable LLM mode**, all processing happens entirely offline in your browser.

## Permissions Justification

| Permission | Why We Need It |
|------------|---------------|
| `storage` | Store settings, compilation history, and preferences locally |
| `activeTab` | Access the current tab to insert compiled prompts into AI platforms |
| `scripting` | Inject compiled text into AI chat interfaces (ChatGPT, Claude, Gemini, etc.) |
| `contextMenus` | Right-click "Compile with Prompt Compiler" on selected text |
| `sidePanel` | Optional side panel view for persistent access |

## Host Permissions

| Host | Why We Need It |
|------|---------------|
| `https://api.groq.com/*` | Optional: Only used when you enable Hybrid LLM mode and provide your API key |

## Data Retention

- All data is stored locally in your browser using `chrome.storage.local` and `chrome.storage.session`.
- You can clear all data at any time via the extension's History → Clear All button.
- Uninstalling the extension removes all stored data.

## Children's Privacy

This extension does not knowingly collect information from children under 13.

## Changes to This Policy

We may update this privacy policy from time to time. Changes will be reflected in the "Last updated" date above.

## Contact

For questions about this privacy policy, please open an issue on the project's GitHub repository.
