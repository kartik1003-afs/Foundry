import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const Discover = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const toastShownRef = useRef(false);

  // Move all hooks before conditional returns
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [availableCategories, setAvailableCategories] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [filters, setFilters] = useState({
    search: '',
    itemType: '',
    status: 'all',
    dateRange: '',
    sortBy: 'newest'
  });
  const [tempFilters, setTempFilters] = useState({ ...filters });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15; // 5 rows × 3 items per row = 15 items per page

  useEffect(() => {
    if (!isAuthenticated && !toastShownRef.current) {
      toast.warning('Please login first to discover items');
      toastShownRef.current = true;
      navigate('/auth');
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    if (isAuthenticated) {
      setLoading(true);
      fetchItems();
    }
  }, [filters, isAuthenticated]);

  useEffect(() => {
    // Reset to page 1 when filters change
    setCurrentPage(1);
  }, [filters]);

  useEffect(() => {
    // Initial load
    if (isAuthenticated) {
      setLoading(true);
      fetchItems();
    }
  }, [isAuthenticated]);

  const fetchItems = async () => {
    try {
      const response = await api.items.getDiscoverItems({});
      
      // Set available categories from database
      const categories = [...new Set(response.items.map(item => item.itemType))];
      setAvailableCategories(categories);
      
      // Apply client-side filtering as workaround
      let filteredItems = response.items || [];
      
      // Apply status filter
      if (filters.status && filters.status !== 'all') {
        filteredItems = filteredItems.filter(item => item.reportType === filters.status);
      }
      
      // Apply itemType filter using category field (new items) and itemType mapping (existing items)
      if (filters.itemType) {
        
        // First, filter by category field (for properly categorized new items)
        let categoryFiltered = filteredItems.filter(item => item.category === filters.itemType);
        
        // Then, filter existing items by mapping itemType to categories
        const categoryMapping = {
          'accessories': ['bottle', 'bottles', 'watch', 'jewelry', 'belt', 'bag', 'sunglasses'],
          'books': ['pen', 'book', 'notebook', 'textbook', 'journal'],
          'documents': ['test', 'id', 'passport', 'license', 'certificate', 'paper'],
          'electronics': ['phone', 'laptop', 'tablet', 'headphones', 'charger', 'cable'],
          'clothing': ['shirt', 'pants', 'jacket', 'dress', 'shoes', 'hat'],
          'keys': ['key', 'keychain', 'car key'],
          'wallet': ['wallet', 'purse', 'money', 'card'],
          'other': ['condom'] // items that don't fit other categories
        };
        
        const keywords = categoryMapping[filters.itemType] || [];
        let itemTypeFiltered = filteredItems.filter(item => 
          !item.category && keywords.some(keyword => item.itemType.toLowerCase().includes(keyword))
        );
        
        // Combine both results
        filteredItems = [...categoryFiltered, ...itemTypeFiltered];
      }
      
      // Apply search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        filteredItems = filteredItems.filter(item => 
          item.itemType?.toLowerCase().includes(searchLower) ||
          item.description?.toLowerCase().includes(searchLower) ||
          item.location?.toLowerCase().includes(searchLower)
        );
      }
      
      // Apply date range filter
      if (filters.dateRange) {
        const now = new Date();
        const cutoffDate = new Date();
        
        switch (filters.dateRange) {
          case 'today':
            cutoffDate.setHours(0, 0, 0, 0);
            break;
          case 'week':
            cutoffDate.setDate(now.getDate() - 7);
            break;
          case 'month':
            cutoffDate.setMonth(now.getMonth() - 1);
            break;
          case 'three-months':
            cutoffDate.setMonth(now.getMonth() - 3);
            break;
          default:
            break;
        }
        
        filteredItems = filteredItems.filter(item => {
          const itemDate = new Date(item.createdAt);
          return itemDate >= cutoffDate;
        });
      }
      
      // Apply sorting
      filteredItems.sort((a, b) => {
        const dateA = new Date(a.createdAt || 0);
        const dateB = new Date(b.createdAt || 0);
        
        switch (filters.sortBy) {
          case 'oldest':
            return dateA - dateB;
          case 'newest':
          default:
            return dateB - dateA;
        }
      });
      
      setItems(filteredItems);
      
      // Reset to page 1 when filters change
      setCurrentPage(1);
    } catch (error) {
      console.error('Failed to fetch items:', error);
      toast.error('Failed to fetch items');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setTempFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSearchChange = (e) => {
    setTempFilters(prev => ({
      ...prev,
      search: e.target.value
    }));
  };

  const handleViewDetails = (item) => {
    setSelectedItem(item);
    setShowModal(true);
  };

  const handleContactFinder = () => {
    if (selectedItem && selectedItem.contactInfo) {
      const subject = encodeURIComponent(`Found Item: ${selectedItem.itemType}`);
      
      let emailBody = `Hi,\n\nI'm interested in your found item: ${selectedItem.itemType}.\n\n` +
        `Location: ${selectedItem.location}\n` +
        `Date: ${new Date(selectedItem.dateFound).toLocaleDateString()}\n`;
      
      // Add image information if available
      if (selectedItem.imageUrl) {
        emailBody += `Image: ${selectedItem.imageUrl}\n`;
      }
      
      emailBody += `\nPlease let me know if this is still available.\n\nThank you!`;
      
      const body = encodeURIComponent(emailBody);
      
      // Use shorter Gmail URL format
      const gmailUrl = `https://mail.google.com/mail/?view=cm&to=${encodeURIComponent(selectedItem.contactInfo)}&su=${subject}&body=${body}`;
      window.open(gmailUrl, '_blank');
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedItem(null);
  };

  const applyFilters = () => {
    setFilters({ ...tempFilters });
  };

  const resetFilters = () => {
    const defaultFilters = {
      search: '',
      itemType: '',
      status: 'all',
      dateRange: '',
      sortBy: 'newest'
    };
    setTempFilters(defaultFilters);
    setFilters(defaultFilters);
  };

  // Early return after all hooks
  if (!isAuthenticated) {
    return null;
  }
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Discover Items</h1>
          <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Browse through lost and found items. Use filters to narrow down your search and find what you're looking for.
          </p>
        </div>
        
        <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label htmlFor="search" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Search
              </label>
              <input
                type="text"
                id="search"
                name="search"
                value={tempFilters.search}
                onChange={handleSearchChange}
                placeholder="Search items..."
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
            
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Category
              </label>
              <select
                id="category"
                name="itemType"
                value={tempFilters.itemType}
                onChange={handleFilterChange}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="">All Categories</option>
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
              <label htmlFor="status" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Status
              </label>
              <select
                id="status"
                name="status"
                value={tempFilters.status}
                onChange={handleFilterChange}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="all">All Items</option>
                <option value="lost">Lost Items</option>
                <option value="found">Found Items</option>
              </select>
            </div>
            
            <div>
              <label htmlFor="dateRange" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Date Range
              </label>
              <select
                id="dateRange"
                name="dateRange"
                value={tempFilters.dateRange}
                onChange={handleFilterChange}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="">Any Time</option>
                <option value="today">Today</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
                <option value="three-months">Last 3 Months</option>
              </select>
            </div>
          </div>
          
          <div className="mt-6 flex justify-between items-center">
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Showing <span className="font-medium">{items.length}</span> items
            </p>
            <div className="flex gap-2">
              <select
                name="sortBy"
                value={tempFilters.sortBy}
                onChange={handleFilterChange}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="relevance">Most Relevant</option>
              </select>
              <button 
                onClick={resetFilters}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600"
              >
                Reset
              </button>
              <button 
                onClick={applyFilters}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
        
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-300">Loading items...</p>
          </div>
        ) : (
          <>
            {/* Pagination calculation - only affects display, not filtering */}
            {(() => {
              const totalPages = Math.ceil(items.length / itemsPerPage);
              const startIndex = (currentPage - 1) * itemsPerPage;
              const endIndex = startIndex + itemsPerPage;
              const currentItems = items.slice(startIndex, endIndex);
              
              return (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {currentItems.map((item) => (
                <div key={item._id || item.id} className="bg-white dark:bg-gray-800 shadow-sm rounded-lg p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      item.reportType === 'lost' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                    }`}>
                      {item.reportType === 'lost' ? 'Lost' : 'Found'}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {new Date(item.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    {item.itemType}
                  </h3>
                  
                  <p className="text-gray-600 dark:text-gray-300 text-sm mb-4">
                    {item.description}
                  </p>
                  
                  <div className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                    <p className="flex items-center mb-1">
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      {item.location}
                    </p>
                    <p className="flex items-center">
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {new Date(item.dateLost || item.dateFound || item.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  
                  <button 
                    onClick={() => handleViewDetails(item)}
                    className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                  >
                    View Details
                  </button>
                </div>
              ))}
            </div>
                  
                  {/* Pagination Controls */}
                  {totalPages > 1 && (
                    <div className="mt-8 flex justify-center items-center space-x-4">
                      <button
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        disabled={currentPage === 1}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                          currentPage === 1
                            ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                            : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600'
                        }`}
                      >
                        Previous
                      </button>
                      
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        Page {currentPage} of {totalPages}
                      </span>
                      
                      <button
                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                        disabled={currentPage === totalPages}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                          currentPage === totalPages
                            ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                            : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600'
                        }`}
                      >
                        Next
                      </button>
                    </div>
                  )}
                  
                  {items.length === 0 && (
                    <div className="text-center py-12">
                      <p className="text-gray-600 dark:text-gray-300">No items found matching your criteria.</p>
                    </div>
                  )}
                </>
              );
            })()}
          </>
        )}
        
        {/* Item Details Modal */}
        {showModal && selectedItem && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Item Details
                  </h2>
                  <button
                    onClick={closeModal}
                    className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                
                <div className="space-y-4">
                  {/* Status Badge */}
                  <div className="flex items-center space-x-2">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                      selectedItem.reportType === 'lost' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                    }`}>
                      {selectedItem.reportType === 'lost' ? 'Lost Item' : 'Found Item'}
                    </span>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      Reported on {new Date(selectedItem.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  {/* Image */}
                  {selectedItem.imageUrl && (
                    <div className="w-full">
                      <img 
                        src={selectedItem.imageUrl} 
                        alt={selectedItem.itemType}
                        className="w-full rounded-lg object-contain max-h-96"
                        style={{ maxHeight: '24rem' }}
                      />
                    </div>
                  )}

                  {/* Item Information */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Item Type</h3>
                      <p className="text-lg font-medium text-gray-900 dark:text-white">{selectedItem.itemType}</p>
                    </div>
                    
                    {selectedItem.category && (
                      <div>
                        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Category</h3>
                        <p className="text-lg font-medium text-gray-900 dark:text-white capitalize">{selectedItem.category}</p>
                      </div>
                    )}
                    
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Location</h3>
                      <p className="text-lg font-medium text-gray-900 dark:text-white">{selectedItem.location}</p>
                    </div>
                    
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Date</h3>
                      <p className="text-lg font-medium text-gray-900 dark:text-white">
                        {new Date(selectedItem.dateLost || selectedItem.dateFound).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Description</h3>
                    <p className="text-gray-900 dark:text-white">{selectedItem.description}</p>
                  </div>

                  {/* Reporter Information */}
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Reporter Information</h3>
                    <div className="space-y-2">
                      {selectedItem.reporterName && (
                        <div className="flex items-center space-x-2">
                          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h4a7 7 0 007 7v2a7 7 0 01-7 7h-4a7 7 0 01-7-7v-2z" />
                          </svg>
                          <span className="text-gray-900 dark:text-white font-medium">{selectedItem.reporterName}</span>
                        </div>
                      )}
                      <div className="flex items-center space-x-2">
                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        <span className="text-gray-900 dark:text-white">{selectedItem.contactInfo}</span>
                      </div>
                      {selectedItem.contactNumber && selectedItem.contactNumber !== '00000' && (
                        <div className="flex items-center space-x-2">
                          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 16l4-4 4 4" />
                          </svg>
                          <span className="text-gray-900 dark:text-white">{selectedItem.contactNumber}</span>
                        </div>
                      )}
                      {selectedItem.contactNumber === '00000' && (
                        <div className="flex items-center space-x-2">
                          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 16l4-4 4 4" />
                          </svg>
                          <span className="text-gray-500 dark:text-gray-400 italic">Contact number not available</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Additional Details */}
                  <div className="border-t pt-4">
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Additional Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-gray-500 dark:text-gray-400">Status:</span>
                        <span className="ml-2 text-gray-900 dark:text-white capitalize">{selectedItem.status}</span>
                      </div>
                      <div>
                        <span className="text-gray-500 dark:text-gray-400">Item ID:</span>
                        <span className="ml-2 text-gray-900 dark:text-white">{selectedItem._id || selectedItem.id}</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="mt-6 flex justify-end space-x-3">
                  <button
                    onClick={closeModal}
                    className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  >
                    Close
                  </button>
                  {selectedItem.reportType === 'found' && selectedItem.contactInfo && (
                    <button
                      onClick={handleContactFinder}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Contact Finder
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Discover;
