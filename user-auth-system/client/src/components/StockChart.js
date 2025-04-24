import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { formatInr, formatChange } from '../utils/currencyUtils';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const StockChart = ({ historicalData, symbol }) => {
  if (!historicalData || historicalData.length === 0) {
    return <div className="text-center p-4">No historical data available</div>;
  }

  // Sort data by date (oldest to newest)
  const sortedData = [...historicalData].sort((a, b) => new Date(a.date) - new Date(b.date));

  // Format dates for display
  const labels = sortedData.map(item => new Date(item.date).toLocaleDateString());
  
  // Prepare price data
  const priceData = sortedData.map(item => item.price);
  
  // Determine if each day was profit or loss
  const colors = sortedData.map(item => item.change >= 0 ? 'rgba(75, 192, 192, 0.6)' : 'rgba(255, 99, 132, 0.6)');
  const borderColors = sortedData.map(item => item.change >= 0 ? 'rgb(75, 192, 192)' : 'rgb(255, 99, 132)');

  // Prepare chart data
  const data = {
    labels,
    datasets: [
      {
        label: `${symbol} Price`,
        data: priceData,
        backgroundColor: colors,
        borderColor: borderColors,
        borderWidth: 2,
        pointBackgroundColor: borderColors,
        pointBorderColor: '#fff',
        pointBorderWidth: 1,
        pointRadius: 5,
        tension: 0.1,
        fill: false
      }
    ]
  };

  // Chart options
  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: `${symbol} - Last 10 Days Performance`,
        font: {
          size: 16
        }
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const index = context.dataIndex;
            const item = sortedData[index];
            return [
              `Price: ${formatInr(item.price)}`,
              `Open: ${formatInr(item.open)}`,
              `High: ${formatInr(item.high)}`,
              `Low: ${formatInr(item.low)}`,
              `Change: ${formatChange(item.change)} (${item.changePercent.toFixed(2)}%)`
            ];
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: false,
        title: {
          display: true,
          text: 'Price ($)'
        },
        ticks: {
          callback: (value) => `$${value.toFixed(2)}`
        }
      },
      x: {
        title: {
          display: true,
          text: 'Date'
        }
      }
    }
  };

  return (
    <div className="chart-container">
      <Line data={data} options={options} />
      
      <div className="mt-4">
        <h5>Performance Summary</h5>
        <div className="table-responsive">
          <table className="table table-sm table-striped">
            <thead>
              <tr>
                <th>Date</th>
                <th>Open</th>
                <th>Close</th>
                <th>High</th>
                <th>Low</th>
                <th>Change</th>
                <th>Change %</th>
              </tr>
            </thead>
            <tbody>
              {sortedData.map((item, index) => (
                <tr key={index} className={item.change >= 0 ? 'table-success' : 'table-danger'}>
                  <td>{new Date(item.date).toLocaleDateString()}</td>
                  <td>{formatInr(item.open)}</td>
                  <td>{formatInr(item.price)}</td>
                  <td>{formatInr(item.high)}</td>
                  <td>{formatInr(item.low)}</td>
                  <td className={item.change >= 0 ? 'text-success' : 'text-danger'}>
                    {formatChange(item.change)}
                  </td>
                  <td className={item.change >= 0 ? 'text-success' : 'text-danger'}>
                    {item.change >= 0 ? '+' : ''}{item.changePercent.toFixed(2)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default StockChart;