# BattleTracker

A Shadowrun 5th Edition combat and initiative tracker, based on [MerGatto's BattleTracker](https://github.com/MerGatto/BattleTracker) (MIT-licensed in the original package). Original authorship and credit are preserved in the app.

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
npm ci
npm start
```

To build: `npm run build`. The main-branch GitHub Actions workflow also supports deploying to GitHub Pages (enable Pages / Actions in repository settings if needed).

This copy uses the original SVG logo and vector graphics as favicon/app icons, rather than the original binary PNG/ICO icon files.
