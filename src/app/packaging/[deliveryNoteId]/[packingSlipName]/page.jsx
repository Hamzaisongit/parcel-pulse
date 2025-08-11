"use client";

import { useState, useEffect, useContext } from "react";
import { useParams } from "next/navigation";
import IntermidScanningController from '../../../../Components/IntermidScanningController';
import Link from "next/link";
// Add icons for better visual communication
import { ArrowLeft, Package, Hash, Printer } from "lucide-react";
import { mockDeliveryNotes } from '../../mockData';
import { GlobalContext } from '../../../../Context/globalContext';

export default function PackingSlipDetailPage() {
    const params = useParams();
    const deliveryNoteId = params.deliveryNoteId;
    const packingSlipName = params.packingSlipName;
    const [packingSlip, setPackingSlip] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { setLoadingController } = useContext(GlobalContext);

    // --- YOUR DATA FETCHING LOGIC (No changes needed, it's great) ---
    useEffect(() => {
        async function fetchPackingSlip() {
            try {
                setLoadingController({ show: true, text: 'Loading Packing Slip...' });

                const storedDeliveryNotes = localStorage.getItem('mockDeliveryNotes');
                let deliveryNotesData = storedDeliveryNotes ? JSON.parse(storedDeliveryNotes) : mockDeliveryNotes;
                if (!storedDeliveryNotes) {
                    localStorage.setItem('mockDeliveryNotes', JSON.stringify(mockDeliveryNotes));
                }
                const mockDeliveryNote = deliveryNotesData.find(note => note.name === deliveryNoteId);
                if (mockDeliveryNote) {
                    const mockPackingSlip = mockDeliveryNote.packing_slips.find(slip => slip.name === packingSlipName);
                    if (mockPackingSlip) {
                        setPackingSlip(mockPackingSlip);
                    } else {
                        setError('Packing slip not found');
                    }
                } else {
                    setError('Delivery note not found');
                }
            } catch (err) {
                setError('Failed to fetch packing slip. Please try again.');
            } finally {
                setLoadingController({ show: false, text: '' });
                setLoading(false);
            }
        }
        fetchPackingSlip();
    }, [packingSlipName, deliveryNoteId, setLoadingController]);


    // --- UI STATES (No changes needed) ---
    if (error) {
        return <div className="flex items-center justify-center h-screen text-red-500 p-4">{error}</div>;
    }
    if (loading || !packingSlip) {
        return <div className="flex items-center justify-center h-screen text-gray-500">Loading...</div>;
    }

    // Calculate totals for the summary card
    const totalItemsInSlip = packingSlip.items.reduce((sum, item) => sum + (item.packed_qty || 0), 0);
    const uniqueItemCount = packingSlip.items.length;

    // --- ✨ NEW & IMPROVED UI ✨ ---
    return (
        // Consistent background and padding for the sticky footer
        <div className="bg-gray-100 min-h-screen pb-24">
            <div className="max-w-3xl mx-auto p-4">
                {/* --- HEADER --- */}
                <header className="flex items-center mb-4">
                    <Link href={`/packaging/${deliveryNoteId}`} className="p-2 mr-2 rounded-full hover:bg-gray-200">
                        <ArrowLeft size={24} />
                    </Link>
                    <div>
                        <h1 className="text-xl font-bold text-gray-800">{packingSlip.name}</h1>
                        <p className="text-sm text-gray-500">
                            Created: {new Date(packingSlip.created_date).toLocaleDateString()}
                        </p>
                    </div>
                </header>

                {/* --- SUMMARY CARD --- */}
                <div className="bg-white rounded-lg shadow-sm p-4 mb-5">
                    <h2 className="text-lg font-semibold text-gray-700 mb-3">Box Summary</h2>
                    <div className="flex justify-around text-center">
                        <div>
                            <Hash className="mx-auto text-blue-600 mb-1" size={28} />
                            <p className="text-2xl font-bold text-gray-900">{uniqueItemCount}</p>
                            <p className="text-xs text-gray-500">Unique Items</p>
                        </div>
                        <div>
                            <Package className="mx-auto text-blue-600 mb-1" size={28} />
                            <p className="text-2xl font-bold text-gray-900">{totalItemsInSlip}</p>
                            <p className="text-xs text-gray-500">Total Quantity</p>
                        </div>
                    </div>
                </div>

                {/* --- ITEM LIST (Card-based) --- */}
                 <div>
                    <h2 className="text-lg font-semibold text-gray-700 mb-2 px-1">Contents</h2>
                    <div className="space-y-3">
                        {packingSlip.items.map((item, idx) => (
                            <div key={idx} className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 flex justify-between items-center">
                                <div>
                                    <p className="font-bold text-gray-800">{item.item_code}</p>
                                    <p className="text-xs text-gray-500">Barcode: {item.barcode}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-lg font-bold text-blue-700">{item.packed_qty}</p>
                                    <p className="text-sm text-gray-500">Packed</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* --- STICKY FOOTER FOR ACTIONS --- */}
            <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-3 shadow-top">
                <div className="max-w-3xl mx-auto">
                    <button
                        // This button is ready for future functionality
                        onClick={() => alert('Printing label...')}
                        className="w-full flex items-center justify-center gap-2 p-3 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 active:scale-95 transition-all"
                    >
                        <Printer size={20} />
                        Print Shipping Label
                    </button>
                </div>
            </div>
            
            <IntermidScanningController isPackaging={true} />
        </div>
    );
}