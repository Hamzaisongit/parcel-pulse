'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import apiService from '../../services/api';

export default function AssemblyPage() {
    // State variables
    const [salesOrders, setSalesOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const router = useRouter();

    // Your ERPNext API token
    const token = '708ce20d2f35906:f9a7dae3b071cc1';

    // Fetch sales orders when component mounts
    useEffect(() => {
        async function fetchSalesOrders() {
            try {
                const orders = await apiService.getSalesOrders(token);
                setSalesOrders(orders);
                setLoading(false);
            } catch (err) {
                setError('Failed to fetch sales orders. Please try again.');
                setLoading(false);
                console.error('Error:', err);
            }
        }

        fetchSalesOrders();
    }, []);

    // Handle sales order selection
    function handleSalesOrderChange(event) {
        const selectedOrder = event.target.value;
        if (selectedOrder) {
            // Navigate to the selected sales order page
            router.push(`/assembly/${selectedOrder}`);
        }
    }

    // Show loading state
    if (loading) {
        return <div className="loading">Loading sales orders...</div>;
    }

    // Show error state
    if (error) {
        return <div className="error">{error}</div>;
    }

    return (
        <div>
            <div className="header">
                <h1>Assembly Section</h1>
                <p>Select a Sales Order to view its items</p>
            </div>

            <div className="select-container">
                <select 
                    onChange={handleSalesOrderChange}
                    defaultValue=""
                >
                    <option value="" disabled>Select a Sales Order</option>
                    {salesOrders.map(order => (
                        <option key={order.name} value={order.name}>
                            {order.name} - {order.customer} ({order.transaction_date})
                        </option>
                    ))}
                </select>
            </div>
        </div>
    );
} 