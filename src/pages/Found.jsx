import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../contexts/AuthContext';
import ImageUpload from '../components/ImageUpload';
import api from '../services/api';

const Found = () => {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const toastShownRef = useRef(false);
  
  const [formData, setFormData] = useState({
    itemType: '',
    category: '',
    description: '',
    location: '',
    dateFound: '',
    contactInfo: '',
    contactNumber: '',
    images: []
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  
  useEffect(() => {
    if (!isAuthenticated && !toastShownRef.current) {
      toast.warning('Please login first to report a found item');
      toastShownRef.current = true;
      navigate('/auth');
    }
  }, [isAuthenticated, navigate]);

  if (!isAuthenticated) {
    return null;
  }

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('Form submitted!');
    setIsSubmitting(true);
    setMessage('');

    try {
      // Get the first image URL if available
      const imageUrl = formData.images && formData.images.length > 0 ? formData.images[0].url : '';
      
      const payload = {
        itemType: formData.itemType,
        category: formData.category,
        description: formData.description,
        location: formData.location,
        dateFound: formData.dateFound,
        imageUrl: imageUrl,
        contactInfo: user.email, // Use authenticated user's email
        contactNumber: formData.contactNumber, // Add contact number
        reporterName: user.name, // Add reporter name
        userEmail: user.email // Add userEmail for backend
      };

      console.log('Submitting found item payload:', payload);
      console.log('Form data:', formData);

      const response = await api.items.createFoundItem(payload);
      
      console.log('API response:', response);
      
      if (response.item) {
        setMessage('Found item reported successfully! Thank you for helping others find their lost items.');
        
        setFormData({
          itemType: '',
          category: '',
          description: '',
          location: '',
          dateFound: '',
          contactInfo: '',
          contactNumber: '',
          images: []
        });
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Report a Found Item</h1>
          <p className="text-gray-600 dark:text-gray-300 mb-8">
            Thank you for helping others! Please provide details about the item you found.
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
              <label htmlFor="itemName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Item Name *
              </label>
              <input
                type="text"
                id="itemName"
                name="itemType"
                value={formData.itemType}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
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
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
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
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="Describe the item in detail including color, size, brand, distinguishing features..."
                required
              />
            </div>
            
            <ImageUpload
              onImageUpload={(images) => setFormData({...formData, images})}
              existingImages={formData.images}
              maxImages={1}
              label="Upload Image of Found Item"
            />
            
            <div>
              <label htmlFor="location" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Found Location *
              </label>
              <input
                type="text"
                id="location"
                name="location"
                value={formData.location}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="e.g., Library 2nd floor, Student Center cafeteria, Dorm Building A"
                required
              />
            </div>
            
            <div>
              <label htmlFor="dateFound" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Date Found *
              </label>
              <input
                type="date"
                id="dateFound"
                name="dateFound"
                value={formData.dateFound}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                required
              />
            </div>
            
            <div>
              <label htmlFor="storageLocation" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Where is the item being stored? *
              </label>
              <input
                type="text"
                id="storageLocation"
                name="storageLocation"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="e.g., Campus Security Office, My dorm room, With professor Smith"
              />
            </div>
            
            <div>
              <label htmlFor="contactInfo" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Email Address *
              </label>
              <input
                type="email"
                id="contactInfo"
                name="contactInfo"
                value={user.email}
                readOnly
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="your.email@university.edu"
              />
            </div>
            
            <div>
              <label htmlFor="contactNumber" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Contact Number *
              </label>
              <input
                type="tel"
                id="contactNumber"
                name="contactNumber"
                value={formData.contactNumber}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="Your phone number"
                required
              />
            </div>
            
            <div className="flex gap-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className="bg-green-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Found Item Report'}
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
  );
};

export default Found;
