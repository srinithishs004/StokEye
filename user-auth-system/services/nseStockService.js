const axios = require('axios');
const Stock = require('../models/Stock');

// NSE API base URL
const NSE_BASE_URL = 'https://www.nseindia.com/api';

// Headers to mimic a browser request
const headers = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9',
  'Accept-Language': 'en-US,en;q=0.9',
  'Accept-Encoding': 'gzip, deflate, br',
  'Connection': 'keep-alive',
  'Referer': 'https://www.nseindia.com/get-quotes/equity?symbol=TCS',
  'Cookie': '_ga=GA1.1.1880394843.1613030317; _ga_PKNDSXYEQT=GS1.1.1613030316.1.1.1613030343.0'
};

// Create axios instance with headers
const nseApi = axios.create({
  headers,
  timeout: 10000
});

// Fetch stock quote from NSE
const fetchNseStockQuote = async (symbol) => {
  try {
    // Remove .NSE suffix if present
    const cleanSymbol = symbol.replace('.NSE', '');
    
    // Get quote from NSE API
    const response = await nseApi.get(`${NSE_BASE_URL}/quote-equity?symbol=${cleanSymbol}`);
    
    if (response.data && response.data.priceInfo) {
      const data = response.data;
      const priceInfo = data.priceInfo;
      
      return {
        symbol: `${cleanSymbol}.NSE`,
        name: data.info.companyName,
        price: priceInfo.lastPrice,
        previousPrice: priceInfo.previousClose,
        change: priceInfo.change,
        changePercent: priceInfo.pChange,
        open: priceInfo.open,
        high: priceInfo.intraDayHighLow.max,
        low: priceInfo.intraDayHighLow.min,
        volume: data.securityWiseDP.quantityTraded,
        sector: data.metadata.industry || 'N/A',
        lastUpdated: new Date()
      };
    }
    
    throw new Error('Invalid response from NSE API');
  } catch (error) {
    console.error(`Error fetching NSE stock data for ${symbol}:`, error.message);
    throw error;
  }
};

// Fetch historical data from NSE
const fetchNseHistoricalData = async (symbol) => {
  try {
    // Remove .NSE suffix if present
    const cleanSymbol = symbol.replace('.NSE', '');
    
    // Get historical data from NSE API
    const response = await nseApi.get(`${NSE_BASE_URL}/chart-databyindex?index=${cleanSymbol}&indices=false`);
    
    if (response.data && response.data.grapthData) {
      const graphData = response.data.grapthData;
      const historicalData = [];
      
      // Get the last 10 days of data
      const last10Days = graphData.slice(-10);
      
      for (let i = 0; i < last10Days.length; i++) {
        const current = last10Days[i];
        const previous = i > 0 ? last10Days[i-1] : null;
        
        const date = new Date(current[0]);
        const price = current[1];
        
        // Calculate change and change percent if previous data exists
        let change = 0;
        let changePercent = 0;
        
        if (previous) {
          const previousPrice = previous[1];
          change = parseFloat((price - previousPrice).toFixed(2));
          changePercent = parseFloat(((change / previousPrice) * 100).toFixed(2));
        }
        
        historicalData.push({
          date,
          price,
          open: price * 0.99, // Estimate as NSE doesn't provide this in historical data
          high: price * 1.01, // Estimate
          low: price * 0.98,  // Estimate
          volume: 0,          // Not available in this API
          change,
          changePercent
        });
      }
      
      return historicalData;
    }
    
    throw new Error('Invalid response from NSE API for historical data');
  } catch (error) {
    console.error(`Error fetching NSE historical data for ${symbol}:`, error.message);
    throw error;
  }
};

// Update stock data in the database using NSE data
const updateNseStockData = async (symbol) => {
  try {
    // Find the stock in the database
    const stock = await Stock.findOne({ symbol });
    
    if (!stock) {
      throw new Error(`Stock ${symbol} not found in database`);
    }
    
    // Fetch latest data from NSE API
    const stockData = await fetchNseStockQuote(symbol);
    
    // Update stock in database
    stock.price = stockData.price;
    stock.previousPrice = stockData.previousPrice;
    stock.change = stockData.change;
    stock.changePercent = stockData.changePercent;
    stock.lastUpdated = stockData.lastUpdated;
    
    // Check if we need to update historical data
    const today = new Date().toISOString().split('T')[0];
    const lastUpdateDate = stock.historicalData.length > 0 
      ? stock.historicalData[0].date.toISOString().split('T')[0] 
      : null;
    
    if (lastUpdateDate !== today || !lastUpdateDate) {
      try {
        // Fetch historical data
        const historicalData = await fetchNseHistoricalData(symbol);
        
        // Update stock with historical data
        stock.historicalData = historicalData;
      } catch (histError) {
        console.error(`Error updating NSE historical data for ${symbol}:`, histError.message);
        // Continue even if historical data update fails
      }
    }
    
    await stock.save();
    
    return stock;
  } catch (error) {
    console.error(`Error updating NSE stock data for ${symbol}:`, error.message);
    throw error;
  }
};

// Create a new stock with data from NSE API
const createNseStock = async (symbol, name, sector) => {
  try {
    // Check if stock already exists
    const existingStock = await Stock.findOne({ symbol });
    if (existingStock) {
      throw new Error(`Stock ${symbol} already exists`);
    }
    
    // Fetch data from NSE API
    const stockData = await fetchNseStockQuote(symbol);
    
    // Create new stock
    const stock = await Stock.create({
      symbol: stockData.symbol,
      name: name || stockData.name,
      price: stockData.price,
      previousPrice: stockData.previousPrice,
      change: stockData.change,
      changePercent: stockData.changePercent,
      sector: sector || stockData.sector || 'Unknown',
      lastUpdated: stockData.lastUpdated
    });
    
    // Fetch and add historical data
    try {
      const historicalData = await fetchNseHistoricalData(symbol);
      stock.historicalData = historicalData;
      await stock.save();
    } catch (histError) {
      console.error(`Error fetching NSE historical data for new stock ${symbol}:`, histError.message);
      // Continue even if historical data fetch fails
    }
    
    return stock;
  } catch (error) {
    console.error(`Error creating NSE stock ${symbol}:`, error.message);
    throw error;
  }
};

// Update all stocks in the database with NSE data
const updateAllNseStocks = async () => {
  try {
    const stocks = await Stock.find();
    const results = {
      success: [],
      failed: []
    };
    
    for (const stock of stocks) {
      try {
        await updateNseStockData(stock.symbol);
        results.success.push(stock.symbol);
      } catch (error) {
        results.failed.push({
          symbol: stock.symbol,
          error: error.message
        });
      }
      
      // Add a delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    return results;
  } catch (error) {
    console.error('Error updating all NSE stocks:', error.message);
    throw error;
  }
};

// Get historical data for a specific stock
const getNseStockHistoricalData = async (symbol) => {
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
    const historicalData = await fetchNseHistoricalData(symbol);
    
    // Update the stock with the historical data
    stock.historicalData = historicalData;
    await stock.save();
    
    return historicalData;
  } catch (error) {
    console.error(`Error getting NSE historical data for ${symbol}:`, error.message);
    throw error;
  }
};

module.exports = {
  fetchNseStockQuote,
  fetchNseHistoricalData,
  updateNseStockData,
  createNseStock,
  updateAllNseStocks,
  getNseStockHistoricalData
};