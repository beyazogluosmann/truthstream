import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import SubmitClaim from './components/SubmitClaim';
import './styles/App.css';

function Navigation() {
  const location = useLocation();
  
  return (
    <nav className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 border-b border-gray-700 shadow-xl sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Title */}
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
              <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                TruthStream
              </h1>
              <div className="hidden md:block">
                <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs font-semibold rounded border border-green-500/30">
                  LIVE
                </span>
              </div>
            </Link>
          </div>

          {/* Center - Description */}
          <div className="hidden lg:flex items-center">
            <p className="text-gray-300 text-sm flex items-center gap-2">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
              Gerçek Haber Doğrulama Sistemi
            </p>
          </div>

          {/* Right - Status */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-gray-800/50 rounded-lg border border-gray-700">
            <div className="flex flex-col items-end">
              <span className="text-[10px] text-gray-400 uppercase tracking-wide">Status</span>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></span>
                <span className="text-xs text-green-400 font-semibold">Online</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Navigation />

        {/* Main Content */}
        <Routes>
          <Route path="/" element={<SubmitClaim />} />
          <Route path="/submit" element={<SubmitClaim />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;