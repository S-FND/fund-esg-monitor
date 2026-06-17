/**
 * Format a number with comma separators (Indian numbering system)
 * e.g., 1234567 -> 12,34,567
 */
export const formatNumberWithCommas = (value: string | number | undefined): string => {
  if (value === undefined || value === null || value === '') return '';
  
  const numStr = String(value).trim();
  if (numStr === '') return '';
  
  // Check if it's a valid number
  const num = parseFloat(numStr);
  if (isNaN(num)) return numStr;
  
  // Handle decimal numbers
  const parts = numStr.split('.');
  const integerPart = parts[0];
  const decimalPart = parts.length > 1 ? '.' + parts[1] : '';
  
  // Format the integer part with Indian numbering system (or international)
  // Using international format for simplicity (e.g., 1,234,567)
  const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  
  return formattedInteger + decimalPart;
};

/**
 * Parse a formatted number string back to a plain number string
 * e.g., "12,34,567" -> "1234567"
 */
export const parseFormattedNumber = (value: string): string => {
  if (!value) return '';
  return value.replace(/,/g, '');
};

/**
 * Format number for display with appropriate unit suffix
 */
export const formatDisplayNumber = (value: string | number | undefined, unit?: string): string => {
  const formatted = formatNumberWithCommas(value);
  if (!formatted) return '-';
  
  if (unit === '%') return `${formatted}%`;
  if (unit === '₹ Cr' || unit === 'INR Cr') return `₹${formatted} Cr`;
  if (unit === 'MT') return `${formatted} MT`;
  
  return formatted;
};
