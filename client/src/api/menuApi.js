import { api } from './client.js';

export const menuApi = {
  getCategories: () => api.get('/menu/categories'),
  getAllCategoriesAdmin: () => api.get('/menu/admin/categories'),
  createCategory: (data) => api.post('/menu/categories', data),
  
  getMenuItems: (params = {}) => {
    const query = new URLSearchParams();
    if (params.category) query.append('category', params.category);
    if (params.availableOnly) query.append('availableOnly', 'true');
    const queryString = query.toString() ? `?${query.toString()}` : '';
    return api.get(`/menu/items${queryString}`);
  },

  getMenuItem: (id) => api.get(`/menu/items/${id}`),
  createMenuItem: (data) => api.post('/menu/items', data),
  updateMenuItem: (id, data) => api.put(`/menu/items/${id}`, data),
  toggleAvailability: (id) => api.patch(`/menu/items/${id}/toggle`),
  deleteMenuItem: (id) => api.del(`/menu/items/${id}`),

  uploadImage: async (file) => {
    const formData = new FormData();
    formData.append('image', file);
    return api.post('/menu/upload-image', formData);
  },

  getStoreSettings: () => api.get('/store'),
  updateStoreSettings: (data) => api.put('/store', data),
};

