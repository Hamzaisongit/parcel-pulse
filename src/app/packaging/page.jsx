'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AssemblyPage() {
    // State variables
    const [salesOrders, setSalesOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const router = useRouter();

    // Fetch sales orders when component mounts
    useEffect(() => {
        async function fetchSalesOrders() {
            try {
                const response = await fetch('/api/sales-orders', {
                    credentials: 'include',
                    headers: {
                        'Accept': 'application/json',
                    },
                });
                if (!response.ok) {
                    throw new Error('Failed to fetch sales orders');
                }
                const data = await response.json();
                setSalesOrders(data.data);
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
            router.push(`/packaging/${selectedOrder}`);
        }
    }

    // Show loading state
    if (loading) {
        return <div className="flex items-center justify-center min-h-screen text-lg text-gray-600">Loading sales orders...</div>;
    }

    // Show error state
    if (error) {
        return <div className="flex items-center justify-center min-h-screen text-red-600 bg-red-50 p-4 rounded-lg">{error}</div>;
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto text-center mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Assembly Section</h1>
                <p className="text-lg text-gray-600">Select a Sales Order to view its items</p>
            </div>

            <div className="max-w-xl mx-auto">
                <select 
                    onChange={handleSalesOrderChange}
                    defaultValue=""
                    className="block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900"
                >
                    <option value="" disabled className="text-gray-500">Select a Sales Order</option>
                    {salesOrders.map(order => (
                        <option key={order.name} value={order.name} className="py-2">
                            {order.name} - {order.customer} ({order.transaction_date})
                        </option>
                    ))}
                </select>
            </div>
        </div>
    );
}