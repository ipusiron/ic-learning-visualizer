# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**IC Learning Visualizer** - 一致指数をビジュアル理解するツール. A static web app that teaches the Index of Coincidence (IC) step by step: the calculation, sample comparison, Monte Carlo experiments, and Vigenère key length estimation by periodic IC. Input never leaves the browser.

Part of the "100 Security Tools with Generative AI" project (Day047).

## Architecture

- **index.html**: Four ARIA tabs (step learning, sample analysis, Monte Carlo, applications). Meta CSP without `'unsafe-inline'`; hidden parts use the `hidden` attribute (no style attributes). Help is a `<dialog>` with static topics
- **script.js**: UI entry (ES module). Builds tables, bars and windows with `textContent` only; no `innerHTML`, `alert` or `confirm`. Bar lengths and the canvas height are set through CSSOM (`.style.width` / `.style.height` only)
- **js/ic-core.js**: Pure logic (no DOM): `normalizeText` (NFKC→NFD, marks removed, ß→SS, A–Z only by default), `icDetail`/`indexOfCoincidence` (counts every character that remains), `breakdownRows`, `periodicIC`, `keyLengthCandidates` (threshold 0.058), `classifyIC` (bands 0.046 / 0.058 / 0.10, no verdict under 50 letters, short note under 200), `pickPair`/`runTrials` (without replacement by default), `expectedRate`, `standardError`, `historyStep`, `chartMax`, `shiftLetters`, `encryptVigenere`, `xorshift32`
- **js/samples.js**: Sample texts. The Caesar and Vigenère samples are generated from their plaintexts (shift 3, key LEMON) and the random sample from a fixed seed, so they are never copied by hand. Also the step-3 patterns, the quiz options and the language IC table (Friedman & Callimahos normalized values, dCode values)
- **js/chart.js**: Convergence chart on canvas (devicePixelRatio aware, colors from CSS variables `--chart-*`)
- **js/messages.js**: Strings that JS builds (Japanese). Logic returns keys and values only
- **js/tabs.js / theme.js / theme-init.js / file-check.js**: Tabs with arrow keys, light/dark theme (`ic-learning-visualizer-theme`), notice when opened via `file://`
- **style.css**: Color tokens on `:root`, dark overrides for `data-theme="dark"` and `prefers-color-scheme` (both blocks must stay identical)
- **about_ic.md**: Mathematical background (Japanese). Its numbers are checked by `test/readme.test.js`

There is no Web Worker: every calculation is fast enough on the main thread (100,000 letters: IC about 0.4 ms, periodic IC up to 20 about 8 ms, 100,000 trials about 3 ms on Node 22). The Monte Carlo loop runs in small chunks with `setTimeout` and records about 100 points per run.

## Development Commands

- `npm test` — node:test, no dependencies, Node 22+. Runs in GitHub Actions on push and pull requests
- Serve over HTTP to run the UI: `python -m http.server 8000` → `http://localhost:8000/`. Chrome/Edge cannot load ES modules from `file://` (a notice is shown)

## Testing

- `test/core.test.js`: known IC answers, normalization, periodic IC, key length candidates, bands, sampling without/with replacement, convergence within 4 standard errors, Vigenère known answer (ATTACKATDAWN / LEMON → LXFOPVEFRNHR)
- `test/samples.test.js`: sample properties (Vigenère sample is not a single shift, random sample IC near 1/26), step-3 order, quiz answer, language table
- `test/readme.test.js`: README YAML structure, section order, tables and numbers, directory tree, images; about_ic.md numbers
- `test/html.test.js`, `test/contrast.test.js`, `test/messages.test.js`, `test/format.test.js`: CSP and markup, color contrast and control sizes, strings kept in messages.js, minified-file detection

## Key Implementation Notes

- Never use `innerHTML` for user-provided data. Tests forbid `innerHTML`, `.cssText`, `setAttribute('style'…)` and `alert`/`confirm` in the UI scripts
- Changing the Monte Carlo source resets the experiment; the source, trials and custom text are locked while it runs (results and source must not disagree)
- Keep the README YAML metadata structure (keys, order, block lists) unchanged; `readme.test.js` checks it
- README numbers (sample table, key length table, standard errors, language table) are recomputed by `readme.test.js`; update them from the implementation, not by hand
