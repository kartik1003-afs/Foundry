import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../contexts/AuthContext';
import ImageUpload from '../components/ImageUpload';

const Found = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const toastShownRef = useRef(false);
  
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
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Report a Found Item</h1>
          <p className="text-gray-600 dark:text-gray-300 mb-8">
            Thank you for helping others! Please provide details about the item you found.
          </p>
          
          <form className="space-y-6">
            <div>
              <label htmlFor="itemName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Item Name *
              </label>
              <input
                type="text"
                id="itemName"
                name="itemName"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="e.g., Blue backpack, iPhone 13, Silver watch"
              />
            </div>
            
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Category *
              </label>
              <select
                id="category"
                name="category"
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
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="Describe the item in detail including color, size, brand, distinguishing features..."
              />
            </div>
            
            <ImageUpload
              onImageUpload={(images) => {
                // Handle image upload for found items
                console.log('Found item images:', images);
              }}
              existingImages={[]}
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
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="e.g., Library 2nd floor, Student Center cafeteria, Dorm Building A"
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
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
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
                Your Contact Information *
              </label>
              <input
                type="email"
                id="contactInfo"
                name="contactInfo"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="your.email@university.edu"
              />
            </div>
            
            <div className="flex gap-4">
              <button
                type="submit"
                className="bg-green-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-green-700 transition-colors"
              >
                Submit Found Item Report
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
