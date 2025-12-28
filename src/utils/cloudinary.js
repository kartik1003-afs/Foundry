// Backend API configuration
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

export const uploadImage = async (file, folder = 'foundry') => {
  try {
    console.log('Uploading to backend:', { fileName: file.name, folder });

    const formData = new FormData();
    formData.append('image', file);
    formData.append('folder', folder);

    const response = await fetch(`${API_BASE_URL}/api/upload/upload`, {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Backend Error Response:', errorData);
      throw new Error(errorData.error?.message || 'Upload failed');
    }

    const result = await response.json();
    console.log('Upload Success:', result);
    
    return result.data;
  } catch (error) {
    console.error('Error uploading image:', error);
    throw error;
  }
};

export const deleteImage = async (publicId) => {
  try {
    // Extract just the public ID without folder prefix
    const cleanPublicId = publicId.includes('/') ? publicId.split('/').pop() : publicId;
    const url = `${API_BASE_URL}/api/upload/delete/${cleanPublicId}`;
    
    const response = await fetch(url, {
      method: 'DELETE'
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'Delete failed');
    }

    const result = await response.json();
    return result.success;
  } catch (error) {
    console.error('Error deleting image:', error);
    throw error;
  }
};
