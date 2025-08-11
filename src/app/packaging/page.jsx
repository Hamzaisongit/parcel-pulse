'use client';

import { useState, useEffect, useContext } from 'react';
import { useRouter } from 'next/navigation';
import { GlobalContext } from '../../Context/globalContext';
import Link from 'next/link';
// Add new icons for a clearer interface
import { ArrowLeft, ChevronRight, PackageCheck, RefreshCw } from 'lucide-react';
import { mockDeliveryNotes, calculatePackedQuantity } from './mockData';

export default function PackagingPage() {
    // --- STATE & CONTEXT (No changes needed) ---
    const [deliveryNotes, setDeliveryNotes] = useState([]);
    const [error, setError] = useState(null);
    const router = useRouter();
    const { setLoadingController } = useContext(GlobalContext);

    // --- DATA FETCHING (No changes needed) ---
    useEffect(() => {
        try {
            const storedDeliveryNotes = localStorage.getItem('mockDeliveryNotes');
            let notesToProcess = mockDeliveryNotes; // Default to initial mock data
            if (storedDeliveryNotes) {
                notesToProcess = JSON.parse(storedDeliveryNotes);
            } else {
                // Initialize localStorage if it doesn't exist
                localStorage.setItem('mockDeliveryNotes', JSON.stringify(mockDeliveryNotes));
            }
            // Calculate packed quantities for display and sort them
            const updatedNotes = notesToProcess.map(note => calculatePackedQuantity(note));
            // Sort notes to show incomplete ones first
            updatedNotes.sort((a, b) => (a.isComplete ? 1 : -1) - (b.isComplete ? 1 : -1));
            setDeliveryNotes(updatedNotes);
        } catch (e) {
            setError("Failed to load delivery notes. Please try again.");
            console.error(e);
        }
    }, []);

    // --- ACTIONS (No changes needed) ---
    function resetMockData() {
        if (window.confirm("Are you sure you want to reset all packing progress?")) {
            localStorage.setItem('mockDeliveryNotes', JSON.stringify(mockDeliveryNotes));
            const updatedNotes = mockDeliveryNotes.map(note => calculatePackedQuantity(note));
            updatedNotes.sort((a, b) => (a.isComplete ? 1 : -1) - (b.isComplete ? 1 : -1));
            setDeliveryNotes(updatedNotes);
        }
    }

    // --- UI STATES (No changes needed) ---
    if (error) {
        return <div className="flex items-center justify-center h-screen text-red-600 bg-red-50 p-4">{error}</div>;
    }

    // --- ✨ NEW & IMPROVED UI ✨ ---
    return (
        <div className="bg-gray-100 min-h-screen">
            <div className="max-w-3xl mx-auto p-4">
                {/* --- HEADER --- */}
                <header className="flex justify-between items-center mb-4">
                    <Link href="/" className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
                        <ArrowLeft size={20} />
                        <span className="font-semibold">Home</span>
                    </Link>
                    {/* Reset button is less prominent, suitable for a debug tool */}
                    <button onClick={resetMockData} title="Reset All Data" className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-100 rounded-full">
                        <RefreshCw size={18} />
                    </button>
                </header>

                <div className="text-center mb-6">
                    <h1 className="text-2xl font-bold text-gray-800">Packaging</h1>
                    <p className="text-gray-500">Select a delivery note to begin.</p>
                </div>

                {/* --- DELIVERY NOTE LIST (Card-based) --- */}
                <div className="space-y-3">
                    {deliveryNotes.length > 0 ? (
                        deliveryNotes.map(note => {
                            const totalRequired = note.items.reduce((sum, item) => sum + item.total_req_qty, 0);
                            const totalPacked = note.items.reduce((sum, item) => sum + (item.packed_qty || 0), 0);
                            const progress = totalRequired > 0 ? (totalPacked / totalRequired) * 100 : 100;
                            const isComplete = progress >= 100;

                            return (
                                <Link
                                    key={note.name}
                                    href={`/packaging/${note.name}`}
                                    className={`block bg-white p-4 rounded-lg shadow-sm hover:ring-2 hover:ring-blue-500 active:scale-[0.98] transition-all border ${isComplete ? 'border-green-300' : 'border-transparent'}`}
                                >
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <p className={`font-bold ${isComplete ? 'text-green-700' : 'text-blue-700'}`}>{note.name}</p>
                                            <p className="text-sm text-gray-600">{note.customer}</p>
                                        </div>
                                        <ChevronRight size={24} className="text-gray-400" />
                                    </div>
                                    <div className="mt-3">
                                        <div className="flex justify-between text-xs text-gray-500 mb-1">
                                            <span>Progress</span>
                                            <span>{totalPacked} / {totalRequired}</span>
                                        </div>
                                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                                            <div
                                                className={`h-2.5 rounded-full ${isComplete ? 'bg-green-500' : 'bg-blue-500'}`}
                                                style={{ width: `${progress}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                </Link>
                            );
                        })
                    ) : (
                        // --- EMPTY STATE ---
                        <div className="text-center py-16 px-4 bg-white rounded-lg shadow-sm">
                            <PackageCheck size={48} className="mx-auto text-green-500" />
                            <p className="mt-3 font-semibold text-gray-700">All Done!</p>
                            <p className="text-sm text-gray-500">There are no pending delivery notes.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
