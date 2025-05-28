import axios from 'axios';
import API_CONFIG from '../config/api';

// Create axios instance without baseURL (will use relative URLs)
const api = axios.create();

// API service functions
const apiService = {
    // Get all sales orders
    async getSalesOrders(token) {
        try {
            const response = await api.get(API_CONFIG.endpoints.salesOrders, {
                headers: API_CONFIG.getHeaders(token)
            });
            return response.data.data;
        } catch (error) {
            console.error('Error fetching sales orders:', error);
            throw error;
        }
    },

    // Get items for a specific sales order
    async getSalesOrderItems(token, salesOrderName) {
        try {
            const response = await api.get(
                `${API_CONFIG.endpoints.salesOrders}/${salesOrderName}/`,
                {
                    headers: API_CONFIG.getHeaders(token)
                }
            );
            console.log(response.data.data);
            return response.data.data;
        } catch (error) {
            console.error('Error fetching sales order items:', error);
            throw error;
        }
    }
};

export default apiService;