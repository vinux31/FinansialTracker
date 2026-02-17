# Quick Task 1: Summary

**Fix portfolio metrics 100x multiplication bug caused by currency.js intValue**

## What was fixed

`src/lib/investments.ts` — replaced all 6 occurrences of `.intValue` with `.value`.

currency.js `.intValue` multiplies by 10^precision (default 2), causing IDR amounts to appear 100× larger than actual. `.value` returns the correct number.

## Commit

`dc295df` — fix(investments): replace .intValue with .value to fix 100x multiplication bug

## Result

Input `6129180` now correctly displays as `Rp 6.129.180` instead of `Rp 612.918.000`.
