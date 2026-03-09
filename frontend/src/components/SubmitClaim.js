import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { submitClaim } from '../services/api';

function SubmitClaim() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    text: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const categories = [
    'Technology', 'Health', 'Politics', 'Science',
    'Sports', 'Entertainment', 'Business', 'Environment'
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.text.trim()) {
      setMessage({ type: 'error', text: ' Lütfen haber metnini girin!' });
      return;
    }

    if (formData.text.trim().length < 10) {
      setMessage({ type: 'error', text: ' Haber metni en az 10 karakter olmalıdır!' });
      return;
    }

    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const response = await submitClaim(formData);
      
      if (response.success) {
        setMessage({ 
          type: 'success', 
          text: ' Haber gönderildi! Sonuçlar sayfasına yönlendiriliyorsunuz...'
        });
        setFormData({ text: '' });
        
        // 2 saniye sonra dashboard'a yönlendir
        setTimeout(() => {
          navigate('/dashboard');
        }, 2000);
      }
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: ' Hata: ' + (error.response?.data?.error || error.message) 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 py-8 px-4 sm:px-6 lg:px-8">
      {/* Background Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-1/4 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
        <div className="absolute top-1/3 -right-1/4 w-96 h-96 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse delay-700"></div>
        <div className="absolute -bottom-1/4 left-1/2 w-96 h-96 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse delay-1000"></div>
      </div>

      <div className="max-w-4xl mx-auto relative z-10">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-5xl md:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-200 via-pink-200 to-purple-200 mb-4 tracking-tight">
            TruthStream AI
          </h1>
          <p className="text-gray-400 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
            Yapay zeka ile haberleri gerçek zamanlı doğrulayın. 
            Dezenformasyona karşı en güçlü silahınız.
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-slate-800/50 backdrop-blur-xl rounded-3xl shadow-2xl border border-slate-700/50 p-8 md:p-10">
          {/* Card Header */}
          <div className="flex items-center gap-3 mb-8 pb-6 border-b border-slate-700/50">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Haber Doğrulama</h2>
              <p className="text-sm text-gray-400">Şüpheli haberi yapıştırın, AI analiz etsin</p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Haber Metni */}
            <div className="group">
              <label htmlFor="text" className="block text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-purple-500/20 flex items-center justify-center text-purple-400 text-xs">1</span>
                Haber Metni <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <textarea
                  id="text"
                  value={formData.text}
                  onChange={(e) => setFormData({ ...formData, text: e.target.value })}
                  placeholder="Şüpheli haberi buraya yapıştırın... Örnek: 'Elon Musk, Mars'a ilk insan kolonisini kurdu!'"
                  rows="6"
                  maxLength="1000"
                  required
                  className="w-full px-4 py-4 bg-slate-900/50 border-2 border-slate-700 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all resize-none text-gray-100 placeholder-gray-500 font-mono text-sm leading-relaxed"
                />
                <div className="absolute bottom-3 right-3 px-3 py-1 bg-slate-800/80 backdrop-blur-sm rounded-lg border border-slate-700">
                  <span className={`text-xs font-medium ${formData.text.length > 800 ? 'text-orange-400' : 'text-gray-400'}`}>
                    {formData.text.length}/1000
                  </span>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full relative group overflow-hidden bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 text-white font-bold py-5 px-6 rounded-xl hover:shadow-2xl hover:shadow-purple-500/50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 focus:ring-offset-slate-900 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] mt-8"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative flex items-center justify-center gap-3">
                {loading ? (
                  <>
                    <svg className="animate-spin h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span className="text-lg">AI Analiz Ediyor...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    <span className="text-lg">Doğrulama Başlat</span>
                  </>
                )}
              </div>
            </button>
          </form>

          {/* Message */}
          {message.text && (
            <div className={`mt-6 p-4 rounded-xl border-2 ${
              message.type === 'success' 
                ? 'bg-green-500/10 border-green-500/50 text-green-300' 
                : 'bg-red-500/10 border-red-500/50 text-red-300'
            } backdrop-blur-sm animate-fade-in`}>
              <p className="text-center font-medium">{message.text}</p>
            </div>
          )}

          {/* Info Box */}
          <div className="mt-10 relative">
            {/* Glow Effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-pink-500/20 blur-xl rounded-2xl"></div>
            
            <div className="relative bg-slate-900/80 border border-purple-500/30 rounded-2xl p-8 backdrop-blur-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center shadow-lg shadow-purple-500/50">
                  <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Nasıl Çalışır?</h3>
                  <p className="text-sm text-gray-400">3 basit adımda haber doğrulama</p>
                </div>
              </div>

              <div className="space-y-4">
                {/* Step 1 */}
                <div className="flex gap-4 group hover:bg-purple-500/5 p-4 rounded-xl transition-all duration-300">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 rounded-lg bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-300 font-bold group-hover:bg-purple-500 group-hover:text-white transition-all duration-300">
                      1
                    </div>
                  </div>
                  <div className="flex-1">
                    <h4 className="text-white font-semibold mb-1">Haberi Yapıştırın</h4>
                    <p className="text-gray-400 text-sm">Şüpheli haberin metnini yukarıdaki forma kopyalayıp yapıştırın</p>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="flex gap-4 group hover:bg-purple-500/5 p-4 rounded-xl transition-all duration-300">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 rounded-lg bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-300 font-bold group-hover:bg-purple-500 group-hover:text-white transition-all duration-300">
                      2
                    </div>
                  </div>
                  <div className="flex-1">
                    <h4 className="text-white font-semibold mb-1">Doğrulama Başlatın</h4>
                    <p className="text-gray-400 text-sm">"Doğrulama Başlat" butonuna tıklayın ve AI sisteminin çalışmasını bekleyin</p>
                  </div>
                </div>

                {/* Step 3 */}
                <div className="flex gap-4 group hover:bg-purple-500/5 p-4 rounded-xl transition-all duration-300">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 rounded-lg bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-300 font-bold group-hover:bg-purple-500 group-hover:text-white transition-all duration-300">
                      3
                    </div>
                  </div>
                  <div className="flex-1">
                    <h4 className="text-white font-semibold mb-1">Sonuçları Görün</h4>
                    <p className="text-gray-400 text-sm">Birkaç saniye içinde haberin doğruluk skorunu ve analizini göreceksiniz</p>
                  </div>
                </div>
              </div>

              {/* Bottom Badge */}
              <div className="mt-6 pt-6 border-t border-purple-500/20">
                <div className="flex items-center justify-center gap-2 text-sm text-gray-400">
                  <svg className="w-4 h-4 text-purple-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                  </svg>
                  <span>Ortalama işlem süresi: <strong className="text-purple-300">2-3 saniye</strong></span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SubmitClaim;
