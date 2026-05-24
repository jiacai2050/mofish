# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Mofish is a daily aggregator for Hacker News and V2EX hot posts with AI-generated summaries. Data is fetched via GitHub Actions, stored as per-day JSON files, and distributed through multiple channels (GitHub Issues, Telegram, email, GitHub Pages site).

## Commands

```bash
# Install dependencies
npm ci

# Build static site (outputs to dist/)
node scripts/build-site.js

# Run newsletter generation for a specific date (YYYYMMDD)
node actions/newsletter.js --day 20260524

# Initialize or migrate the Turso database
node db/turso.js
```

## Architecture

### Data Flow

1. **Fetch** (`actions/hacker-news/fetch.js`): Cron-triggered GitHub Action fetches HN top/best stories via Firebase API, saves to LeanCloud
2. **Newsletter** (`actions/newsletter.js`): Reads posts for a given day, renders multiple output formats (HTML email, plain text, GitHub Issue, Telegram, Telegraph) using EJS templates in `public/`
3. **Persist**: Posts are saved to `data/YYYY-MM-DD.json` (committed to repo) and to Turso/libsql database
4. **Static Site** (`scripts/build-site.js`): Reads all `data/*.json`, generates `dist/` with index page, per-day pages (`dist/YYYY-MM-DD/index.html`), Atom feed, and search index

### Key Directories

- `data/` — Per-day JSON files, each an array of post objects with fields: `id`, `time`, `type`, `title`, `score`, `descendants`, `url`, `by`, `summary`
- `actions/` — GitHub Actions scripts (HN fetch, V2EX fetch, newsletter generation)
- `templates/` — EJS templates and static assets for the GitHub Pages site
- `public/` — EJS templates for newsletter outputs (email, issue, telegram)
- `scripts/` — Build tooling for static site generation
- `db/` — Turso/libsql database client and schema

### Static Site Structure

Pages use clean URLs (`/YYYY-MM-DD` not `/YYYY-MM-DD.html`), achieved by outputting each day as `dist/YYYY-MM-DD/index.html`. CSS uses pico.css (CDN) plus `templates/style.css`. Search is client-side JS loading a pre-built `search-index.json`.

### GitHub Actions Workflows

- `newsletter.yml` — Daily at 00:02 UTC: fetches posts, generates newsletters, creates GitHub Issue, posts to Telegram/Telegraph, sends email
- `pages.yml` — Triggered after newsletter completes or manually: builds static site and deploys to GitHub Pages
