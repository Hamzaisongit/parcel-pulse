'use client';

import { useState, useEffect, useContext } from 'react';
import { useRouter } from 'next/navigation';
import { GlobalContext } from '../../Context/globalContext';

export default function AssemblyPage() {
    // State variables
    const [salesOrders, setSalesOrders] = useState([]);
    // const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const router = useRouter();

    const { setLoadingController } = useContext(GlobalContext)

    // Your ERPNext API token
    // const token = '708ce20d2f35906:f9a7dae3b071cc1';

    // Fetch sales orders when component mounts
    useEffect(() => {
        async function fetchSalesOrders() {
            try {
                setLoadingController({ show: true, text: 'Loading Sales Orders..' })
                const response = await fetch('/api/sales-orders', {
                    credentials: 'include',
                    headers: {
                        'Accept': 'application/json',
                    },
                });
                console.log(response)
                if (!response.ok) {
                    throw new Error('Failed to fetch sales orders');
                }
                const data = await response.json();
                setSalesOrders(data.data);
                setLoadingController({ show: false, text: 'Loading Sales Orders..' })
            } catch (err) {
                setError('Failed to fetch sales orders. Please try again.');
                setLoadingController({ show: false, text: 'Loading Sales Orders..' })
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
    // if (loading) {
    //     return <div className="flex items-center justify-center min-h-screen text-lg text-gray-600">Loading sales orders...</div>;
    // }

    // Show error state
    if (error) {
        return <div className="flex items-center justify-center min-h-screen text-red-600 bg-red-50 p-4 rounded-lg">{error}</div>;
    }

    return (
        <div className="min-h-[100dvh] bg-gray-50 px-4 sm:px-6 lg:px-8 flex flex-col">
            {/* Header */}
            <div className="max-w-3xl mx-auto text-center pt-8 pb-4">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Assembly Section</h1>
                <p className="text-lg text-gray-600">Select a Sales Order to view its items</p>
            </div>

            {/* Spacer to push select into center */}
            <div className="py-5 flex-grow flex flex-col items-center">
                
                    <select
                        onChange={handleSalesOrderChange}
                        defaultValue=""
                        className="block h-13 w-xs px-4 py-3 mt-5 text-xl border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900"
                    >
                        <option value="" disabled className="text-gray-500">Select a Sales Order</option>
                        {salesOrders.map(order => (
                            <option key={order.name} value={order.name} className="py-2">
                                {order.name}
                            </option>
                        ))}
                    </select>

            </div>
        </div>

    );
}