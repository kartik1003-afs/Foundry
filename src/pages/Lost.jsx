import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const Lost = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const toastShownRef = useRef(false);
  
  useEffect(() => {
    if (!isAuthenticated && !toastShownRef.current) {
      toast.warning('Please login first to report a lost item');
      toastShownRef.current = true;
      navigate('/auth');
    }
  }, [isAuthenticated, navigate]);

  if (!isAuthenticated) {
    return null;
  }

  const [formData, setFormData] = useState({
    itemType: '',
    description: '',
    location: '',
    dateLost: '',
    imageUrl: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage('');

    try {
      const response = await api.items.createLostItem(formData);
      
      if (response.itemId) {
        setMessage('Lost item reported successfully! We\'ll help you find it.');
        setFormData({
          itemType: '',
          description: '',
          location: '',
          dateLost: '',
          imageUrl: ''
        });
      } else {
        setMessage('Error: ' + (response.error || 'Failed to submit'));
      }
    } catch (error) {
      setMessage('Error: Failed to connect to server');
    } finally {
      setIsSubmitting(false);
    }
  };
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow-sm rounded-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Report a Lost Item</h1>
          <p className="text-gray-600 mb-8">
            Help us help you find your lost item by providing as much detail as possible.
          </p>
          
          {message && (
            <div className={`p-4 rounded-lg mb-6 ${
              message.includes('Error') 
                ? 'bg-red-100 text-red-700 border border-red-200' 
                : 'bg-green-100 text-green-700 border border-green-200'
            }`}>
              {message}
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="itemName" className="block text-sm font-medium text-gray-700 mb-2">
                Item Name *
              </label>
              <input
                type="text"
                id="itemType"
                name="itemType"
                value={formData.itemType}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g., Blue backpack, iPhone 13, Silver watch"
                required
              />
            </div>
            
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
                Category *
              </label>
              <select
                id="category"
                name="category"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select a category</option>
                <option value="electronics">Electronics</option>
                <option value="clothing">Clothing</option>
                <option value="accessories">Accessories</option>
                <option value="books">Books</option>
                <option value="documents">Documents</option>
                <option value="keys">Keys</option>
                <option value="wallet">Wallet/Purse</option>
                <option value="other">Other</option>
              </select>
            </div>
            
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                Description *
              </label>
              <textarea
                id="description"
                name="description"
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Describe your item in detail including color, size, brand, distinguishing features..."
              />
            </div>
            
            <div>
              <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">
                Last Seen Location *
              </label>
              <input
                type="text"
                id="location"
                name="location"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g., Library 2nd floor, Student Center cafeteria, Dorm Building A"
              />
            </div>
            
            <div>
              <label htmlFor="dateLost" className="block text-sm font-medium text-gray-700 mb-2">
                Date Lost *
              </label>
              <input
                type="date"
                id="dateLost"
                name="dateLost"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div>
              <label htmlFor="contactInfo" className="block text-sm font-medium text-gray-700 mb-2">
                Contact Information *
              </label>
              <input
                type="email"
                id="contactInfo"
                name="contactInfo"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="your.email@university.edu"
              />
            </div>
            
            <div className="flex gap-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Lost Item Report'}
              </button>
              <button
                type="button"
                className="bg-gray-200 text-gray-800 px-6 py-3 rounded-lg font-medium hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Lost;
