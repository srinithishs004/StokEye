const mongoose = require('mongoose');
const dotenv = require('dotenv');
const stockService = require('../services/stockService');

// Load environment variables
dotenv.config();

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected for seeding...'))
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

// Sample Indian stock symbols and names (NSE)
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
    console.log('Starting to seed stocks...');
    let successCount = 0;
    let errorCount = 0;

    // Add each stock with a delay to respect API rate limits
    for (const stock of stocks) {
      try {
        console.log(`Adding ${stock.symbol} - ${stock.name}...`);
        await stockService.createStockWithApiData(stock.symbol, stock.name, stock.sector);
        console.log(`✅ Successfully added ${stock.symbol}`);
        successCount++;
        
        // Add a delay to respect Alpha Vantage API rate limits (5 calls per minute for free tier)
        console.log('Waiting 12 seconds before next API call...');
        await new Promise(resolve => setTimeout(resolve, 12000));
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

// Run the seeding function
seedStocks();