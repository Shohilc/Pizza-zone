import { api } from './client.js';

export const orderApi = {
  createOrder: (orderPayload) => api.post('/orders', orderPayload),
  getOrderById: (id) => api.get(`/orders/${id}`),
  getMyOrders: () => api.get('/orders/my-orders'),
  
  // Admin endpoints
  getAllOrdersAdmin: (params = {}) => {
    const query = new URLSearchParams();
    if (params.status) query.append('status', params.status);
    if (params.search) query.append('search', params.search);
    if (params.page) query.append('page', params.page);
    if (params.limit) query.append('limit', params.limit);
    const queryString = query.toString() ? `?${query.toString()}` : '';
    return api.get(`/orders/admin/all${queryString}`);
  },

  getOrderStatsAdmin: () => api.get('/orders/admin/stats'),
  updateOrderStatus: (id, status, note = '') => api.patch(`/orders/${id}/status`, { status, note }),
  cancelOrder: (id, cancelReason, cancelNote = '') => api.post(`/orders/${id}/cancel`, { cancelReason, cancelNote }),
};

