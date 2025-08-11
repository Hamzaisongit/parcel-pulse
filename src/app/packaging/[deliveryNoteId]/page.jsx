'use client';

import { useState, useEffect, useContext } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { GlobalContext } from '../../../Context/globalContext';
import Link from 'next/link';
// We'll add some icons for better visual cues
import { ArrowLeft, Plus, Package, PackageCheck, ChevronRight } from 'lucide-react';
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

    // --- YOUR DATA FETCHING LOGIC (No changes needed here, it's great) ---
    useEffect(() => {
        async function fetchDeliveryNote() {
            try {
                setLoadingController({ show: true, text: 'Loading Delivery Note..' })
                
                const storedDeliveryNotes = localStorage.getItem('mockDeliveryNotes');
                let deliveryNotesData;
                
                if (storedDeliveryNotes) {
                    deliveryNotesData = JSON.parse(storedDeliveryNotes);
                } else {
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

    function createNewPackingSlip() {
        router.push(`/packaging/${deliveryNoteId}/new`);
    }

    // --- UI STATES (No changes needed) ---
    if (error) {
        return <div className="flex items-center justify-center h-screen text-red-600 bg-red-50 p-4">{error}</div>;
    }
    if (loading || !deliveryNote) {
        // Combined loading and !deliveryNote check for robustness
        return <div className="flex items-center justify-center h-screen text-gray-500">Loading...</div>;
    }

    // --- ✨ NEW & IMPROVED UI ✨ ---
    return (
        // Use a light gray background for the whole page for better contrast
        <div className="bg-gray-50 min-h-screen">
            <div className="max-w-3xl mx-auto p-4">

                {/* --- HEADER --- */}
                <header className="flex items-center mb-4">
                    <Link href="/packaging" className="p-2 mr-2 rounded-full hover:bg-gray-200">
                        <ArrowLeft size={24} />
                    </Link>
                    <div>
                        <h1 className="text-xl font-bold text-gray-800">DN: {deliveryNoteId}</h1>
                        <p className="text-sm text-gray-500">Customer: {deliveryNote.customer}</p>
                    </div>
                </header>

                {/* --- ITEMS OVERVIEW (Card-based) --- */}
                <div className="mb-6">
                    <h2 className="text-lg font-semibold text-gray-700 mb-2 px-1">Items Overview</h2>
                    <div className="space-y-3">
                        {deliveryNote.items.map(item => {
                            const remaining = getRemainingQuantity(item);
                            const isCompleted = remaining <= 0;
                            return (
                                <div key={item.item_code} className={`bg-white p-4 rounded-lg shadow-sm border ${isCompleted ? 'border-green-300' : 'border-gray-200'}`}>
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="font-bold text-gray-800">{item.item_code}</p>
                                            <p className="text-xs text-gray-500">Barcode: {item.barcode}</p>
                                        </div>
                                        {isCompleted && <PackageCheck size={24} className="text-green-500" />}
                                    </div>
                                    <div className="mt-3 text-sm">
                                        <div className="flex justify-between text-gray-600">
                                            <span>Packed: <strong>{item.packed_qty}</strong></span>
                                            <span>Required: <strong>{item.total_req_qty}</strong></span>
                                        </div>
                                        {/* Progress Bar for clear visual status */}
                                        <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
                                            <div
                                                className={`h-2.5 rounded-full ${isCompleted ? 'bg-green-500' : 'bg-blue-500'}`}
                                                style={{ width: `${(item.packed_qty / item.total_req_qty) * 100}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* --- PACKING SLIPS & ACTIONS (Card-based) --- */}
                <div>
                    <div className="flex justify-between items-center mb-2 px-1">
                        <h2 className="text-lg font-semibold text-gray-700">Packing Slips</h2>
                        <button
                            onClick={createNewPackingSlip}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 active:scale-95 transition-all shadow"
                        >
                            <Plus size={18} />
                            New Slip
                        </button>
                    </div>

                    {packingSlips.length === 0 ? (
                        <div className="text-center py-10 px-4 bg-white rounded-lg shadow-sm">
                            <Package size={48} className="mx-auto text-gray-400" />
                            <p className="mt-2 text-gray-500">No packing slips created yet.</p>
                            <p className="text-sm text-gray-400">Tap 'New Slip' to start packing a box.</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {packingSlips.map(slip => (
                                <Link
                                    key={slip.name}
                                    href={`/packaging/${deliveryNoteId}/${slip.name}`}
                                    className="flex items-center justify-between bg-white p-4 rounded-lg shadow-sm hover:bg-gray-100 active:scale-[0.98] transition-all border border-gray-200"
                                >
                                    <div>
                                        <p className="font-bold text-blue-700">{slip.name}</p>
                                        <p className="text-sm text-gray-600">
                                            Total Packed: {slip.items?.reduce((total, item) => total + (item.packed_qty || 0), 0) || 0}
                                        </p>
                                    </div>
                                    <ChevronRight size={24} className="text-gray-400" />
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}