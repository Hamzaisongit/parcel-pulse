'use client';

import { useState, useEffect, useContext } from 'react';
import { useRouter } from 'next/navigation';
import { GlobalContext } from '../../Context/globalContext';
import Link from 'next/link';
// Add new icons for a clearer interface
import { ArrowLeft, ChevronRight, CheckCircle, RefreshCw } from 'lucide-react';
import { mockPickLists } from './mockData';

export default function AssemblyPage() {
    // --- STATE & CONTEXT (No changes needed) ---
    const [pickLists, setPickLists] = useState([]);
    const [error, setError] = useState(null);
    const router = useRouter();
    const { setLoadingController } = useContext(GlobalContext);

    // --- DATA FETCHING & PROCESSING ---
    useEffect(() => {
        try {
            const storedPickLists = localStorage.getItem('mockPickLists');
            let listsToProcess = mockPickLists; // Default to initial mock data
            if (storedPickLists) {
                listsToProcess = JSON.parse(storedPickLists);
            } else {
                // Initialize localStorage if it doesn't exist
                localStorage.setItem('mockPickLists', JSON.stringify(mockPickLists));
            }

            // Calculate progress for each pick list before setting state
            const updatedLists = listsToProcess.map(list => {
                const totalRequired = list.locations.reduce((sum, loc) => sum + loc.qty, 0);
                const totalPicked = list.locations.reduce((sum, loc) => sum + (loc.picked_qty || 0), 0);
                const isComplete = totalPicked >= totalRequired;
                return { ...list, totalRequired, totalPicked, isComplete };
            });

            // Sort lists to show incomplete ones first
            updatedLists.sort((a, b) => a.isComplete - b.isComplete);
            
            setPickLists(updatedLists);
        } catch (e) {
            setError("Failed to load pick lists. Please try again.");
            console.error(e);
        }
    }, []);

    // --- ACTIONS ---
    function resetMockData() {
        if (window.confirm("Are you sure you want to reset all picking progress?")) {
            localStorage.setItem('mockPickLists', JSON.stringify(mockPickLists));
            // Re-run the processing logic after reset
            const updatedLists = mockPickLists.map(list => {
                const totalRequired = list.locations.reduce((sum, loc) => sum + loc.qty, 0);
                const totalPicked = list.locations.reduce((sum, loc) => sum + (loc.picked_qty || 0), 0);
                const isComplete = totalPicked >= totalRequired;
                return { ...list, totalRequired, totalPicked, isComplete };
            });
            updatedLists.sort((a, b) => a.isComplete - b.isComplete);
            setPickLists(updatedLists);
        }
    }

    // --- UI STATES ---
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
                    <button onClick={resetMockData} title="Reset All Data" className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-100 rounded-full">
                        <RefreshCw size={18} />
                    </button>
                </header>

                <div className="text-center mb-6">
                    <h1 className="text-2xl font-bold text-gray-800">Assembly</h1>
                    <p className="text-gray-500">Select a pick list to begin.</p>
                </div>

                {/* --- PICK LISTS (Card-based) --- */}
                <div className="space-y-3">
                    {pickLists.length > 0 ? (
                        pickLists.map(list => {
                            const progress = list.totalRequired > 0 ? (list.totalPicked / list.totalRequired) * 100 : 100;

                            return (
                                <Link
                                    key={list.name}
                                    href={`/assembly/${list.name}`}
                                    className={`block bg-white p-4 rounded-lg shadow-sm hover:ring-2 hover:ring-blue-500 active:scale-[0.98] transition-all border ${list.isComplete ? 'border-green-300' : 'border-transparent'}`}
                                >
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <p className={`font-bold ${list.isComplete ? 'text-green-700' : 'text-blue-700'}`}>{list.name}</p>
                                            <p className="text-sm text-gray-600">{list.customer}</p>
                                        </div>
                                        <ChevronRight size={24} className="text-gray-400" />
                                    </div>
                                    <div className="mt-3">
                                        <div className="flex justify-between text-xs text-gray-500 mb-1">
                                            <span>Progress</span>
                                            <span>{list.totalPicked} / {list.totalRequired}</span>
                                        </div>
                                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                                            <div
                                                className={`h-2.5 rounded-full ${list.isComplete ? 'bg-green-500' : 'bg-blue-500'}`}
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
                            <CheckCircle size={48} className="mx-auto text-green-500" />
                            <p className="mt-3 font-semibold text-gray-700">All Done!</p>
                            <p className="text-sm text-gray-500">There are no pending pick lists.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
