'use client';

import { useState, useEffect, useContext } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { GlobalContext } from '../../../Context/globalContext';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { mockDeliveryNotes, calculatePackedQuantity, getRemainingQuantity } from '../mockData';

export default function DeliveryNotePackagingPage() {
    const [deliveryNote, setDeliveryNote] = useState(null);
    const [packingSlips, setPackingSlips] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const params = useParams();
    const deliveryNoteId = params.deliveryNoteId;
    const router = useRouter();
    const { setLoadingController } = useContext(GlobalContext);

    useEffect(() => {
        async function fetchDeliveryNote() {
            try {
                setLoadingController({ show: true, text: 'Loading Delivery Note..' })
                
                // Commented out API fetching for demo
                // const response = await fetch(`/api/packing-slips?delivery_note=${deliveryNoteId}`);
                // if (!response.ok) {
                //     throw new Error('Failed to fetch packing slips');
                // }
                // const data = await response.json();
                // setPackingSlips(data.data);
                
                // Using mock data with localStorage for persistence
                const storedDeliveryNotes = localStorage.getItem('mockDeliveryNotes');
                let deliveryNotesData;
                
                if (storedDeliveryNotes) {
                    deliveryNotesData = JSON.parse(storedDeliveryNotes);
                } else {
                    // Initialize localStorage if it doesn't exist
                    localStorage.setItem('mockDeliveryNotes', JSON.stringify(mockDeliveryNotes));
                    deliveryNotesData = mockDeliveryNotes;
                }
                
                const mockDeliveryNote = deliveryNotesData.find(note => note.name === deliveryNoteId);
                if (mockDeliveryNote) {
                    const updatedNote = calculatePackedQuantity(mockDeliveryNote);
                    setDeliveryNote(updatedNote);
                    setPackingSlips(updatedNote.packing_slips);
                } else {
                    setError('Delivery note not found');
                }
            } catch (err) {
                setError('Failed to fetch delivery note. Please try again.');
            } finally {
                setLoadingController({ show: false, text: 'Loading Delivery Note..' })
                setLoading(false);
            }
        }
        fetchDeliveryNote();
    }, [deliveryNoteId, setLoadingController]);

    // Create new packing slip
    function createNewPackingSlip() {
        router.push(`/packaging/${deliveryNoteId}/new`);
    }

    if (error) {
        return <div className="flex items-center justify-center min-h-screen text-red-600 bg-red-50 p-4 rounded-lg">{error}</div>;
    }
    if (loading) {
        return <div className="flex items-center justify-center min-h-screen text-gray-600">Loading delivery note...</div>;
    }

    return (
        <div className="max-w-6xl mx-auto px-4 py-8">
            <Link href="/packaging"><ArrowLeft size={30} className='mb-2 rounded-md active:bg-gray-300'></ArrowLeft></Link>
            <h1 className="text-2xl font-bold mb-4">Delivery Note: {deliveryNoteId}</h1>
            <p className="text-gray-600 mb-6">Customer: {deliveryNote.customer}</p>
            
            {/* Items Overview */}
            <div className="bg-white p-6 rounded-lg shadow-md mb-6">
                <h2 className="text-xl font-semibold mb-4">Items Overview</h2>
                <table className="w-full border-collapse">
                    <thead>
                        <tr className="bg-gray-50">
                            <th className="px-4 py-3 text-left border-b">Item Code</th>
                            <th className="px-4 py-3 text-left border-b">Packed Quantity</th>
                            <th className="px-4 py-3 text-left border-b">Total Required</th>
                            <th className="px-4 py-3 text-left border-b">Remaining</th>
                            <th className="px-4 py-3 text-left border-b">Barcode</th>
                        </tr>
                    </thead>
                    <tbody>
                        {deliveryNote.items.map(item => (
                            <tr key={item.item_name} className={`${item.packed_qty >= item.total_req_qty ? 'bg-green-100' : ''}`}>
                                <td className="px-4 py-3 border-b">{item.item_code}</td>
                                <td className="px-4 py-3 border-b">{item.packed_qty}</td>
                                <td className="px-4 py-3 border-b">{item.total_req_qty}</td>
                                <td className="px-4 py-3 border-b">{getRemainingQuantity(item)}</td>
                                <td className="px-4 py-3 border-b">{item.barcode}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Packing Slips */}
            <div className="bg-white p-6 rounded-lg shadow-md mb-6">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold">Packing Slips</h2>
                    <button
                        onClick={createNewPackingSlip}
                        className="px-4 py-2 bg-blue-500 text-white font-medium rounded-lg hover:bg-blue-600 transition-colors"
                    >
                        Create New Packing Slip
                    </button>
                </div>
                
                {packingSlips.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">No packing slips created yet. Click "Create New Packing Slip" to get started.</p>
                ) : (
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="bg-gray-50">
                                <th className="px-4 py-3 text-left border-b">Packing Slip Name</th>
                                <th className="px-4 py-3 text-left border-b">Items Count</th>
                                <th className="px-4 py-3 text-left border-b">Total Packed</th>
                                <th className="px-4 py-3 text-left border-b">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {packingSlips.map(slip => (
                                <tr key={slip.name} className="hover:bg-gray-100">
                                    <td className="px-4 py-3 border-b">
                                        <Link href={`/packaging/${deliveryNoteId}/${slip.name}`} className="text-blue-600 hover:underline">
                                            {slip.name}
                                        </Link>
                                    </td>
                                    <td className="px-4 py-3 border-b">{slip.items?.length || 0}</td>
                                    <td className="px-4 py-3 border-b">
                                        {slip.items?.reduce((total, item) => total + (item.packed_qty || 0), 0) || 0}
                                    </td>
                                    <td className="px-4 py-3 border-b">
                                        <Link 
                                            href={`/packaging/${deliveryNoteId}/${slip.name}`}
                                            className="text-blue-600 hover:underline"
                                        >
                                            View Details
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}
