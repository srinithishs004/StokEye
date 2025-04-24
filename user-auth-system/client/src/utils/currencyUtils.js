/**
 * Currency conversion utilities
 */

// Current USD to INR exchange rate
export const USD_TO_INR_RATE = 83.5;

/**
 * Convert USD to INR
 * @param {number} usdAmount - Amount in USD
 * @returns {number} - Amount in INR
 */
export const convertUsdToInr = (usdAmount) => {
  if (typeof usdAmount !== 'number' || isNaN(usdAmount)) {
    return 0;
  }
  return usdAmount * USD_TO_INR_RATE;
};

/**
 * Format currency in INR with ₹ symbol
 * @param {number} amount - Amount in USD
 * @param {boolean} convert - Whether to convert from USD to INR
 * @returns {string} - Formatted currency string
 */
export const formatInr = (amount, convert = true) => {
  if (typeof amount !== 'number' || isNaN(amount)) {
    return '₹0.00';
  }
  
  const inrAmount = convert ? convertUsdToInr(amount) : amount;
  return `₹${inrAmount.toFixed(2)}`;
};

/**
 * Format change value with sign and currency symbol
 * @param {number} change - Change amount in USD
 * @returns {string} - Formatted change string
 */
export const formatChange = (change) => {
  if (typeof change !== 'number' || isNaN(change)) {
    return '₹0.00';
  }
  
  const inrChange = convertUsdToInr(change);
  return `${change >= 0 ? '+' : ''}₹${inrChange.toFixed(2)}`;
};