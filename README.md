# BattleTracker

A Shadowrun 5th Edition combat and initiative tracker. **Originally created by [MerGatto](https://github.com/MerGatto/BattleTracker), updated by [INightborne](https://github.com/INightborne/BattleTracker).** Based on MerGatto's original MIT-licensed project, with original authorship credited in the app.

## Features

- Track participants, initiative rolls, initiative passes, and combat rounds.
- Manage physical and stun condition monitors, wound modifiers, Edge, and interrupt actions.
- Duplicate participants, reorder them outside combat, and undo or redo actions during a session.
- **Automatic local saving:** the entire encounter is saved to the browser whenever its state changes and restored on refresh.
- **Save** manually with the toolbar, or **Export JSON** to download a transferable backup.
- **Import JSON** to resume the encounter on another browser or device. Import confirms before replacing the current encounter.

Autosave uses browser `localStorage`, not cookies. It stays on the device, requires no account, and can be cleared by clearing site data or using private browsing. Export a JSON backup for long-term storage. Import supports BattleTracker's version 1 backup format. Undo/redo history and activity logs are not included in backups, but current combat state, participants, action modifiers, and selection are.

## Run locally

Requires Node.js 22.

```bash
npm install
npm start
```

To build: `npm run build`. GitHub Actions builds and publishes the site to the `gh-pages` branch. In **Settings → Pages**, select **Deploy from a branch**, choose **gh-pages** and **/(root)**, and save. The site address is https://inightborne.github.io/BattleTracker/ once Pages is enabled.

This copy uses the original SVG logo and vector graphics as favicon/app icons, rather than the original binary PNG/ICO icon files.

## Vercel

The root `vercel.json` configures a static Angular build at `dist/browser`, with a fallback to `index.html` for client routes. Vercel builds the `main` branch on each push; no database, server, cookies, or API keys are needed. Save data remains in localStorage for each browser, and JSON backups allow transferring encounters between devices.
