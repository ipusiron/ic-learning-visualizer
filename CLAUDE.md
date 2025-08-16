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
- `index.html`: Main HTML structure with semantic sections for input, results, and Monte Carlo simulation
- `script.js`: All application logic in vanilla JavaScript
- `style.css`: Custom dark theme styling with CSS variables

### Key Components

#### Text Processing (script.js:5-10)
- `normalize()`: Preprocesses text with configurable options (A-Z only, remove spaces/symbols)
- Handles Unicode properly for international characters

#### Statistical Calculations (script.js:13-34)
- `freqCounts()`: Generates character frequency distribution for A-Z
- `calcIC()`: Computes Index of Coincidence using the formula IC = Σ(ni*(ni-1))/(N*(N-1))
- Also calculates related metrics: sumPi2 for probability distribution

#### Visualization (script.js:37-53)
- `renderFreqChart()`: Creates dynamic bar chart showing character frequencies
- Uses CSS-based charting with calculated heights proportional to frequency

#### Monte Carlo Simulation (script.js:104-172)
- Implements sampling experiment to demonstrate IC concept intuitively
- `mcOnce()`: Single trial picking two random positions
- `runMC()`: Batch processing with requestAnimationFrame for smooth UI
- Progressive updates showing convergence to theoretical IC value

### UI State Management
- Global variables for current text and Monte Carlo state (mcTrials, mcHits, mcRunning)
- Real-time UI updates through dedicated update functions
- Progress bar visualization for long-running simulations

## Important Notes

- Pure client-side application - all processing happens in browser
- No external dependencies or CDN libraries
- Responsive design with CSS Grid, breakpoint at 900px
- Dark theme optimized for readability with high contrast colors
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