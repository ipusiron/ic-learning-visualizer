# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

IC Learning Visualizer is an educational web application that demonstrates the Index of Coincidence (IC) concept through interactive visualizations. It's a pure HTML/CSS/JavaScript application with no build process or external dependencies.

## Development Commands

This is a static web application with no package.json or build system:
- **Run locally**: Open `index.html` directly in a browser
- **Deploy**: Upload all files to any static web hosting server (currently hosted on GitHub Pages)
- **Test**: Manual testing by opening in browser - no automated test suite

## Architecture

### Core Files
- `index.html`: Main HTML structure with tab-based UI (4 tabs: learning, analysis, Monte Carlo, advanced)
- `script.js`: All application logic (~1400 lines) with async/await patterns
- `worker.js`: Web Worker for background processing of heavy computations
- `style.css`: Light theme styling with CSS variables

### Key Components

#### Text Processing & Security (script.js:35-65, 170-182)
- `escapeHtml()`: Sanitizes user input for safe DOM rendering
- `validateInput()`: Checks for dangerous patterns (XSS prevention)
- `normalize()`: Preprocesses text with configurable options (A-Z only, remove spaces/symbols)

#### Statistical Calculations (script.js:184-264)
- `calcIC()`: Computes Index of Coincidence using the formula IC = Σ(ni*(ni-1))/(N*(N-1))
- `calcICFallback()`: Synchronous fallback when Web Worker unavailable
- `getCharCounts()` / `getCharCountsFallback()`: Character frequency distribution for A-Z

#### Web Worker Architecture (script.js:67-135, worker.js)
- Heavy computations offloaded to background thread for UI responsiveness
- `initWorker()`: Initializes Web Worker with error handling
- `executeWorkerTask()`: Promise-based async task execution with 30s timeout
- Worker handles: IC calculation, character counts, text analysis, Monte Carlo batches, key length estimation

#### Tab-Based UI (script.js:266-561)
- **Step Learning** (`initStepLearning()`): Progressive educational walkthrough with quizzes
- **Sample Analysis** (`initSampleAnalysis()`, `performAnalysis()`): Text analysis with frequency charts
- **Monte Carlo** (`initMonteCarlo()`): Probability experiments with convergence visualization
- **Advanced** (`initAdvanced()`): Vigenère cipher key length estimation (Friedman test)

#### Visualization (script.js:656-684, 1099-1242)
- `createFrequencyChart()`: Dynamic A-Z frequency bar chart
- `drawChart()`: Canvas-based convergence graph for Monte Carlo simulation

### UI State Management
- Global state variables: `currentStep`, `currentTab`, `analysisText`, `monteCarloRunning`, `convergenceChart`
- `pendingWorkerTasks`: Map tracking async Worker operations
- Real-time UI updates through dedicated update functions per tab

## Important Notes

- Pure client-side application - all processing happens in browser
- No external dependencies or CDN libraries (uses MathJax via CDN for formula rendering in documentation only)
- Web Workers used for computations on texts >1000 characters
- Responsive design with CSS Grid
- Input validation limits: max 100,000 characters, dangerous patterns blocked (XSS prevention)
- Educational focus: includes mathematical explanations and reference values for IC

## Future Enhancement Tasks

### 🎨 UI/UX Improvements (Priority: Medium)
- [ ] **Dark mode toggle** - Add light/dark theme switcher in header
- [ ] **Progressive Web App (PWA)** - Add service worker for offline functionality
- [ ] **Mobile optimization** - Improve tablet/smartphone responsive design
- [ ] **Keyboard shortcuts** - Implement Tab navigation, hotkeys for common actions
- [ ] **Accessibility (A11y)** - Add ARIA labels, keyboard navigation, screen reader support

### 📊 Feature Extensions (Priority: High)
- [ ] **CSV export functionality** - Export analysis results to downloadable CSV files
- [ ] **Bulk text comparison** - Drag & drop multiple files for batch analysis
- [ ] **Extended statistics** - Add variance, standard deviation, entropy calculations
- [ ] **Enhanced language detection** - Support for more languages beyond current set
- [ ] **Real-time analysis** - Live IC calculation as user types

### 🔍 Cryptanalysis Enhancements (Priority: High)
- [ ] **Kasiski test implementation** - Detect repeating sequences in ciphertext
- [ ] **Advanced Friedman test** - Show confidence intervals and statistical significance
- [ ] **Additional cipher support** - Playfair, Hill cipher, and other classical methods
- [ ] **N-gram analysis** - Bigram and trigram frequency analysis
- [ ] **Cipher type classifier** - ML-based automatic cipher identification

### 📚 Educational Features (Priority: Medium)
- [ ] **Interactive tutorial** - Step-by-step guided learning experience
- [ ] **Practice exercises** - Graded exercises with automatic scoring
- [ ] **Progress tracking** - Save learning progress using localStorage
- [ ] **Multi-language UI** - English version of the interface
- [ ] **Video tutorials** - Embedded explanatory videos

### ⚡ Performance Optimizations (Priority: Low)
- [x] **Web Workers** - Move heavy computations to background threads (✅ COMPLETED)
- [ ] **Virtual scrolling** - Efficient rendering for large text inputs
- [ ] **Result caching** - Cache calculated IC values to avoid re-computation
- [ ] **Lazy loading** - Load components and images on demand
- [ ] **Code splitting** - Break JavaScript into smaller modules

### 🔧 Technical Improvements (Priority: Medium)
- [ ] **TypeScript migration** - Add type safety and better IDE support
- [ ] **Module architecture** - Split code into ES6 modules for better maintainability
- [ ] **Unit testing** - Add Jest or similar testing framework
- [ ] **Build system** - Add Webpack/Vite for development workflow
- [ ] **Code linting** - ESLint and Prettier configuration

### 📈 Advanced Analytics (Priority: Low)
- [ ] **Time-series analysis** - Track IC changes over text segments
- [ ] **Similarity metrics** - Compare texts using cosine similarity, Jaccard index
- [ ] **Anomaly detection** - Identify unusual patterns in text statistics
- [ ] **Machine learning integration** - Auto-classification using TensorFlow.js
- [ ] **Statistical significance testing** - Chi-square tests for pattern validation

### 🗂️ Data Management (Priority: Low)
- [ ] **Import/Export profiles** - Save and load analysis configurations
- [ ] **History tracking** - Keep record of previous analyses
- [ ] **Bookmark system** - Save interesting text samples
- [ ] **Database integration** - Optional IndexedDB for local data persistence
- [ ] **Cloud sync** - Optional Google Drive/GitHub integration for data backup

## Development Guidelines for Enhancements

When implementing these features:

1. **Maintain backwards compatibility** - Don't break existing functionality
2. **Keep it lightweight** - Avoid heavy dependencies that increase bundle size
3. **Progressive enhancement** - Features should degrade gracefully
4. **Security first** - All user inputs must be sanitized and validated
5. **Mobile-first design** - Ensure new features work well on small screens
6. **Accessibility compliance** - Follow WCAG 2.1 guidelines for new UI elements
7. **Performance budget** - Monitor bundle size and loading times
8. **Educational focus** - New features should enhance learning, not complicate UX