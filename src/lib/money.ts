import currency from 'currency.js'

// IDR format: Rp 125.000 (period separator, no decimal for Rupiah)
export const IDR = (value: number | string) =>
  currency(value, {
    symbol: 'Rp ',
    separator: '.',
    decimal: ',',
    precision: 0,
  })

// Format number as IDR string
export function formatIDR(amount: number): string {
  return IDR(amount).format()
}

// Sum an array of amounts safely
export function sumAmounts(amounts: number[]): number {
  return amounts.reduce((total, amt) => IDR(total).add(amt).value, 0)
}
