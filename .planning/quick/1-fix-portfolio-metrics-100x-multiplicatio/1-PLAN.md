# Quick Task 1: Fix Portfolio Metrics 100x Multiplication Bug

## Problem

`src/lib/investments.ts` uses `currency.js` `.intValue` property to accumulate portfolio totals. `.intValue` returns the value multiplied by 10^precision (default precision=2), so every amount gets multiplied by 100.

Example: `new Currency(6129180).intValue` = `612918000` (×100)

## Root Cause

currency.js default precision is 2 (for cents). `.intValue` is designed to return the "integer cents" representation. For IDR (no cents), `.value` should be used instead — it returns the actual number.

## Fix

Replace all `.intValue` with `.value` in `src/lib/investments.ts` (6 occurrences).

## Task

- [x] Replace `.intValue` with `.value` in investments.ts
