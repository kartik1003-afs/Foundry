const axios = require('axios');

class AIService {
  constructor() {
    this.fastApiUrl = process.env.FASTAPI_URL || 'http://localhost:8000';
  }

  async reportItem(itemData) {
    try {
      const FormData = require('form-data');
      const formData = new FormData();
      
      formData.append('image_url', itemData.imageUrl || '');
      formData.append('description', itemData.description || '');
      formData.append('location', itemData.location || '');
      formData.append('category', itemData.category || 'general');
      formData.append('report_type', itemData.reportType || '');

      const response = await axios.post(`${this.fastApiUrl}/report`, formData, {
        headers: {
          ...formData.getHeaders(),
        },
      });

      // Extract embedding from response if available for future matching
      if (response.data.embedding) {
        response.data.embedding = response.data.embedding;
      }

      return response.data;
    } catch (error) {
      console.error('Error reporting item to AI service:', error.response?.data || error.message);
      throw error;
    }
  }

  async getSimilarItems(embedding, topK = 5) {
    try {
      const response = await axios.post(`${this.fastApiUrl}/find-similar`, {
        embedding,
        top_k: topK
      });
      return response.data.matches || [];
    } catch (error) {
      console.error('Error finding similar items:', error);
      return [];
    }
  }
}

module.exports = new AIService();
