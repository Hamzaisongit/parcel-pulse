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

    // Get specific sales order with its items
    async getSalesOrder(token, salesOrderName) {
        try {
            const response = await api.get(
                `${API_CONFIG.endpoints.salesOrders}/${salesOrderName}`,
                {
                    headers: API_CONFIG.getHeaders(token)
                }
            );
            // Return the sales order document which includes the items array
            return response.data.data;
        } catch (error) {
            console.error('Error fetching sales order:', error);
            throw error;
        }
    },

    // Update sales order item assembly quantity
    async updateAssemblyQuantity(token, salesOrder, itemName, assembledQuantity) {
        try {
            const updatedItems = salesOrder.items.map((i)=>{
                if(i.name == itemName){
                    return {
                        ...i,
                        custom_quantity_assembled: assembledQuantity
                    }
                }
                
                return i;
            })

            const response = await api.put(
                `${API_CONFIG.endpoints.salesOrders}/${salesOrder.name}`,
                {
                    items: updatedItems
                },
                {
                    headers: API_CONFIG.getHeaders(token)
                }
            );
            return response.data;
        } catch (error) {
            console.error('Error updating assembly quantity:', error);
            throw error;
        }
    }
};

export default apiService;