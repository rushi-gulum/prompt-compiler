# Chrome Web Store Listing — Prompt Compiler

## Extension Name
Prompt Compiler

## Short Description (132 chars max)
Transform raw ideas into expert-level prompts for ChatGPT, Claude, Gemini, Perplexity & Grok. 87 task types. Instant quality scoring.

## Detailed Description

**Stop writing bad prompts. Let Prompt Compiler do it for you.**

Prompt Compiler is the most advanced prompt engineering tool for Chrome. Type any raw idea — a code review, blog post, data analysis, legal brief — and get a perfectly structured, expert-level prompt in seconds.

**🧠 How It Works**
1. Type your idea in plain language
2. Our 6-stage compilation pipeline analyzes your intent, detects the domain, selects an expert persona, and structures your prompt
3. Get a quality-scored result with role definitions, instructions, constraints, and output format — ready to paste into any AI

**✦ Key Features**
• 87 task types across 15 categories (code, writing, data, legal, medical, education, and more)
• 16 professional domains with specialized expert personas
• 12-criterion quality scoring with visual breakdown
• Auto-enhancement when quality is below threshold
• One-click insert into ChatGPT, Claude, Gemini, Perplexity, and Grok
• Side panel, popup, and context menu access
• Light/Dark/System themes
• Compilation history with search, starring, and domain filtering
• Export as JSON or Markdown
• Import/Export your data for backup and transfer

**⚡ Optional: Hybrid LLM Mode**
Enable the optional Groq API integration for advanced intent analysis on complex prompts. Uses your own API key — we never store or transmit it ourselves.

**🔒 Privacy First**
All processing happens locally in your browser. No analytics, no tracking, no data collection. See our full privacy policy for details.

## Category
Productivity

## Language
English

## Screenshots Required
1. Main popup showing compilation result with quality ring
2. Side-by-side input vs. compiled output comparison
3. Quality breakdown with 12 criteria scores
4. History view with search and domain filtering
5. Settings/Options page with LLM configuration
6. Context menu "Compile with Prompt Compiler" on selected text

## Promotional Images
- Small tile: 440x280px
- Large tile: 920x680px
- Marquee: 1400x560px

## Additional Notes for Review
- Extension uses Manifest V3
- No remote code execution
- All JavaScript is bundled via esbuild
- Content Security Policy: `script-src 'self'; object-src 'none'`
- Host permission `https://api.groq.com/*` is optional and only used when user explicitly enables LLM mode
