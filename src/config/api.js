// API Configuration
const API_CONFIG = {
    // Remove baseUrl since we're using proxy
    endpoints: {
        // Get all sales orders
        salesOrders: '/api/v2/document/Sales Order'
    },
    
    // Function to get headers with authentication token
    getHeaders: (token) => ({
        'Authorization': `token ${token}`,
        'Content-Type': 'application/json'
    })
};

export default API_CONFIG; 