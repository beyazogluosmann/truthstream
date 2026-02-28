import React, { useState } from 'react';
import { submitClaim } from '../services/api';

function SubmitClaim() {
  const [formData, setFormData] = useState({
    text: '',
    category: 'Technology',
    source: ''
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
      setMessage({ type: 'error', text: '❌ Lütfen haber metnini girin!' });
      return;
    }

    if (formData.text.trim().length < 10) {
      setMessage({ type: 'error', text: '❌ Haber metni en az 10 karakter olmalıdır!' });
      return;
    }

    if (!formData.source.trim()) {
      setMessage({ type: 'error', text: '❌ Lütfen kaynak belirtin!' });
      return;
    }

    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const response = await submitClaim(formData);
      
      if (response.success) {
        setMessage({ 
          type: 'success', 
          text: '✅ Haber gönderildi! Doğrulama yapılıyor... Dashboard\'dan sonuçları kontrol edebilirsiniz.' 
        });
        setFormData({ text: '', category: 'Technology', source: '' });
        
        setTimeout(() => setMessage({ type: '', text: '' }), 5000);
      }
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: '❌ Hata: ' + (error.response?.data?.error || error.message) 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-2xl shadow-2xl p-8 md:p-12">
          {/* Header */}
          <div className="text-center mb-10">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              📰 Haber Doğrulama Talebi
            </h2>
            <p className="text-gray-600 text-lg max-w-2xl mx-auto">
              Doğruluğundan emin olmadığınız bir haber gördünüz mü? 
              Bize gönderin, gerçek olup olmadığını kontrol edelim!
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Haber Metni */}
            <div>
              <label htmlFor="text" className="block text-sm font-semibold text-gray-700 mb-2">
                Haber Metni <span className="text-red-500">*</span>
              </label>
              <textarea
                id="text"
                value={formData.text}
                onChange={(e) => setFormData({ ...formData, text: e.target.value })}
                placeholder="Örnek: 'Elon Musk, Mars'a ilk insan kolonisini kurdu!'"
                rows="6"
                maxLength="1000"
                required
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors resize-none text-gray-900 placeholder-gray-400"
              />
              <p className="mt-2 text-sm text-gray-500 text-right">
                {formData.text.length}/1000 karakter
              </p>
            </div>

            {/* Kategori ve Kaynak */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="category" className="block text-sm font-semibold text-gray-700 mb-2">
                  Kategori <span className="text-red-500">*</span>
                </label>
                <select
                  id="category"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  required
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors text-gray-900"
                >
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="source" className="block text-sm font-semibold text-gray-700 mb-2">
                  Kaynak <span className="text-red-500">*</span>
                </label>
                <input
                  id="source"
                  type="text"
                  value={formData.source}
                  onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                  placeholder="Örnek: Twitter, Facebook"
                  maxLength="100"
                  required
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors text-gray-900 placeholder-gray-400"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold py-4 px-6 rounded-lg hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Gönderiliyor...
                </>
              ) : (
                <>🚀 Doğrulama Talebi Gönder</>
              )}
            </button>
          </form>

          {/* Message */}
          {message.text && (
            <div className={`mt-6 p-4 rounded-lg ${
              message.type === 'success' 
                ? 'bg-green-50 border border-green-200 text-green-800' 
                : 'bg-red-50 border border-red-200 text-red-800'
            } animate-fade-in`}>
              <p className="text-center font-medium">{message.text}</p>
            </div>
          )}

          {/* Info Box */}
          <div className="mt-10 bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-indigo-500 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              ℹ️ Nasıl Çalışır?
            </h3>
            <ol className="space-y-3 text-gray-700 list-decimal list-inside">
              <li>Şüphelendiğiniz haberin metnini yukarıdaki forma yapıştırın</li>
              <li>Haberin kategorisini ve nereden gördüğünüzü belirtin</li>
              <li>Gönder butonuna tıklayın</li>
              <li>Sistemimiz haberi otomatik olarak analiz edecek</li>
              <li>Dashboard'da doğrulama sonucunu görebilirsiniz</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SubmitClaim;
