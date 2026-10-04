# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**IC Learning Visualizer** - 一致指数をビジュアル理解するツール. A static web app that teaches the Index of Coincidence (IC) step by step: eight learning steps with an eight-question quiz, the calculation, sample comparison, Monte Carlo experiments (with a ±2σ band and an option to sample with replacement), experiments on text length (IC spread over a bundled English text) and on cipher types, a key length vs IC experiment, and Vigenère key length estimation by periodic IC (with the columns, the kappa test and the Friedman formula shown underneath) and links that pass the ciphertext to other tools. Experiments take an optional random seed and results can be saved as CSV/JSON. Input never leaves the browser. Japanese and English UI.

Part of the "100 Security Tools with Generative AI" project (Day047).

## Architecture

- **index.html**: Four ARIA tabs (step learning, sample analysis, Monte Carlo, applications). Meta CSP without `'unsafe-inline'`; hidden parts use the `hidden` attribute (no style attributes). Help is a `<dialog>` with static topics. Static text carries `data-i18n` / `data-i18n-attr`
- **script.js**: UI entry (ES module). Builds tables, bars and windows with `textContent` only; no `innerHTML`, `alert` or `confirm`. Bar lengths and the canvas height are set through CSSOM (`.style.width` / `.style.height` only). Results are kept in `state` and redrawn from it, and status lines are stored as key + values (`say`), so switching the language redraws everything without losing input or results
- **js/ic-core.js**: Pure logic (no DOM): `normalizeText` (NFKC→NFD, marks removed, ß→SS, A–Z only by default), `icDetail`/`indexOfCoincidence` (counts every character that remains), `breakdownRows`, `periodicIC`, `keyLengthCandidates` (threshold 0.058), `classifyIC` (bands 0.046 / 0.058 / 0.10, no verdict under 50 letters, short note under 200), `pickPair`/`runTrials` (without replacement by default), `expectedRate` (IC, or Σp² with replacement), `standardError`, `sigmaBand`, `historyStep`, `chartMax`, `shiftLetters`, `encryptVigenere`, `approxPolyIC`, `keyLengthExperiment`, `xorshift32`, `kappa`/`kappaCurve`, `columnDetails`, `friedmanEstimate` (κp 0.0667, κr 1/26; `Infinity` when the denominator is ≤ 0), `lengthSpread`, `parseSeed` (blank → null, integer 0–4294967295, otherwise NaN) and `makeRng` (xorshift32 with a seed, Math.random without). Key length candidates only use periods where every column has at least 3 letters (`MIN_COLUMN_LETTERS`)
- **js/samples.js**: Sample texts. The Caesar and Vigenère samples are generated from their plaintexts (shift 3, key LEMON) and the random sample from a fixed seed, so they are never copied by hand. Also the step-3 patterns, the step-5 words, the quiz options and answers (`QUIZ_ANSWERS`, 8 questions) and the language IC table (Friedman & Callimahos normalized values, dCode values)
- **js/ciphers.js**: Classical ciphers for the cipher comparison (random substitution, columnar transposition, autokey) and `compareCiphers` (plain / substitution / columnar / Vigenère / autokey; the period is 1 when the whole IC is already at the threshold, null when no period is found)
- **js/export.js**: CSV (BOM, CRLF, every cell quoted) and JSON, file names `ic-learning-visualizer_<kind>_YYYYMMDD-HHMM.<ext>`
- **js/chart.js**: Canvas charts (devicePixelRatio aware, colors from CSS variables `--chart-*`): convergence with the ±2σ band, IC by period and the kappa curve (both return a function that maps a click to a bar), key length experiment, IC histogram (bars kept at 70% height so the mark labels sit above them)
- **corpus/eval-pg98.txt**: 200,000 letters of A Tale of Two Cities (Project Gutenberg #98, public domain in the US) for the spread experiment, fetched from the same site. Its SHA-256 is in `corpus/NOTICE.md` and checked by `test/spread.test.js`
- **js/links.js**: Links that pass the ciphertext to Day030 / Day046 (`#text=…&n=…`, 10,000 letters) and Day017 / Day009 (`#text=`, Day009 up to 5,000); after `#`, so not sent to the server and not limited by the 8,192-byte URL limit of GitHub Pages. If the text cannot be passed, the link opens the page only
- **js/params.js**: `#text=` (preferred) or `?text=` (up to 10,000 characters; fills sample analysis and key length estimation) and `?tab=`. After reading, `text` is removed from both `?` and `#` with `history.replaceState` (`urlWithoutText`; `tab` and `lang` stay)
- **js/messages.js / i18n.js**: All UI strings in Japanese and English (same keys; `ui.*` are the static HTML strings). Language: `?lang=` → saved choice (`ic-learning-visualizer-lang`) → browser language. Logic returns keys and values only
- **js/tabs.js / theme.js / theme-init.js / file-check.js**: Tabs with arrow keys, light/dark theme (`ic-learning-visualizer-theme`), notice when opened via `file://`
- **style.css**: Color tokens on `:root`, dark overrides for `data-theme="dark"` and `prefers-color-scheme` (both blocks must stay identical)
- **about_ic.md / about_ic.en.md**: Mathematical background (Japanese / English). Their numbers (worked example, language table, measured values on the bundled English text, key length accuracy) are checked by `test/readme.test.js`

There is no Web Worker: every calculation is fast enough on the main thread (100,000 letters: IC about 0.4 ms, periodic IC up to 20 about 8 ms, 100,000 trials about 3 ms on Node 22). The Monte Carlo loop runs in small chunks with `setTimeout` and records about 100 points per run.

## Development Commands

- `npm test` — node:test, no dependencies, Node 22+. Runs in GitHub Actions on push and pull requests
- Serve over HTTP to run the UI: `python -m http.server 8000` → `http://localhost:8000/`. Chrome/Edge cannot load ES modules from `file://` (a notice is shown)

## Testing

- `test/core.test.js`: known IC answers, normalization, periodic IC, key length candidates (including the 3-letter column rule), bands, sampling without/with replacement, convergence within 4 standard errors, Vigenère known answer (ATTACKATDAWN / LEMON → LXFOPVEFRNHR)
- `test/experiment.test.js`: approximation, key length experiment within 0.004 of the approximation, ±2σ band
- `test/links.test.js`: links to other tools and URL parameters
- `test/samples.test.js`: sample properties (Vigenère sample is not a single shift, random sample IC near 1/26), step-3 order, quiz answer, language table
- `test/analysis.test.js`, `test/ciphers.test.js`, `test/spread.test.js`: kappa, columns, Friedman formula, seeds, CSV/JSON; substitution/columnar keep the IC exactly, autokey known answer (ATTACKATDAWN / QUEENLY → QNXEPVYTWTWP); corpus SHA-256 and the spread widths
- `test/steps.test.js`: eight steps, values in steps 5–7, quiz answers checked against the logic (including the Q8 explanation "a little over one in ten falls below 0.058")
- `test/readme.test.js`: README.md / README.en.md (same headings) YAML structure, section order, tables and numbers (the experiment table uses seed 20261003 and 40 keys, the spread table seed 1 and 1,000 windows, the cipher table seed 20261004, the accuracy table xorshift32(7 + N) with keys of length 3–10 × 100), directory tree, seven images each (`assets/` for Japanese, `assets/en/` for English); about_ic.md / about_ic.en.md numbers
- `test/i18n.test.js`: same keys and placeholders in both languages, no Japanese in English (except the language button), every Japanese text in index.html has a key, initial language
- `test/html.test.js`, `test/contrast.test.js`, `test/messages.test.js`, `test/format.test.js`: CSP and markup, color contrast and control sizes, strings kept in messages.js (no key defined twice in a dictionary), minified-file detection

## Key Implementation Notes

- Never use `innerHTML` for user-provided data. Tests forbid `innerHTML`, `.cssText`, `setAttribute('style'…)` and `alert`/`confirm` in the UI scripts
- Changing the Monte Carlo source resets the experiment; the source, trials and custom text are locked while it runs (results and source must not disagree)
- Keep the README YAML metadata structure (keys, order, block lists) unchanged; `readme.test.js` checks it
- README numbers (sample table, key length table, standard errors, language table, spread, cipher comparison, key length accuracy) are recomputed by `readme.test.js`; update them from the implementation, not by hand
- Never put translated text into `say()` values: a status line stores the key and values and is re-rendered on a language switch. Messages for a run without a seed use separate `…Random` keys
- The seed field is locked while the Monte Carlo experiment runs. The kappa test and the Friedman formula are learning aids; key length candidates always come from periodic IC
