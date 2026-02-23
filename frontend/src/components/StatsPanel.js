import React from 'react';
import { Chart as ChartJS, ArcElement, CategoryScale, LinearScale, BarElement, Tooltip, Legend } from 'chart.js';
import { Pie, Bar } from 'react-chartjs-2';

ChartJS.register(ArcElement, CategoryScale, LinearScale, BarElement, Tooltip, Legend);

const StatsPanel = ({ stats }) => {
  if (!stats) {
    return (
      <div className="card text-center">
        <p className="text-gray-500">Loading statistics...</p>
      </div>
    );
  }

  const verificationData = {
    labels: ['Verified', 'Unverified'],
    datasets: [
      {
        data: [stats.verified, stats.unverified],
        backgroundColor: ['#10b981', '#ef4444'],
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
        backgroundColor: '#6366f1',
        borderColor: '#4f46e5',
        borderWidth: 1
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          padding: 8,
          font: {
            size: 11
          },
          boxWidth: 12,
          boxHeight: 12
        }
      },
      tooltip: {
        titleFont: {
          size: 12
        },
        bodyFont: {
          size: 11
        },
        padding: 8
      }
    },
    scales: {
      x: {
        ticks: {
          font: {
            size: 10
          }
        }
      },
      y: {
        ticks: {
          font: {
            size: 10
          }
        }
      }
    }
  };

  return (
    <div className="space-y-3 sm:space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
        <h2 className="text-lg sm:text-xl font-bold text-gray-900">
          System Statistics
        </h2>
        <div className="flex items-center gap-1.5 bg-green-100 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg border-2 border-green-300">
          <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
          <span className="text-xs font-bold text-green-700">Live Data</span>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3">
        <div className="card text-center border-2 border-gray-900 bg-gradient-to-br from-gray-50 to-gray-100 hover:shadow-lg transition-all p-3">
          <div className="text-xl sm:text-2xl lg:text-3xl font-black text-gray-900 mb-0.5">{stats.total}</div>
          <div className="text-[10px] sm:text-xs text-gray-600 font-semibold uppercase tracking-wide">Total Claims</div>
        </div>

        <div className="card text-center border-2 border-green-300 bg-gradient-to-br from-green-50 to-green-100 hover:shadow-lg transition-all p-3">
          <div className="text-xl sm:text-2xl lg:text-3xl font-black text-green-700 mb-0.5">{stats.verified}</div>
          <div className="text-[10px] sm:text-xs text-gray-600 font-semibold uppercase tracking-wide">Verified</div>
        </div>

        <div className="card text-center border-2 border-red-300 bg-gradient-to-br from-red-50 to-red-100 hover:shadow-lg transition-all p-3">
          <div className="text-xl sm:text-2xl lg:text-3xl font-black text-red-700 mb-0.5">{stats.unverified}</div>
          <div className="text-[10px] sm:text-xs text-gray-600 font-semibold uppercase tracking-wide">Unverified</div>
        </div>

        <div className="card text-center border-2 border-blue-300 bg-gradient-to-br from-blue-50 to-blue-100 hover:shadow-lg transition-all p-3">
          <div className="text-xl sm:text-2xl lg:text-3xl font-black text-blue-700 mb-0.5">{stats.verificationRate}%</div>
          <div className="text-[10px] sm:text-xs text-gray-600 font-semibold uppercase tracking-wide">Verification Rate</div>
        </div>

        <div className="card text-center border-2 border-purple-300 bg-gradient-to-br from-purple-50 to-purple-100 hover:shadow-lg transition-all p-3">
          <div className="text-xl sm:text-2xl lg:text-3xl font-black text-purple-700 mb-0.5">{stats.avgCredibility}%</div>
          <div className="text-[10px] sm:text-xs text-gray-600 font-semibold uppercase tracking-wide">Avg Credibility</div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        <div className="card border-2 border-gray-200 hover:shadow-lg transition-all p-3 sm:p-4">
          <h3 className="text-sm sm:text-base font-bold text-gray-900 mb-2 sm:mb-3 flex items-center gap-1.5">
            📈 Verification Status
          </h3>
          <div className="h-40 sm:h-48 md:h-56">
            <Pie data={verificationData} options={chartOptions} />
          </div>
        </div>

        <div className="card border-2 border-gray-200 hover:shadow-lg transition-all p-3 sm:p-4">
          <h3 className="text-sm sm:text-base font-bold text-gray-900 mb-2 sm:mb-3 flex items-center gap-1.5">
            📊 Category Distribution
          </h3>
          <div className="h-40 sm:h-48 md:h-56">
            <Bar data={categoryData} options={chartOptions} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatsPanel;