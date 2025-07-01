// API Configuration
// The ERP site base address is now managed via the ERP_SITE environment variable in .env.local
const API_CONFIG = {
    // Remove baseUrl since we're using proxy
    endpoints: {
        // Get all sales orders
        salesOrders: '/api/v2/document/Sales Order'
    },
    
    // Function to get headers with authentication token
    // getHeaders: (token) => ({
    //     'Authorization': `token ${token}`,
    //     'Content-Type': 'application/json'
    // })
};

export default API_CONFIG; 