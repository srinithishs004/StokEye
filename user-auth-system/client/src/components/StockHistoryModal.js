import React, { useState, useEffect } from 'react';
import axios from 'axios';
import StockChart from './StockChart';

const StockHistoryModal = ({ symbol, show, onClose }) => {
  const [historicalData, setHistoricalData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchHistoricalData = async () => {
      if (!show || !symbol) return;
      
      try {
        setLoading(true);
        setError(null);
        
        const res = await axios.get(`/api/stocks/${symbol}/history`);
        setHistoricalData(res.data.data);
        
        setLoading(false);
      } catch (err) {
        setError('Error fetching historical data: ' + (err.response?.data?.message || err.message));
        setLoading(false);
        console.error(err);
      }
    };

    fetchHistoricalData();
  }, [symbol, show]);

  if (!show) return null;

  return (
    <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-lg modal-dialog-centered">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">
              <i className="bi bi-graph-up me-2"></i>
              {symbol} Historical Performance
            </h5>
            <button 
              type="button" 
              className="btn-close" 
              onClick={onClose}
              aria-label="Close"
            ></button>
          </div>
          <div className="modal-body">
            {loading ? (
              <div className="text-center p-4">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
                <p className="mt-2">Loading historical data...</p>
              </div>
            ) : error ? (
              <div className="alert alert-danger" role="alert">
                {error}
              </div>
            ) : (
              <StockChart historicalData={historicalData} symbol={symbol} />
            )}
          </div>
          <div className="modal-footer">
            <button 
              type="button" 
              className="btn btn-secondary" 
              onClick={onClose}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StockHistoryModal;