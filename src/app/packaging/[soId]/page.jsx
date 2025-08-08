'use client';

import { useState, useEffect, useContext } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { GlobalContext } from '../../../Context/globalContext';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function DeliveryNotePackagingPage() {
    const [packingSlips, setPackingSlips] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const params = useParams();
    const deliveryNoteId = params.soId;
    const { setLoadingController } = useContext(GlobalContext);

    useEffect(() => {
        async function fetchPackingSlips() {
            try {
                setLoadingController({ show: true, text: 'Loading Packing Slips..' })
                const response = await fetch(`/api/packing-slips?delivery_note=${deliveryNoteId}`);
                if (!response.ok) {
                    throw new Error('Failed to fetch packing slips');
                }
                const data = await response.json();
                setPackingSlips(data.data);
            } catch (err) {
                setError('Failed to fetch packing slips. Please try again.');
            } finally {
                setLoadingController({ show: false, text: 'Loading Packing Slips..' })
                setLoading(false);
            }
        }
        fetchPackingSlips();
    }, [deliveryNoteId]);

    if (error) {
        return <div className="flex items-center justify-center min-h-screen text-red-600 bg-red-50 p-4 rounded-lg">{error}</div>;
    }
    if (loading) {
        return <div className="flex items-center justify-center min-h-screen text-gray-600">Loading packing slips...</div>;
    }
    return (
        <div className="max-w-4xl mx-auto px-4 py-8">
            <Link href="/packaging"><ArrowLeft size={30} className='mb-2 rounded-md active:bg-gray-300'></ArrowLeft></Link>
            <h1 className="text-2xl font-bold mb-4">Packing Slips for Delivery Note: {deliveryNoteId}</h1>
            <div className="bg-white p-6 rounded-lg shadow-md">
                <table className="w-full border-collapse">
                    <thead>
                        <tr className="bg-gray-50">
                            <th className="px-4 py-3 text-left border-b">Packing Slip Name</th>
                            <th className="px-4 py-3 text-left border-b">From Case No</th>
                            <th className="px-4 py-3 text-left border-b">To Case No</th>
                        </tr>
                    </thead>
                    <tbody>
                        {packingSlips.map(slip => (
                            <tr key={slip.name} className="hover:bg-gray-100 cursor-pointer">
                                <td className="px-4 py-3 border-b">
                                    <Link href={`/packaging/${deliveryNoteId}/${slip.name}`}>{slip.name}</Link>
                                </td>
                                <td className="px-4 py-3 border-b">{slip.from_case_no}</td>
                                <td className="px-4 py-3 border-b">{slip.to_case_no}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
} 