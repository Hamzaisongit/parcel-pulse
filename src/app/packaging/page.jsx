'use client';

import { useState, useEffect, useContext } from 'react';
import { useRouter } from 'next/navigation';
import { GlobalContext } from '../../Context/globalContext';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function PackagingPage() {
    // State variables
    const [deliveryNotes, setDeliveryNotes] = useState([]);
    const [error, setError] = useState(null);
    const router = useRouter();

    const { setLoadingController } = useContext(GlobalContext)

    // Fetch sales orders when component mounts
    useEffect(() => {
        async function fetchDeliveryNotes() {
            try {
                setLoadingController({ show: true, text: 'Loading Delivery Notes..' })
                const response = await fetch('/api/delivery-notes', {
                    credentials: 'include',
                    headers: {
                        'Accept': 'application/json',
                    },
                });
                if (!response.ok) {
                    throw new Error('Failed to fetch delivery notes');
                }
                const data = await response.json();
                setDeliveryNotes(data.data);
                setLoadingController({ show: false, text: 'Loading Delivery Notes..' })
            } catch (err) {
                setError('Failed to fetch delivery notes. Please try again.');
                setLoadingController({ show: false, text: 'Loading Delivery Notes..' })
                console.error('Error:', err);
            }
        }
        fetchDeliveryNotes();
    }, []);

    // Handle sales order selection
    function handleDeliveryNoteChange(event) {
        const selectedNote = event.target.value;
        if (selectedNote) {
            router.push(`/packaging/${selectedNote}`);
        }
    }

    // Show error state
    if (error) {
        return <div className="flex items-center justify-center min-h-screen text-red-600 bg-red-50 p-4 rounded-lg">{error}</div>;
    }

    return (
        <div className="min-h-[100vh] bg-gray-50 px-4 sm:px-6 lg:px-8 flex flex-col">
            {/* Header */}

            <div className='mt-2 flex flex-row justify-center items-center'>
                <Link href="/" className='p-1 px-2 rounded-md bg-gray-300 flex flex-row justify-center items-center gap-1' ><ArrowLeft size={20} strokeWidth={2} className='rounded-md mb-1 active:bg-gray-300'></ArrowLeft><span>Home</span></Link>
            </div>

            <div className="max-w-[100vw] mx-auto text-center pt-8 pb-4">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Packaging Section</h1>
                <p className="text-lg text-gray-600">Select a Delivery Note to start packaging</p>
            </div>

            {/* Delivery Note Selection */}
            <div className="py-5 flex-grow flex flex-col items-center">
                <select 
                    onChange={handleDeliveryNoteChange}
                    defaultValue=""
                    className="block h-13 w-xs px-4 py-3 mt-5 text-xl border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900"
                >
                    <option value="" disabled className="text-gray-500">Select a Delivery Note</option>
                    {deliveryNotes.map(note => (
                        <option key={note.name} value={note.name} className="py-2">
                            {note.name} - {note.customer} ({note.posting_date})
                        </option>
                    ))}
                </select>
            </div>
        </div>
    );
}