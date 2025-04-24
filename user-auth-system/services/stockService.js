const axios = require('axios');
const Stock = require('../models/Stock');

const API_KEY = 'E3KHRVPJKZVO6YRT';
const BASE_URL = 'https://www.alphavantage.co/query';

// Helper function to format date to YYYY-MM-DD
const formatDate = (date) => {
  return date.toISOString().split('T')[0];
};

// Fetch current stock data from Alpha Vantage API
const fetchStockData = async (symbol) => {
  try {
    const response = await axios.get(`${BASE_URL}?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${API_KEY}`);
    
    if (response.data && response.data['Global Quote']) {
      const quote = response.data['Global Quote'];
      
      return {
        symbol: quote['01. symbol'],
        price: parseFloat(quote['05. price']),
        previousPrice: parseFloat(quote['08. previous close']),
        change: parseFloat(quote['09. change']),
        changePercent: parseFloat(quote['10. change percent'].replace('%', '')),
        lastUpdated: new Date()
      };
    }
    
    throw new Error('Invalid response from Alpha Vantage API');
  } catch (error) {
    console.error(`Error fetching stock data for ${symbol}:`, error.message);
    throw error;
  }
};

// Fetch historical stock data from Alpha Vantage API
const fetchHistoricalData = async (symbol) => {
  try {
    // Use TIME_SERIES_DAILY to get daily data
    const response = await axios.get(
      `${BASE_URL}?function=TIME_SERIES_DAILY&symbol=${symbol}&outputsize=compact&apikey=${API_KEY}`
    );
    
    if (response.data && response.data['Time Series (Daily)']) {
      const timeSeriesData = response.data['Time Series (Daily)'];
      const historicalData = [];
      
      // Get the last 10 days of data
      const dates = Object.keys(timeSeriesData).sort().reverse().slice(0, 10);
      
      for (const date of dates) {
        const dayData = timeSeriesData[date];
        const currentPrice = parseFloat(dayData['4. close']);
        
        // Get the previous day's data if available
        const currentDateIndex = dates.indexOf(date);
        let previousPrice = currentPrice;
        let change = 0;
        let changePercent = 0;
        
        if (currentDateIndex < dates.length - 1) {
          const previousDate = dates[currentDateIndex + 1];
          const previousDayData = timeSeriesData[previousDate];
          previousPrice = parseFloat(previousDayData['4. close']);
          change = parseFloat((currentPrice - previousPrice).toFixed(2));
          changePercent = parseFloat(((change / previousPrice) * 100).toFixed(2));
        }
        
        historicalData.push({
          date: new Date(date),
          price: currentPrice,
          open: parseFloat(dayData['1. open']),
          high: parseFloat(dayData['2. high']),
          low: parseFloat(dayData['3. low']),
          volume: parseFloat(dayData['5. volume']),
          change,
          changePercent
        });
      }
      
      return historicalData;
    }
    
    throw new Error('Invalid response from Alpha Vantage API for historical data');
  } catch (error) {
    console.error(`Error fetching historical data for ${symbol}:`, error.message);
    throw error;
  }
};

// Update stock data in the database
const updateStockData = async (symbol) => {
  try {
    // Find the stock in the database
    const stock = await Stock.findOne({ symbol });
    
    if (!stock) {
      throw new Error(`Stock ${symbol} not found in database`);
    }
    
    // Fetch latest data from API
    const stockData = await fetchStockData(symbol);
    
    // Update stock in database
    stock.price = stockData.price;
    stock.previousPrice = stockData.previousPrice;
    stock.change = stockData.change;
    stock.changePercent = stockData.changePercent;
    stock.lastUpdated = stockData.lastUpdated;
    
    // Check if we need to update historical data
    // Only update if the last update was on a different day or if there's no historical data
    const today = formatDate(new Date());
    const lastUpdateDate = stock.historicalData.length > 0 
      ? formatDate(stock.historicalData[0].date) 
      : null;
    
    if (lastUpdateDate !== today || !lastUpdateDate) {
      try {
        // Fetch historical data
        const historicalData = await fetchHistoricalData(symbol);
        
        // Update stock with historical data
        stock.historicalData = historicalData;
      } catch (histError) {
        console.error(`Error updating historical data for ${symbol}:`, histError.message);
        // Continue even if historical data update fails
      }
    }
    
    await stock.save();
    
    return stock;
  } catch (error) {
    console.error(`Error updating stock data for ${symbol}:`, error.message);
    throw error;
  }
};

// Update all stocks in the database
const updateAllStocks = async () => {
  try {
    const stocks = await Stock.find();
    const results = { success: [], failed: [] };
    
    // Alpha Vantage has a rate limit of 5 requests per minute for free tier
    // So we need to process stocks in batches
    for (const stock of stocks) {
      try {
        await updateStockData(stock.symbol);
        results.success.push(stock.symbol);
      } catch (error) {
        results.failed.push({ symbol: stock.symbol, error: error.message });
      }
      
      // Add a delay to respect API rate limits (1 request per 12 seconds)
      await new Promise(resolve => setTimeout(resolve, 12000));
    }
    
    return results;
  } catch (error) {
    console.error('Error updating all stocks:', error.message);
    throw error;
  }
};

// Create a new stock with data from API
const createStockWithApiData = async (symbol, name, sector) => {
  try {
    // Check if stock already exists
    const existingStock = await Stock.findOne({ symbol });
    if (existingStock) {
      throw new Error(`Stock ${symbol} already exists`);
    }
    
    // Fetch data from API
    const stockData = await fetchStockData(symbol);
    
    // Create new stock
    const stock = await Stock.create({
      symbol: stockData.symbol,
      name: name || stockData.symbol, // Use provided name or symbol as fallback
      price: stockData.price,
      previousPrice: stockData.previousPrice,
      change: stockData.change,
      changePercent: stockData.changePercent,
      sector: sector || 'Unknown',
      lastUpdated: stockData.lastUpdated
    });
    
    // Fetch and add historical data
    try {
      const historicalData = await fetchHistoricalData(symbol);
      stock.historicalData = historicalData;
      await stock.save();
    } catch (histError) {
      console.error(`Error fetching historical data for new stock ${symbol}:`, histError.message);
      // Continue even if historical data fetch fails
    }
    
    return stock;
  } catch (error) {
    console.error(`Error creating stock ${symbol}:`, error.message);
    throw error;
  }
};

// Get historical data for a specific stock
const getStockHistoricalData = async (symbol) => {
  try {
    const stock = await Stock.findOne({ symbol });
    
    if (!stock) {
      throw new Error(`Stock ${symbol} not found in database`);
    }
    
    // If we have historical data, return it
    if (stock.historicalData && stock.historicalData.length > 0) {
      return stock.historicalData;
    }
    
    // If no historical data, fetch it
    const historicalData = await fetchHistoricalData(symbol);
    
    // Update the stock with the historical data
    stock.historicalData = historicalData;
    await stock.save();
    
    return historicalData;
  } catch (error) {
    console.error(`Error getting historical data for ${symbol}:`, error.message);
    throw error;
  }
};

module.exports = {
  fetchStockData,
  fetchHistoricalData,
  updateStockData,
  updateAllStocks,
  createStockWithApiData,
  getStockHistoricalData
};