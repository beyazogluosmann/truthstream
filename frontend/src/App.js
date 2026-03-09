import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import SubmitClaim from './components/SubmitClaim';
import Dashboard from './components/Dashboard';
import './styles/App.css';

function Navigation() {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <nav className="bg-gradient-to-r from-slate-900 via-purple-900/50 to-slate-900 border-b border-purple-500/20 shadow-2xl sticky top-0 z-50 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Logo & Title */}
          <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition-all duration-300 group">
            <div className="relative">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center shadow-lg shadow-purple-500/50 group-hover:shadow-purple-500/70 transition-all duration-300">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="absolute -top-1 -right-1 w-3 h-3">
                <span className="absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75 animate-ping"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-purple-500"></span>
              </div>
            </div>

            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-200 via-pink-200 to-purple-200">
                TruthStream
              </h1>
              <p className="text-[10px] text-purple-400 font-medium tracking-wider">AI FACT CHECKER</p>
            </div>
          </Link>

          {/* Navigation Links - Desktop (Centered) */}
          <div className="hidden md:flex items-center gap-2 absolute left-1/2 -translate-x-1/2">
            <Link
              to="/"
              className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
                location.pathname === '/' || location.pathname === '/submit'
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/50'
                  : 'text-gray-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              Doğrulama
            </Link>
            <Link
              to="/dashboard"
              className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
                location.pathname === '/dashboard'
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/50'
                  : 'text-gray-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              Sonuçlar
            </Link>
          </div>

          {/* Right - Version Badge */}
          <div className="hidden sm:flex items-center gap-2">
            <div className="px-3 py-1.5 bg-slate-800/50 border border-slate-700/50 rounded-lg backdrop-blur-sm">
              <span className="text-xs text-gray-400 font-mono">v1.0.0</span>
            </div>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg text-gray-400 hover:text-white hover:bg-slate-800/50 transition-all duration-300"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {mobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>

        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-purple-500/20 bg-slate-900/95 backdrop-blur-xl">
            <div className="px-4 py-4 space-y-2">
              <Link
                to="/"
                onClick={() => setMobileMenuOpen(false)}
                className={`block px-4 py-3 rounded-lg font-medium transition-all duration-300 ${
                  location.pathname === '/' || location.pathname === '/submit'
                    ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/50'
                    : 'text-gray-400 hover:text-white hover:bg-slate-800/50'
                }`}
              >
                🔍 Doğrulama
              </Link>
              <Link
                to="/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className={`block px-4 py-3 rounded-lg font-medium transition-all duration-300 ${
                  location.pathname === '/dashboard'
                    ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/50'
                    : 'text-gray-400 hover:text-white hover:bg-slate-800/50'
                }`}
              >
                📊 Sonuçlar
              </Link>
            </div>
          </div>
        )}

      </div>
    </nav>
  );
}

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <Routes>
          <Route path="/" element={<SubmitClaim />} />
          <Route path="/submit" element={<SubmitClaim />} />
          <Route path="/dashboard" element={<Dashboard />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;