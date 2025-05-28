'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import apiService from '../../../services/api';

export default function SalesOrderDetailPage() {
    // State variables
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    // Get the sales order ID from the URL
    const params = useParams();
    const salesOrderId = params.soId;

    // Your ERPNext API token
    const token = '708ce20d2f35906:f9a7dae3b071cc1';

    // Fetch sales order items when component mounts
    useEffect(() => {
        async function fetchSalesOrderItems() {
            try {
                const orderItems = await apiService.getSalesOrderItems(token, salesOrderId);
                setItems(orderItems);
                setLoading(false);
            } catch (err) {
                setError('Failed to fetch sales order items. Please try again.');
                setLoading(false);
                console.error('Error:', err);
            }
        }

        if (salesOrderId) {
            fetchSalesOrderItems();
        }
    }, [salesOrderId]);

    // Show loading state
    if (loading) {
        return <div className="loading">Loading sales order items...</div>;
    }

    // Show error state
    if (error) {
        return <div className="error">{error}</div>;
    }

    return (
        <div>
            <div className="header">
                <h1>Sales Order Items - {salesOrderId}</h1>
            </div>

            <table>
                <thead>
                    <tr>
                        <th>Key</th>
                        <th>Item Name</th>
                        <th>Item Code</th>
                        <th>Assembled Quantity</th>
                        <th>Pending Quantity</th>
                    </tr>
                </thead>
                <tbody>
                    {items.items.map(item => (
                        <tr key={item.name}>
                            <td>{item.name}</td>
                            <td>{item.item_name}</td>
                            <td>{item.item_code || '-'}</td>
                            <td>{item.custom_quantity_assembled || 0}</td>
                            <td>{item.custom_quantity_outstanding || item.qty}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
} 