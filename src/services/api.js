const API_BASE_URL = 'http://localhost:5000/api';

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
      const response = await fetch(`${API_BASE_URL}/items/discover?${queryParams}`);
      return response.json();
    },

    async getUserLostItems(uid) {
      const response = await fetch(`${API_BASE_URL}/items/lost/user/${uid}`);
      return response.json();
    },

    async getUserFoundItems(uid) {
      const response = await fetch(`${API_BASE_URL}/items/found/user/${uid}`);
      return response.json();
    },
  },
};

export default api;
