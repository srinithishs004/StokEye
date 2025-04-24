import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import StockHistoryModal from '../components/StockHistoryModal';
import { formatInr, formatChange } from '../utils/currencyUtils';

const Dashboard = () => {
  const { user } = useAuth();
  const [stocks, setStocks] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [favoritesLoading, setFavoritesLoading] = useState(true);
  const [error, setError] = useState(null);
  const [favoritesError, setFavoritesError] = useState(null);
  const [activeTab, setActiveTab] = useState('realtime');
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedStock, setSelectedStock] = useState(null);

  // Fetch stocks
  useEffect(() => {
    const fetchStocks = async () => {
      try {
        setLoading(true);
        const res = await axios.get('/api/stocks');
        setStocks(res.data.data);
        setLoading(false);
      } catch (err) {
        setError('Error fetching stocks');
        setLoading(false);
        console.error(err);
      }
    };

    fetchStocks();

    // Set up interval to refresh stock data every 15 seconds for real-time updates
    const interval = setInterval(() => {
      fetchStocks();
    }, 15000);

    return () => clearInterval(interval);
  }, []);
  
  // Fetch user's favorites
  useEffect(() => {
    const fetchFavorites = async () => {
      if (!user) return;
      
      try {
        setFavoritesLoading(true);
        const res = await axios.get('/api/favorites');
        setFavorites(res.data.data);
        setFavoritesLoading(false);
      } catch (err) {
        setFavoritesError('Error fetching favorites');
        setFavoritesLoading(false);
        console.error(err);
      }
    };

    fetchFavorites();
  }, [user]);

  // Function to sort stocks by change percent (descending)
  const getTopPerformers = () => {
    return [...stocks].sort((a, b) => b.changePercent - a.changePercent).slice(0, 5);
  };

  // Function to sort stocks by change percent (ascending)
  const getWorstPerformers = () => {
    return [...stocks].sort((a, b) => a.changePercent - b.changePercent).slice(0, 5);
  };
  
  // Function to handle opening the history modal
  const handleOpenHistoryModal = (stock) => {
    setSelectedStock(stock);
    setShowHistoryModal(true);
  };
  
  // Function to handle closing the history modal
  const handleCloseHistoryModal = () => {
    setShowHistoryModal(false);
    setSelectedStock(null);
  };
  
  // Function to check if a stock is in favorites
  const isStockInFavorites = (stockId) => {
    return favorites.some(fav => fav._id === stockId);
  };
  
  // Function to add a stock to favorites
  const addToFavorites = async (stockId) => {
    try {
      await axios.post('/api/favorites', { stockId });
      
      // Refresh favorites
      const res = await axios.get('/api/favorites');
      setFavorites(res.data.data);
    } catch (err) {
      console.error('Error adding to favorites:', err);
      alert('Error adding to favorites: ' + (err.response?.data?.message || err.message));
    }
  };
  
  // Function to remove a stock from favorites
  const removeFromFavorites = async (favoriteId) => {
    try {
      await axios.delete(`/api/favorites/${favoriteId}`);
      
      // Refresh favorites
      const res = await axios.get('/api/favorites');
      setFavorites(res.data.data);
    } catch (err) {
      console.error('Error removing from favorites:', err);
      alert('Error removing from favorites: ' + (err.response?.data?.message || err.message));
    }
  };

  return (
    <div className="container mt-4">
      <h2 className="mb-4">StockEye Dashboard</h2>
      
      <div className="row mb-4">
        <div className="col-md-4">
          <div className="card">
            <div className="card-header bg-primary text-white">
              <h5 className="mb-0">User Profile</h5>
            </div>
            <div className="card-body">
              <div className="mb-3">
                <strong>Name:</strong> {user?.name}
              </div>
              <div className="mb-3">
                <strong>Email:</strong> {user?.email}
              </div>
              <div className="mb-3">
                <strong>Account Created:</strong> {new Date(user?.createdAt).toLocaleDateString()}
              </div>
            </div>
          </div>
        </div>
        
        <div className="col-md-8">
          <div className="card">
            <div className="card-header bg-dark text-white">
              <h5 className="mb-0">Market Overview</h5>
            </div>
            <div className="card-body">
              {loading ? (
                <div className="text-center">
                  <div className="spinner-border" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                </div>
              ) : error ? (
                <div className="alert alert-danger" role="alert">
                  {error}
                </div>
              ) : (
                <div className="row">
                  <div className="col-md-6">
                    <div className="card border-success mb-3">
                      <div className="card-header bg-success text-white">Top Performers</div>
                      <div className="card-body">
                        <ul className="list-group">
                          {getTopPerformers().map(stock => (
                            <li key={stock.symbol} className="list-group-item d-flex justify-content-between align-items-center">
                              <div>
                                <strong>{stock.symbol}</strong> - {stock.name}
                              </div>
                              <span className="badge bg-success rounded-pill">
                                +{stock.changePercent.toFixed(2)}%
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="card border-danger mb-3">
                      <div className="card-header bg-danger text-white">Worst Performers</div>
                      <div className="card-body">
                        <ul className="list-group">
                          {getWorstPerformers().map(stock => (
                            <li key={stock.symbol} className="list-group-item d-flex justify-content-between align-items-center">
                              <div>
                                <strong>{stock.symbol}</strong> - {stock.name}
                              </div>
                              <span className="badge bg-danger rounded-pill">
                                {stock.changePercent.toFixed(2)}%
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      <div className="card">
        <div className="card-header">
          <ul className="nav nav-tabs card-header-tabs">
            <li className="nav-item">
              <button 
                className={`nav-link ${activeTab === 'realtime' ? 'active' : ''}`}
                onClick={() => setActiveTab('realtime')}
              >
                <i className="bi bi-graph-up me-2"></i>
                Real-time Stocks
              </button>
            </li>
            <li className="nav-item">
              <button 
                className={`nav-link ${activeTab === 'favorites' ? 'active' : ''}`}
                onClick={() => setActiveTab('favorites')}
              >
                <i className="bi bi-star me-2"></i>
                My Favorites
              </button>
            </li>
            <li className="nav-item">
              <button 
                className={`nav-link ${activeTab === 'portfolio' ? 'active' : ''}`}
                onClick={() => setActiveTab('portfolio')}
              >
                <i className="bi bi-briefcase me-2"></i>
                My Portfolio
              </button>
            </li>
          </ul>
        </div>
        <div className="card-body">
          {activeTab === 'realtime' && (
            <div>
              <div className="d-flex justify-content-between align-items-center">
                <h5 className="card-title mb-0">Real-time Stock Prices</h5>
                <div className="real-time-indicator">
                  <span className="badge bg-success me-1">
                    <i className="bi bi-broadcast-pin"></i>
                  </span>
                  <small>Live Updates</small>
                </div>
              </div>
              {loading ? (
                <div className="text-center">
                  <div className="spinner-border" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                </div>
              ) : error ? (
                <div className="alert alert-danger" role="alert">
                  {error}
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-striped table-hover">
                    <thead>
                      <tr>
                        <th>Symbol</th>
                        <th>Name</th>
                        <th>Price</th>
                        <th>Change</th>
                        <th>Change %</th>
                        <th>Sector</th>
                        <th>Last Updated</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stocks.length === 0 ? (
                        <tr>
                          <td colSpan="7" className="text-center">No stocks found</td>
                        </tr>
                      ) : (
                        stocks.map((stock) => (
                          <tr key={stock.symbol}>
                            <td>
                              <a 
                                href="#" 
                                onClick={(e) => {
                                  e.preventDefault();
                                  handleOpenHistoryModal(stock);
                                }}
                                className="text-decoration-none"
                              >
                                <strong>{stock.symbol}</strong>
                                <i className="bi bi-graph-up-arrow ms-2 text-primary"></i>
                              </a>
                            </td>
                            <td>{stock.name}</td>
                            <td>{formatInr(stock.price)}</td>
                            <td className={stock.change >= 0 ? 'text-success' : 'text-danger'}>
                              {formatChange(stock.change)}
                            </td>
                            <td className={stock.changePercent >= 0 ? 'text-success' : 'text-danger'}>
                              {stock.changePercent >= 0 ? '+' : ''}{stock.changePercent.toFixed(2)}%
                            </td>
                            <td>{stock.sector || 'N/A'}</td>
                            <td>{new Date(stock.lastUpdated).toLocaleString()}</td>
                            <td>
                              {isStockInFavorites(stock._id) ? (
                                <button 
                                  className="btn btn-sm btn-danger"
                                  onClick={() => {
                                    const favorite = favorites.find(f => f._id === stock._id);
                                    if (favorite) {
                                      removeFromFavorites(favorite.favoriteId);
                                    }
                                  }}
                                >
                                  <i className="bi bi-star-fill me-1"></i> Remove
                                </button>
                              ) : (
                                <button 
                                  className="btn btn-sm btn-outline-primary"
                                  onClick={() => addToFavorites(stock._id)}
                                >
                                  <i className="bi bi-star me-1"></i> Add to Favorites
                                </button>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
          
          {activeTab === 'favorites' && (
            <div className="card-body">
              <h5 className="card-title">My Favorite Stocks</h5>
              {favoritesLoading ? (
                <div className="text-center">
                  <div className="spinner-border" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                </div>
              ) : favoritesError ? (
                <div className="alert alert-danger" role="alert">
                  {favoritesError}
                </div>
              ) : favorites.length === 0 ? (
                <div className="alert alert-info">
                  <i className="bi bi-info-circle me-2"></i>
                  You haven't added any stocks to your favorites yet.
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-striped table-hover">
                    <thead>
                      <tr>
                        <th>Symbol</th>
                        <th>Name</th>
                        <th>Price</th>
                        <th>Change</th>
                        <th>Change %</th>
                        <th>Sector</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {favorites.map((stock) => (
                        <tr key={stock.symbol}>
                          <td>
                            <a 
                              href="#" 
                              onClick={(e) => {
                                e.preventDefault();
                                handleOpenHistoryModal(stock);
                              }}
                              className="text-decoration-none"
                            >
                              <strong>{stock.symbol}</strong>
                              <i className="bi bi-graph-up-arrow ms-2 text-primary"></i>
                            </a>
                          </td>
                          <td>{stock.name}</td>
                          <td>₹{stock.price.toFixed(2)}</td>
                          <td className={stock.change >= 0 ? 'text-success' : 'text-danger'}>
                            {stock.change >= 0 ? '+' : ''}₹{stock.change.toFixed(2)}
                          </td>
                          <td className={stock.changePercent >= 0 ? 'text-success' : 'text-danger'}>
                            {stock.changePercent >= 0 ? '+' : ''}{stock.changePercent.toFixed(2)}%
                          </td>
                          <td>{stock.sector || 'N/A'}</td>
                          <td>
                            <button 
                              className="btn btn-sm btn-danger"
                              onClick={() => removeFromFavorites(stock.favoriteId)}
                            >
                              <i className="bi bi-trash me-1"></i> Remove
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
          
          {activeTab === 'portfolio' && (
            <div>
              <h5 className="card-title">My Portfolio</h5>
              <p className="card-text">
                You haven't added any stocks to your portfolio yet.
                Start building your investment portfolio by adding stocks.
              </p>
              <div className="alert alert-info">
                <i className="bi bi-info-circle me-2"></i>
                This feature will be available soon!
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Stock History Modal */}
      {selectedStock && (
        <StockHistoryModal
          symbol={selectedStock.symbol}
          show={showHistoryModal}
          onClose={handleCloseHistoryModal}
        />
      )}
    </div>
  );
};

export default Dashboard;