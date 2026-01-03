import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import ImageUpload from '../components/ImageUpload';

const Lost = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const toastShownRef = useRef(false);
  
  // Move all hooks before conditional returns
  const [formData, setFormData] = useState({
    itemType: '',
    category: '',
    description: '',
    location: '',
    dateLost: '',
    images: []
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [matches, setMatches] = useState([]);
  const [selectedMatch, setSelectedMatch] = useState(null);
  
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

  const handleChange = (e) => {
    console.log('Field changed:', e.target.name, e.target.value);
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const openMatchDetails = (match) => {
    setSelectedMatch(match);
  };

  const closeMatchDetails = () => {
    setSelectedMatch(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage('');
    setMatches([]);

    try {
      // Get the first image URL if available
      const imageUrl = formData.images && formData.images.length > 0 ? formData.images[0].url : '';
      
      const payload = {
        itemType: formData.itemType,
        category: formData.category,
        description: formData.description,
        location: formData.location,
        dateLost: formData.dateLost,
        imageUrl: imageUrl,
        contactInfo: '' // Add if you have user contact info
      };

      console.log('Submitting payload:', payload);
      console.log('Form data:', formData);
      console.log('Images in form:', formData.images);

      const response = await api.items.createLostItem(payload);
      
      console.log('API response:', response);
      
      if (response.message && response.message.includes('success')) {
        setMessage('Lost item reported successfully!');
        
        // Show matches if available
        if (response.item && response.item.matches && response.item.matches.length > 0) {
          console.log('Matches found:', response.item.matches);
          setMatches(response.item.matches);
          setMessage(`Lost item reported successfully! Found ${response.item.matches.length} potential matches.`);
        }
        
        // Don't reset form immediately - let user see the success message first
        // setFormData({
        //   itemType: '',
        //   category: '',
        //   description: '',
        //   location: '',
        //   dateLost: '',
        //   images: []
        // });
      } else {
        setMessage('Error: ' + (response.error || 'Failed to submit'));
      }
    } catch (error) {
      console.error('Submit error:', error);
      console.error('Error details:', error.response?.data || error.message);
      setMessage('Error: Failed to connect to server');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <React.Fragment>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg p-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Report a Lost Item</h1>
            <p className="text-gray-600 dark:text-gray-300 mb-8">
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

            {matches.length > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
                <h3 className="text-lg font-semibold text-blue-900 mb-4">
                  Potential Matches Found ({matches.length})
                </h3>
                <p className="text-sm text-blue-700 mb-4">
                  These found items might match what you're looking for:
                </p>
                <div className="space-y-3">
                  {matches.map((match, index) => (
                    <div key={index} className="bg-white p-4 rounded-lg border border-blue-200">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium text-gray-900">{match.itemType}</p>
                          <p className="text-sm text-gray-600">{match.description}</p>
                          <p className="text-sm text-gray-500">Location: {match.location}</p>
                          <p className="text-xs text-green-600 font-medium">FOUND ITEM</p>
                          <button
                            onClick={() => openMatchDetails(match)}
                            className="mt-2 text-xs bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
                          >
                            View Details
                          </button>
                        </div>
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                          {Math.round((match.score || 0) * 100)}% match
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="itemType" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Item Name *
                </label>
                <input
                  type="text"
                  id="itemType"
                  name="itemType"
                  value={formData.itemType}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="e.g., Blue backpack, iPhone 13, Silver watch"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="category" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Category *
                </label>
                <select
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
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
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Description *
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Describe your item in detail including color, size, brand, distinguishing features..."
                  required
                />
              </div>
              
              <ImageUpload
                onImageUpload={(images) => setFormData({ ...formData, images })}
                existingImages={formData.images}
                maxImages={1}
                label="Upload Image of Lost Item"
              />
              
              <div>
                <label htmlFor="location" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Last Seen Location *
                </label>
                <input
                  type="text"
                  id="location"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="e.g., Library 2nd floor, Student Center cafeteria, Dorm Building A"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="dateLost" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Date Lost *
                </label>
                <input
                  type="date"
                  id="dateLost"
                  name="dateLost"
                  value={formData.dateLost}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="contactInfo" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Contact Information *
                </label>
                <input
                  type="email"
                  id="contactInfo"
                  name="contactInfo"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
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
                  className="bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 px-6 py-3 rounded-lg font-medium hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
      
      {/* Match Details Modal */}
      {selectedMatch && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Found Item Details
                </h2>
                <button
                  onClick={closeMatchDetails}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                    FOUND ITEM
                  </span>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    Reported on {new Date(selectedMatch.createdAt || Date.now()).toLocaleDateString()}
                  </span>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    {selectedMatch.itemType}
                  </h3>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Description
                  </h4>
                  <p className="text-gray-600 dark:text-gray-300 text-sm">
                    {selectedMatch.description}
                  </p>
                </div>
                
                {selectedMatch.imageUrl && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Image
                    </h4>
                    <img 
                      src={selectedMatch.imageUrl} 
                      alt={selectedMatch.itemType}
                      className="w-full h-48 object-cover rounded-lg"
                    />
                  </div>
                )}
                
                <div>
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Location
                  </h4>
                  <p className="text-gray-600 dark:text-gray-300 text-sm">
                    {selectedMatch.location}
                  </p>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Match Score
                  </h4>
                  <div className="flex items-center space-x-2">
                    <span className="text-lg font-bold text-blue-600">
                      {Math.round((selectedMatch.score || 0) * 100)}%
                    </span>
                    <span className="text-sm text-gray-500">
                      similarity
                    </span>
                  </div>
                </div>
                
                {selectedMatch.contactInfo && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Contact Information
                    </h4>
                    <p className="text-gray-600 dark:text-gray-300 text-sm">
                      {selectedMatch.contactInfo}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </React.Fragment>
  );
};

export default Lost;
