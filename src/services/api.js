const API_BASE_URL = 'http://localhost:3001/api';

// API service for Foundry backend
const api = {
  // Health check
  async healthCheck() {
    const response = await fetch('http://localhost:5000/health');
    return response.json();
  },

  // Authentication endpoints
  auth: {
    async createUser(userData) {
      const response = await fetch(`${API_BASE_URL}/auth/create-user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });
      return response.json();
    },

    async getUser(uid) {
      const response = await fetch(`${API_BASE_URL}/auth/user/${uid}`);
      return response.json();
    },
  },

  // Lost and Found items endpoints
  items: {
    async createLostItem(itemData) {
      const response = await fetch(`${API_BASE_URL}/items/lost`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(itemData),
      });
      return response.json();
    },

    async createFoundItem(itemData) {
      const response = await fetch(`${API_BASE_URL}/items/found`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(itemData),
      });
      return response.json();
    },

    async getDiscoverItems(filters = {}) {
      const queryParams = new URLSearchParams(filters);
      const url = `${API_BASE_URL}/items/discover?${queryParams}`;
      console.log('Making API call to:', url);
      const response = await fetch(url);
      console.log('API response status:', response.status);
      const data = await response.json();
      console.log('API response data:', data);
      return data;
    },

    async getUserLostItems(email) {
      const response = await fetch(`${API_BASE_URL}/items/user/${email}`);
      return response.json();
    },

    async getUserFoundItems(email) {
      const response = await fetch(`${API_BASE_URL}/items/user/${email}`);
      return response.json();
    },
  },
};

export default api;
