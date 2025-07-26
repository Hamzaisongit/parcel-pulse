'use client';

import { useState, useEffect, useContext } from 'react';
import { useRouter } from 'next/navigation';
import { GlobalContext } from '../../Context/globalContext';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function AssemblyPage() {
    // State variables
    const [pickLists, setPickLists] = useState([]);
    // const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const router = useRouter();

    const { setLoadingController } = useContext(GlobalContext)

    // Fetch pick lists when component mounts
    useEffect(() => {
        async function fetchPickLists() {
            try {
                setLoadingController({ show: true, text: 'Loading Pick Lists..' })
                const response = await fetch('/api/pick-lists', {
                    credentials: 'include',
                    headers: {
                        'Accept': 'application/json',
                    },
                });
                if (!response.ok) {
                    throw new Error('Failed to fetch pick lists');
                }
                const data = await response.json();
                setPickLists(data.data);
                setLoadingController({ show: false, text: 'Loading Pick Lists..' })
            } catch (err) {
                setError('Failed to fetch pick lists. Please try again.');
                setLoadingController({ show: false, text: 'Loading Pick Lists..' })
                console.error('Error:', err);
            }
        }

        fetchPickLists();
    }, []);

    // Handle pick list selection
    function handlePickListChange(event) {
        const selectedPickList = event.target.value;
        if (selectedPickList) {
            // Navigate to the selected pick list page
            router.push(`/assembly/${selectedPickList}`);
        }
    }

    // Show error state
    if (error) {
        return <div className="flex items-center justify-center min-h-screen text-red-600 bg-red-50 p-4 rounded-lg">{error}</div>;
    }

    return (
        <div className="min-h-[100vh] bg-gray-50 px-4 flex flex-col items-center justify-center ">
            {/* Header */}
            <div className='mt-2 flex flex-row justify-center items-center'>
                <Link href="/" className='p-1 px-2 rounded-md bg-gray-300 flex flex-row justify-center items-center gap-1' ><ArrowLeft size={20} strokeWidth={2} className='rounded-md mb-1 active:bg-gray-300'></ArrowLeft><span>Home</span></Link>
            </div>
            <div className="max-w-[100vw] mx-auto text-center pt-8 pb-4">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Assembly Section</h1>
                <p className="text-lg text-gray-600">Select a Pick List to view its items</p>
            </div>

            {/* Spacer to push select into center */}
            <div className="py-5 flex-grow flex flex-col items-center">

                <select
                    onChange={handlePickListChange}
                    defaultValue=""
                    className="block h-13 w-xs px-4 py-3 mt-5 text-xl border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900"
                >
                    <option value="" disabled className="text-gray-500">Select a Pick List</option>
                    {pickLists.map(list => (
                        <option key={list.name} value={list.name} className="py-2">
                            {list.name}
                        </option>
                    ))}
                </select>

            </div>
        </div>

    );
}