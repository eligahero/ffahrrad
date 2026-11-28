export type CurrencyCode = 'EUR' | 'DKK' | 'HUF' | 'SEK' | 'CHF';

export type CurrencyDefinition = {
  code: CurrencyCode;
  symbol: string;
  label: string;
  shortLabel: string;
  flag: string;
  rate: number;
  position: 'left' | 'right' | 'left-space' | 'right-space';
  thousandSeparator: string;
  decimalSeparator: string;
  decimals: number;
};

export const SUPPORTED_CURRENCIES: Record<CurrencyCode, CurrencyDefinition> = {
  EUR: {
    code: 'EUR',
    symbol: '€',
    label: 'EUR (€)',
    shortLabel: 'EUR',
    flag: '🇪🇺',
    rate: 1.0,
    position: 'right-space',
    thousandSeparator: '.',
    decimalSeparator: ',',
    decimals: 2,
  },
  DKK: {
    code: 'DKK',
    symbol: 'kr.',
    label: 'DKK (kr.)',
    shortLabel: 'DKK',
    flag: '🇩🇰',
    rate: 7.46,
    position: 'right-space',
    thousandSeparator: '.',
    decimalSeparator: ',',
    decimals: 2,
  },
  HUF: {
    code: 'HUF',
    symbol: 'Ft',
    label: 'HUF (Forint)',
    shortLabel: 'HUF',
    flag: '🇭🇺',
    rate: 395.0,
    position: 'right-space',
    thousandSeparator: ' ',
    decimalSeparator: ',',
    decimals: 0,
  },
  SEK: {
    code: 'SEK',
    symbol: 'kr',
    label: 'SEK (kr)',
    shortLabel: 'SEK',
    flag: '🇸🇪',
    rate: 11.20,
    position: 'right-space',
    thousandSeparator: ' ',
    decimalSeparator: ',',
    decimals: 2,
  },
  CHF: {
    code: 'CHF',
    symbol: 'CHF',
    label: 'CHF (Fr.)',
    shortLabel: 'CHF',
    flag: '🇨🇭',
    rate: 0.95,
    position: 'left-space',
    thousandSeparator: "'",
    decimalSeparator: '.',
    decimals: 2,
  },
};

export type CurrencyOptions = {
  currencySymbol: string;
  currencyPosition: 'left' | 'right' | 'left-space' | 'right-space';
  thousandSeparator: string;
  decimalSeparator: string;
  taxIncludedInPrice?: boolean;
  defaultVatRate?: number;
  rate?: number;
  decimals?: number;
  code?: CurrencyCode;
};

export const defaultCurrencyOptions: CurrencyOptions = {
  currencySymbol: '€',
  currencyPosition: 'right-space',
  thousandSeparator: '.',
  decimalSeparator: ',',
  taxIncludedInPrice: true,
  defaultVatRate: 19,
  rate: 1.0,
  decimals: 2,
  code: 'EUR',
};

export function formatPriceNumber(
  amount: number,
  options: CurrencyOptions = defaultCurrencyOptions
): string {
  if (isNaN(amount) || amount === null || amount === undefined) {
    return `0,00 ${options.currencySymbol || '€'}`;
  }

  const rate = options.rate !== undefined ? options.rate : 1.0;
  const convertedAmount = amount * rate;
  const decimals = options.decimals !== undefined ? options.decimals : 2;

  let formattedNumber = '';
  if (decimals === 0) {
    const rounded = Math.round(convertedAmount).toString();
    formattedNumber = rounded.replace(/\B(?=(\d{3})+(?!\d))/g, options.thousandSeparator);
  } else {
    const amountStr = convertedAmount.toFixed(decimals);
    const [integerPart, decimalPart] = amountStr.split('.');
    const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, options.thousandSeparator);
    formattedNumber = `${formattedInteger}${options.decimalSeparator}${decimalPart}`;
  }

  // Apply currency symbol position
  switch (options.currencyPosition) {
    case 'left':
      return `${options.currencySymbol}${formattedNumber}`;
    case 'left-space':
      return `${options.currencySymbol} ${formattedNumber}`;
    case 'right':
      return `${formattedNumber}${options.currencySymbol}`;
    case 'right-space':
      return `${formattedNumber} ${options.currencySymbol}`;
    default:
      return `${formattedNumber} ${options.currencySymbol}`;
  }
}

export function formatPriceWithTax(
  amount: number,
  options: CurrencyOptions = defaultCurrencyOptions
): string {
  const isIncluded = options.taxIncludedInPrice !== false;
  const vatRate = options.defaultVatRate || 19;

  if (isIncluded) {
    return formatPriceNumber(amount, options);
  } else {
    const amountTTC = amount * (1 + vatRate / 100);
    const formattedHT = formatPriceNumber(amount, options);
    const formattedTTC = formatPriceNumber(amountTTC, options);
    return `${formattedHT} (inkl. MwSt. ${formattedTTC})`;
  }
}
