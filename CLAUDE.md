# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Personal blog built with Astro (Fuwari template). Content is stored in Astro content collections under `src/content/posts/` with markdown files.

## Commands

```bash
pnpm dev          # Start dev server at localhost:4321
pnpm build        # Build production site (runs astro build + pagefind)
pnpm check        # Run Astro type checking
pnpm astro ...    # Run Astro CLI commands (e.g., astro add, astro check)
pnpm type-check   # TypeScript validation with isolated declarations
pnpm format       # Format code with Biome
pnpm lint         # Lint code with Biome
pnpm new-post     # Create new post via scripts/new-post.js
```

## Architecture

- **Astro Content Collections**: Blog posts in `src/content/posts/` with frontmatter fields defined in `src/content/config.ts`
- **File-based Routing**: Pages in `src/pages/` including dynamic routes `[...page].astro` and `[...slug].astro`
- **Layouts**: `Layout.astro` (base) and `MainGridLayout.astro` (main grid structure)
- **Components**: Organized by type in `src/components/`:
  - `control/` - UI controls (BackToTop, ButtonLink, Pagination, ButtonTag)
  - `misc/` - Specialized (License, ImageWrapper, Markdown)
  - `widget/` - Sidebar widgets (Profile, TOC, Categories, Tags, SideBar, etc.)
  - Svelte components: `Search.svelte`, `LightDarkSwitch.svelte`, `ArchivePanel.svelte`, `DisplaySettings.svelte`
- **Plugins**: Custom remark/rehype plugins in `src/plugins/`:
  - `expressive-code/` - Language badge and custom copy button
  - `rehype-component-*.mjs` - Admonitions and GitHub card components
  - `remark-*.js` - Reading time, excerpt, directive parsing
- **Config**: Site configuration in `src/config.ts` (siteConfig, navBarConfig, profileConfig, licenseConfig, expressiveCodeConfig)
- **i18n**: Translation system in `src/i18n/` with per-language files under `languages/`
- **Styles**: Stylus and CSS in `src/styles/` (variables, markdown, transitions, etc.)
- **Utilities**: Helper functions in `src/utils/` (date, url, content, setting utilities)

## Markdown Extensions

Custom directives are processed via remark/rehype plugins to render admonitions (note, tip, important, caution, warning) and GitHub repository cards. Configure in `astro.config.mjs` under `markdown.remarkPlugins` and `markdown.rehypePlugins`.

## Build Pipeline

1. `astro build` compiles Astro pages and content
2. `pagefind` indexes the built site for search
3. Output goes to `dist/` directory

## Code Style

Biome is configured with:
- Tab indentation
- Double quotes for JS/TS
- Strict lint rules (no unused variables in framework files disabled for .astro/.svelte)
