const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Stock = require('../models/Stock');
const nseStockService = require('../services/nseStockService');

// Load environment variables
dotenv.config();

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected for seeding...'))
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

// Top Indian stocks from NSE
const stocks = [
  { symbol: 'RELIANCE.NSE', name: 'Reliance Industries Ltd.', sector: 'Energy' },
  { symbol: 'TCS.NSE', name: 'Tata Consultancy Services Ltd.', sector: 'Technology' },
  { symbol: 'HDFCBANK.NSE', name: 'HDFC Bank Ltd.', sector: 'Financial Services' },
  { symbol: 'INFY.NSE', name: 'Infosys Ltd.', sector: 'Technology' },
  { symbol: 'HINDUNILVR.NSE', name: 'Hindustan Unilever Ltd.', sector: 'Consumer Goods' },
  { symbol: 'ICICIBANK.NSE', name: 'ICICI Bank Ltd.', sector: 'Financial Services' },
  { symbol: 'SBIN.NSE', name: 'State Bank of India', sector: 'Financial Services' },
  { symbol: 'TATASTEEL.NSE', name: 'Tata Steel Ltd.', sector: 'Materials' },
  { symbol: 'AXISBANK.NSE', name: 'Axis Bank Ltd.', sector: 'Financial Services' },
  { symbol: 'TATAMOTORS.NSE', name: 'Tata Motors Ltd.', sector: 'Automotive' }
];

// Function to seed stocks
const seedStocks = async () => {
  try {
    console.log('Starting to seed NSE stocks...');
    let successCount = 0;
    let errorCount = 0;

    // Clear existing stocks
    await Stock.deleteMany({});
    console.log('Cleared existing stocks');

    // Add each stock with a delay to respect API rate limits
    for (const stock of stocks) {
      try {
        console.log(`Adding ${stock.symbol} - ${stock.name}...`);
        
        // Generate random price between 500 and 5000 (fallback if API fails)
        const price = parseFloat((Math.random() * 4500 + 500).toFixed(2));
        const changePercent = parseFloat((Math.random() * 10 - 5).toFixed(2));
        const previousPrice = parseFloat((price / (1 + changePercent / 100)).toFixed(2));
        const change = parseFloat((price - previousPrice).toFixed(2));
        
        // Try to fetch from NSE API first
        try {
          await nseStockService.createNseStock(stock.symbol, stock.name, stock.sector);
          console.log(`✅ Successfully added ${stock.symbol} from NSE API`);
        } catch (apiError) {
          console.error(`⚠️ NSE API error for ${stock.symbol}:`, apiError.message);
          console.log(`⚠️ Falling back to mock data for ${stock.symbol}`);
          
          // Create with mock data as fallback
          await Stock.create({
            symbol: stock.symbol,
            name: stock.name,
            price,
            previousPrice,
            change,
            changePercent,
            sector: stock.sector,
            lastUpdated: new Date(),
            historicalData: generateMockHistoricalData(price)
          });
          
          console.log(`✅ Successfully added ${stock.symbol} with mock data`);
        }
        
        successCount++;
        
        // Add a delay to respect API rate limits
        console.log('Waiting 2 seconds before next API call...');
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (error) {
        console.error(`❌ Error adding ${stock.symbol}:`, error.message);
        errorCount++;
      }
    }

    console.log('\nSeeding completed:');
    console.log(`✅ Successfully added: ${successCount} stocks`);
    console.log(`❌ Failed: ${errorCount} stocks`);
    
    // Disconnect from MongoDB
    await mongoose.disconnect();
    console.log('MongoDB disconnected');
    
    process.exit(0);
  } catch (error) {
    console.error('Error seeding stocks:', error);
    process.exit(1);
  }
};

// Generate mock historical data for fallback
const generateMockHistoricalData = (basePrice) => {
  const historicalData = [];
  let currentPrice = basePrice;
  
  // Generate data for the last 10 days
  for (let i = 9; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    
    // Random change percentage for this day
    const changePercent = parseFloat((Math.random() * 10 - 5).toFixed(2));
    
    // Calculate previous day's price
    const previousPrice = currentPrice;
    
    // Calculate new price based on change percentage
    currentPrice = parseFloat((previousPrice * (1 + changePercent / 100)).toFixed(2));
    
    // Calculate absolute change
    const change = parseFloat((currentPrice - previousPrice).toFixed(2));
    
    // Generate random high, low, and open prices
    const high = parseFloat((currentPrice * (1 + Math.random() * 0.02)).toFixed(2));
    const low = parseFloat((currentPrice * (1 - Math.random() * 0.02)).toFixed(2));
    const open = parseFloat((low + Math.random() * (high - low)).toFixed(2));
    
    // Generate random volume
    const volume = Math.floor(Math.random() * 10000000) + 1000000;
    
    historicalData.push({
      date,
      price: currentPrice,
      open,
      high,
      low,
      volume,
      change,
      changePercent
    });
  }
  
  return historicalData;
};

// Run the seeding function
seedStocks();