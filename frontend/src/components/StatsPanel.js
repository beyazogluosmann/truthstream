import React from 'react';
import { Chart as ChartJS, ArcElement, CategoryScale, LinearScale, BarElement, Tooltip, Legend } from 'chart.js';
import { Pie, Bar } from 'react-chartjs-2';
import '../styles/StatsPanel.css';

ChartJS.register(ArcElement, CategoryScale, LinearScale, BarElement, Tooltip, Legend);

const StatsPanel = ({ stats }) => {
  if (!stats) {
    return (
      <div className="stats-panel">
        <p>Loading statistics...</p>
      </div>
    );
  }

  const verificationData = {
    labels: ['Verified', 'Unverified'],
    datasets: [
      {
        data: [stats.verified, stats.unverified],
        backgroundColor: ['#28a745', '#dc3545'],
        borderColor: ['#fff', '#fff'],
        borderWidth: 2
      }
    ]
  };

  const categoryData = {
    labels: stats.categoryDistribution.map(cat => cat.category),
    datasets: [
      {
        label: 'Claims by Category',
        data: stats.categoryDistribution.map(cat => cat.count),
        backgroundColor: '#007bff',
        borderColor: '#0056b3',
        borderWidth: 1
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom'
      }
    }
  };

  return (
    <div className="stats-panel">
      <h2 className="stats-title">System Statistics</h2>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-value">{stats.total}</div>
          <div className="stat-label">Total Claims</div>
        </div>

        <div className="stat-card">
          <div className="stat-value">{stats.verified}</div>
          <div className="stat-label">Verified</div>
        </div>

        <div className="stat-card">
          <div className="stat-value">{stats.unverified}</div>
          <div className="stat-label">Unverified</div>
        </div>

        <div className="stat-card">
          <div className="stat-value">{stats.verificationRate}%</div>
          <div className="stat-label">Verification Rate</div>
        </div>

        <div className="stat-card">
          <div className="stat-value">{stats.avgCredibility}%</div>
          <div className="stat-label">Avg Credibility</div>
        </div>
      </div>

      <div className="charts-container">
        <div className="chart-box">
          <h3 className="chart-title">Verification Status</h3>
          <div className="chart-wrapper">
            <Pie data={verificationData} options={chartOptions} />
          </div>
        </div>

        <div className="chart-box">
          <h3 className="chart-title">Category Distribution</h3>
          <div className="chart-wrapper">
            <Bar data={categoryData} options={chartOptions} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatsPanel;