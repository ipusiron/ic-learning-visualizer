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