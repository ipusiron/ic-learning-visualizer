English · [日本語](README.md)

# IC Learning Visualizer - Visual Learning Tool for the Index of Coincidence

![GitHub Repo stars](https://img.shields.io/github/stars/ipusiron/ic-learning-visualizer?style=social)
![GitHub forks](https://img.shields.io/github/forks/ipusiron/ic-learning-visualizer?style=social)
![GitHub last commit](https://img.shields.io/github/last-commit/ipusiron/ic-learning-visualizer)
![GitHub license](https://img.shields.io/github/license/ipusiron/ic-learning-visualizer)
[![GitHub Pages](https://img.shields.io/badge/demo-GitHub%20Pages-blue?logo=github)](https://ipusiron.github.io/ic-learning-visualizer/)

**Day047 - 100 Security Tools with Generative AI**

The index of coincidence (IC) is the probability that two letters picked at random from a text (never the same position twice) are the same letter. It is useful in cryptanalysis, but its definition is hard for beginners to grasp. This educational tool helps you understand IC step by step through the calculation, sample comparison, Monte Carlo experiments, a key length experiment and key length estimation by periodic IC. The estimated key length can be passed to other tools together with the ciphertext. The input is handled only inside your browser and is never sent anywhere.

---

## 🌐 Demo

👉 **[https://ipusiron.github.io/ic-learning-visualizer/](https://ipusiron.github.io/ic-learning-visualizer/)**

You can try it directly in your browser.

---

## 📸 Screenshots

>![Sample analysis (Vigenère cipher)](assets/en/screenshot.png)
>
>*Analyzing the Vigenère cipher sample. IC is 0.0432 and the band is "Flat"*

>![Monte Carlo experiment](assets/en/screenshot2.png)
>
>*Picking two letters from the English sample 20,000 times; the share of matches approaches the expected value (IC). The light band is the expected value ± 2 × standard error*

>![Key length estimation](assets/en/screenshot3.png)
>
>*Bar chart of IC by period, and links that pass the ciphertext and key length to other tools*

>![Key length and IC experiment](assets/en/screenshot4.png)
>
>*IC of a plaintext encrypted with random keys of length 1 to 20 (solid line) and the approximation (dashed line)*

>![Letter distribution and IC (dark mode)](assets/en/screenshot5.png)
>
>*Step 3 of the step-by-step tab: IC grows as the same letters repeat (dark mode)*

---

## 📛 About the name

- IC: Index of Coincidence, a statistic used in classical cryptanalysis to estimate the key length and more
- Learning: shows that this is teaching material for education and learning, not just a calculator
- Visualizer: shows that you understand IC "by seeing", through histograms and Monte Carlo experiments, not only numbers and formulas

In short, "IC Learning Visualizer" means "a tool that visualizes the index of coincidence for learning and deeper understanding".

---

## ✨ Features

### 📚 Step-by-step tab

- What IC is (with HELLO, count the ways to pick two letters and the ways to get the same letter)
- The calculation: counts of the letters you enter, pairs n(n−1), numerator, denominator and IC
- Letter distribution and IC: the IC of four 10-letter examples, calculated on the page
- IC of languages and ciphertexts: random (1/26), English and the Vigenère cipher sample compared as bars
- A quiz to check your understanding

### 📊 Sample analysis tab

- Seven samples (English, random, Caesar cipher, Vigenère cipher, German, French, repetition) and your own text
- Bar chart of the A-Z counts, number of letters, IC and band (flat, in between, language-like, strongly skewed)
- When counting only A-Z, full-width letters become half-width and accents are removed (Ü → U, é → E, ß → SS)
- When not counting only A-Z, the counts and IC are calculated over every character that remains

### 🎲 Monte Carlo tab

- Repeat the trial of picking two letters from the text (never the same position twice) and watch the share of matches approach IC
- Texts: the text from the Sample analysis tab, the English, random and Vigenère cipher samples, and your own text
- Three speeds (one trial at a time, normal, results right away). Every speed draws about 100 points on the convergence chart
- The convergence chart shows a band of the expected value ± 2 × standard error (how much the result typically varies for that number of trials)
- With "Allow the same position twice (with replacement)", the experiment converges to Σ(n/N)² instead of IC
- The two positions picked in the latest trial are shown with the letters around them
- At the end, the difference between the experiment and the expected value is shown with the typical variation for that number of trials (2 × standard error)

### 🔐 Cryptanalysis tab

- IC by language (values from two sources side by side)
- Types of cipher and IC (monoalphabetic, polyalphabetic, transposition)
- Key length and IC experiment: encrypt a plaintext with random keys of length 1 to 20 and plot the IC of the ciphertext against the approximation
- Vigenère key length estimation (periodic IC) with its bar chart, and a button that loads the sample ciphertext
- Links that open the estimated key length and the ciphertext in Day030, Day046, Day017 and Day009
- Links to related tools (Day009, Day028, Day030, Day044, Day046)

### 🖥️ Screen

- Japanese and English (the initial language is taken from ?lang= in the URL, then the saved choice, then the browser language; switching keeps the input and results)
- Light and dark modes (following the OS setting, with a button to switch)
- Tabs that work with the keyboard (left and right arrows, Home, End); Esc closes the help
- No horizontal overflow even on a 320 px wide smartphone

---

## 📖 Usage

1. Open the public version ([https://ipusiron.github.io/ic-learning-visualizer/](https://ipusiron.github.io/ic-learning-visualizer/))
2. On the "Step by step" tab, go through the definition and calculation of IC
3. On the "Sample analysis" tab, compare the IC and band of the samples. You can analyze your own text as well
4. On the "Monte Carlo" tab, watch the experiment approach the expected value
5. On the "Cryptanalysis" tab, experiment with key length and IC and estimate the key length from a Vigenère ciphertext. The estimated key length can be passed to other tools through the links

The buttons at the top right switch between Japanese and English and between light and dark. To run it locally, run `python -m http.server 8000` or similar in the folder and open `http://localhost:8000/`.

---

## 🔗 Passing text in the URL

Add `?text=` to the URL to open the tool with that text already analyzed on the Sample analysis tab and in the key length estimation. Use `&tab=` to choose the tab (`learn`, `analyze`, `monte` or `advanced`; the default is sample analysis). This is useful for opening the tool with a ciphertext from another tool or an article.

- `https://ipusiron.github.io/ic-learning-visualizer/?text=ELQJVRIZSEPGUDUPVEVVQXESNNLXSGEIDCSELQARDWMURMCMRVQJQFRYXMABFRF&tab=advanced` (the first sentence of the Vigenère cipher sample, 63 letters; the first key length candidate is 5)
- `?text=` takes up to 10,000 characters (the same limit as Day030 and Day046)
- The language can be chosen with `?lang=ja` or `?lang=en`

---

## 🔬 What is the index of coincidence (IC)?

With n_i the count of each letter and N the total number of letters, IC is calculated as follows.

$$IC = \frac{\sum_i n_i (n_i - 1)}{N (N - 1)}$$

- The denominator N(N−1) is the number of ways to pick two letters in order. The numerator is the number of ways to pick a pair of the same letter in order
- In a long text where all 26 letters appear equally, IC approaches 1/26 (about 0.0385)
- In English text, E, T, A and others appear often, so IC is about 0.066
- Monoalphabetic substitution (the Caesar cipher and others) and transposition keep the set of letter counts of the plaintext, so their IC is the same as the plaintext
- Polyalphabetic substitution (the Vigenère cipher and others) approaches 1/26 as the key gets longer

The mathematical details are in [about_ic.md](about_ic.md) (in Japanese).

---

## 📊 Bands and samples

On the Sample analysis tab, IC is put into one of four bands. Texts under 50 letters are not classified, and texts under 200 letters get a note that the band can be wrong.

| Band | IC range | Seen in |
|---|---|---|
| Flat | below 0.046 | Polyalphabetic ciphers with a long key, random letters |
| In between | 0.046-0.058 | Polyalphabetic ciphers with a short key (2 or 3 letters), text mixing plaintext and ciphertext |
| Language-like | 0.058-0.10 | Plaintext, monoalphabetic substitution, transposition |
| Strongly skewed | 0.10 or more | Artificial text such as the same letters repeated |

The values of the samples (counting only A-Z) are as follows.

| Sample | Letters | IC | Band |
|---|---|---|---|
| English text | 475 | 0.0651 | Language-like |
| Random | 300 | 0.0388 | Flat |
| Caesar cipher | 334 | 0.0691 | Language-like |
| Vigenère cipher | 356 | 0.0432 | Flat |
| German | 449 | 0.0768 | Language-like |
| French | 434 | 0.0842 | Language-like |
| Repetition | 300 | 0.1973 | Strongly skewed |

- The random sample is 300 uniform letters made with a random generator with a fixed seed (always the same string)
- The Caesar cipher sample is English text shifted by 3 letters, and the Vigenère cipher sample is English text encrypted with the key LEMON
- German and French are counted with their accents removed

---

## 🧪 Key length and IC experiment

The Vigenère cipher encrypts each letter with a different shift depending on the key letter, so the longer the key, the flatter the letter counts of the ciphertext and the closer IC gets to 1/26. If the key letters vary, the IC of the ciphertext is close to the following approximation (κp is the IC of the plaintext, κr is 1/26 and L is the key length).

$$IC \approx \frac{\kappa_p + (L - 1)\,\kappa_r}{L}$$

On the Cryptanalysis tab, a plaintext is encrypted with random keys of length 1 to 20 (1 to 50 keys for each length), and the mean IC of the ciphertexts is plotted against the approximation. With the plaintext of the Vigenère cipher sample (356 letters, IC 0.0737) and 40 keys for each length from a random generator with a fixed seed (20261003), the results are as follows.

| Key length | Approximation | Experiment (mean of 40 keys) |
|---|---|---|
| 1 | 0.0737 | 0.0737 |
| 2 | 0.0561 | 0.0547 |
| 3 | 0.0502 | 0.0508 |
| 5 | 0.0455 | 0.0445 |
| 10 | 0.0420 | 0.0419 |
| 20 | 0.0402 | 0.0400 |

- Key length 1 is a monoalphabetic cipher (a single shift), so the value is that of the plaintext
- The experiment on the page uses new random keys each time, so the values change slightly from run to run

---

## 🔑 How key length estimation works

The ciphertext is split into columns with period L (letters 1, L+1, 2L+1, … form column 1), and the IC of each column is averaged. If the period is the key length, each column is a Caesar cipher with a single shift, so the IC returns to the value of the language. Multiples of the key length are high as well, and shorter columns make the values noisier, so simply sorting by IC tends to put a multiple first. Therefore, periods whose average column IC is 0.058 or more come first, smallest first, followed by the rest by average. Periods are checked as long as every column has at least 3 letters (up to 20).

For the Vigenère cipher sample (key LEMON), the results are as follows.

| Period | Average column IC |
|---|---|
| 2 | 0.0431 |
| 3 | 0.0434 |
| 5 | 0.0706 |
| 10 | 0.0720 |
| 15 | 0.0669 |
| 20 | 0.0694 |

- The periods at 0.058 or more are 5, 10, 15 and 20, and the first candidate is 5 (the length of the key LEMON)
- Simply sorting by IC would put period 10 (0.0720) above period 5 (0.0706)
- The IC of the whole text (no split) is 0.0432. When the whole text has an IC of 0.058 or more, the page notes that it may be plaintext, a monoalphabetic cipher or a transposition cipher
- Below the results, a bar chart of IC by period (green at or above the threshold) and links that pass the ciphertext are shown. Modular Text Divider (Day030) and AlphaLoom (Day046) also receive the first key length candidate (both up to 10,000 letters). Vigenère Cipher Tool (Day017) and Frequency Analyzer (Day009, up to 5,000 letters) receive only the ciphertext. When the text cannot be passed, only the page opens

---

## 🎲 How the Monte Carlo experiment works

- Each trial picks two positions uniformly so that they are never the same (as in the definition of IC). The expected share of matches equals IC
- With "Allow the same position twice (with replacement)", picking the same position twice (always a match) is counted too, so the expected value becomes Σ(n/N)². For the English sample, IC is 0.0651 and Σ(n/N)² is 0.0671
- The typical variation of the share after n trials is 2 × the standard error √(p × (1 − p) / n), where p is the expected value. For the English sample (IC 0.0651), it is about ±0.016 after 1,000 trials and about ±0.0035 after 20,000 trials. The band on the convergence chart is this range, and the experiment stays inside it about 95% of the time
- Random numbers come from Math.random (this is a learning experiment, not a cryptographic use)
- The calculations run on the main thread in small chunks. On this machine with Node.js 22, IC of 100,000 letters took about 0.4 ms, the column IC up to period 20 about 8 ms, and 100,000 trials about 3 ms

---

## 📊 IC by language

The values depend on the texts counted, so they differ a little from source to source. The Cryptanalysis tab shows the values from the following two sources.

| Language | Friedman & Callimahos (normalized → IC) | dCode |
|---|---|---|
| English | 1.73 → 0.0665 | 0.0667 |
| French | 2.02 → 0.0777 | 0.0778 |
| German | 2.05 → 0.0788 | 0.0762 |
| Italian | 1.94 → 0.0746 | 0.0738 |
| Spanish | 1.94 → 0.0746 | 0.0770 |
| Portuguese | 1.94 → 0.0746 | — |

- The normalized value is IC × 26 (1.00 when all 26 letters appear equally)
- Sources: W. F. Friedman and L. D. Callimahos, Military Cryptanalytics, Part I (the table in [Wikipedia "Index of coincidence"](https://en.wikipedia.org/wiki/Index_of_coincidence)) and [dCode "Index of Coincidence"](https://www.dcode.fr/index-coincidence)

---

## 🎯 Use cases

- Cryptography classes: put the plaintext, Caesar cipher and Vigenère cipher samples side by side and show with numbers that IC does not change under monoalphabetic substitution and approaches 1/26 under polyalphabetic substitution. The key length experiment shows on a graph that IC falls as the key gets longer and matches the approximation well
- Probability and statistics classes: check "the probability that two picked letters match" with the Monte Carlo experiment, and experience that the experiment approaches the expected value as the trials increase (the law of large numbers) and that the band (standard error) narrows. You can also compare the expected values with and without replacement
- Classical crypto problems in CTFs: use IC to judge whether a ciphertext is monoalphabetic or polyalphabetic, and estimate the key length by periodic IC. Once you have a candidate, follow the links to split the text into columns in [Modular Text Divider (Day030)](https://ipusiron.github.io/modular-text-divider/) or search for a key that is an English word in [AlphaLoom (Day046)](https://ipusiron.github.io/alphaloom/)
- Making puzzles and cipher games: check the IC of a ciphertext you made to see whether it could be broken by frequency analysis (whether it looks like language). The experiment also shows how far IC falls when you change the key length
- Comparing languages: confirm with the German and French samples or your own texts that IC differs between languages (including how much short texts vary)
- Measuring how skewed letters are: compare how skewed the letters of a text are (how many repeated letters) with a single number. Artificial text with many repetitions has a large IC
- English classes and learners abroad: switch the screen to English and run the same experiments with English explanations
- Self-study: go through the definition and calculation on the step-by-step tab and check your understanding with the quiz

---

## 🔒 Security and privacy

- The text you enter is handled only inside the browser. Nothing is sent to or stored on a server
- The links to other tools put the ciphertext (and key length) into the URL only when clicked, and open it in a new tab (`rel="noopener noreferrer"`)
- A Content Security Policy (meta) limits scripts, styles and connections to the same site. No inline scripts, inline event handlers or style attributes are used
- Every letter and result is put on the screen with `textContent` (never interpreted as HTML)
- Input up to 100,000 characters, and `?text=` in the URL up to 10,000 characters
- Only the theme and language choices are saved in localStorage (the tool works where storage is unavailable)

---

## ⚠️ Notes and limitations

- IC depends only on the letter counts. The band is a guide for guessing the type of cipher, not a way to identify it
- In short texts, even plaintext varies a lot. Texts under 50 letters are not classified, and under 200 letters the band can be wrong
- Monoalphabetic substitution and transposition both keep the IC of the plaintext, so IC alone cannot tell them apart (look at letter frequencies and n-grams)
- Key length estimation covers periods where every column has at least 3 letters (up to 20) and ciphertexts of at least 20 letters. Longer keys and shorter ciphertexts make it miss more often
- The approximation in the key length experiment is a guide for keys whose letters vary. With keys of repeated letters (such as AAA), the IC of the ciphertext does not fall
- The IC values by language come from sources and depend on the texts counted
- If the page is opened directly as a file (file://), the tool does not start in Chrome or Edge (they cannot load ES modules from files). A notice appears on the screen; open it over HTTP as described under "Usage" above

---

## 🧪 Tests

The logic (`js/ic-core.js`, `js/samples.js`, `js/links.js`, `js/params.js`) is kept in modules that do not depend on the DOM and is tested with the standard Node.js test runner (`node:test`). There are no dependencies.

```bash
npm test
```

- Node.js 22 or later
- Runs automatically in GitHub Actions on every push and pull request
- Checks known IC answers (HELLO = 0.1000 and others), normalization, periodic IC, key length candidates, bands, the convergence of the Monte Carlo experiment (within 4 standard errors) and a known Vigenère answer (ATTACKATDAWN with the key LEMON gives LXFOPVEFRNHR)
- Also checks that the key length experiment matches the approximation within 0.004, the links to other tools and the URL parameters, and that the Japanese and English dictionaries have the same keys with no Japanese in English
- Checks the properties of the samples (the Vigenère cipher sample is not undone by a single shift, the random sample has an IC near 1/26) and the tables and numbers in the Japanese and English READMEs
- Also checks the CSP, labels and tab roles in index.html, and color contrast (at least 4.5:1 in both light and dark modes)

---

## 📁 Directory structure

```
ic-learning-visualizer/
├── .github/                # GitHub settings
│   └── workflows/          # GitHub Actions workflows
│       └── test.yml        # Runs npm test on push and pull requests
├── assets/                 # Images
│   ├── en/                 # Screenshots for the English README
│   │   ├── screenshot.png  # Sample analysis
│   │   ├── screenshot2.png # Monte Carlo experiment
│   │   ├── screenshot3.png # Key length estimation
│   │   ├── screenshot4.png # Key length and IC experiment
│   │   └── screenshot5.png # Step by step, dark
│   ├── favicon.svg         # Favicon
│   ├── screenshot.png      # Screenshot for the Japanese README (sample analysis)
│   ├── screenshot2.png     # Screenshot for the Japanese README (Monte Carlo)
│   ├── screenshot3.png     # Screenshot for the Japanese README (key length estimation)
│   ├── screenshot4.png     # Screenshot for the Japanese README (key length and IC)
│   └── screenshot5.png     # Screenshot for the Japanese README (step by step, dark)
├── corpus/                 # English text for the spread experiment
│   ├── NOTICE.md           # Source and SHA-256 of the English text
│   └── eval-pg98.txt       # Letters-only excerpt of A Tale of Two Cities (#98)
├── js/                     # Modules other than the screen
│   ├── chart.js            # Charts (convergence, IC by period, key length and IC)
│   ├── ciphers.js          # Classical ciphers for the cipher comparison (substitution, columnar, autokey)
│   ├── export.js           # Exporting results (CSV, JSON)
│   ├── file-check.js       # Notice when the tool cannot start from file://
│   ├── i18n.js             # Choosing and switching the language (Japanese, English)
│   ├── ic-core.js          # IC logic (normalization, IC, periodic IC, key length, bands, Monte Carlo, key length experiment)
│   ├── links.js            # Links that pass the ciphertext to other tools
│   ├── messages.js         # Strings shown on the screen (Japanese, English)
│   ├── params.js           # Reads ?text= and ?tab= from the URL
│   ├── samples.js          # Samples, step examples and the language IC table
│   ├── tabs.js             # Tab switching (including the keyboard)
│   ├── theme-init.js       # Applies the theme at the start of loading
│   └── theme.js            # Light/dark switching
├── test/                   # Tests (node:test)
│   ├── analysis.test.js    # Kappa test, columns, Friedman formula, seeds, export
│   ├── ciphers.test.js     # Substitution, columnar, autokey and the cipher comparison
│   ├── contrast.test.js    # Color contrast, sizes of fields and controls
│   ├── core.test.js        # IC, normalization, key length, bands, Monte Carlo, known answers
│   ├── experiment.test.js  # Key length experiment, approximation, variation band
│   ├── format.test.js      # Line length, control characters, minimum line counts
│   ├── html.test.js        # CSP, element ids, tab roles, labels
│   ├── i18n.test.js        # Keys of both languages, no Japanese in English, initial language
│   ├── links.test.js       # Links to other tools, URL parameters
│   ├── messages.test.js    # Where strings live and their keys
│   ├── readme.test.js      # Tables, structure, tree and images of both READMEs
│   ├── samples.test.js     # Properties of the samples, step examples, quiz answer
│   └── spread.test.js      # Bundled English text and the length spread
├── .gitignore              # Git ignore settings
├── .nojekyll               # Tells GitHub Pages not to use Jekyll
├── CLAUDE.md               # Development notes for Claude Code
├── LICENSE                 # License (MIT)
├── README.en.md            # This document
├── README.md               # Japanese document
├── about_ic.md             # Mathematical details of IC (Japanese)
├── index.html              # Screen
├── package.json            # npm test settings (no dependencies)
├── script.js               # Screen logic (ES module)
└── style.css               # Styles (light and dark)
```

---

## 💻 Requirements

- Tested with the latest Chrome, Edge and Firefox (Safari has not been tested)
- The public version ([https://ipusiron.github.io/ic-learning-visualizer/](https://ipusiron.github.io/ic-learning-visualizer/)) can be used as it is
- To run it locally, run `python -m http.server 8000` or similar in the folder and open `http://localhost:8000/`

---

## 📄 License

- See the `LICENSE` file for the license of the source code.

---

## 🛠️ About this tool

This tool was developed as part of the "100 Security Tools with Generative AI" project.
The project creates and publishes a wide variety of security-related tools over 100 days with the help of AI.

For details about the project and other tools, see the following page.

🔗 [https://akademeia.info/?page_id=42163](https://akademeia.info/?page_id=42163)
