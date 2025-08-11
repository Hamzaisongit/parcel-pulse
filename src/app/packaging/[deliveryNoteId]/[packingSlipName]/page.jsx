"use client";

import { useState, useEffect, useContext } from "react";
import { useParams } from "next/navigation";
import IntermidScanningController from '../../../../Components/IntermidScanningController';
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { mockDeliveryNotes } from '../../mockData';
import { GlobalContext } from '../../../../Context/globalContext';

export default function PackingSlipDetailPage() {
    const params = useParams();
    const deliveryNoteId = params.deliveryNoteId;
    const packingSlipName = params.packingSlipName;
    const [packingSlip, setPackingSlip] = useState(null);
    const [deliveryNote, setDeliveryNote] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { setLoadingController } = useContext(GlobalContext);

    useEffect(() => {
        async function fetchPackingSlip() {
            try {
                setLoadingController({ show: true, text: 'Loading Packing Slip...' });

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
                    setDeliveryNote(mockDeliveryNote);

                    // Find the specific packing slip
                    const mockPackingSlip = mockDeliveryNote.packing_slips.find(slip => slip.name === packingSlipName);
                    console.log("packing slip..",mockPackingSlip)
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
                setLoadingController({ show: false, text: 'Loading Packing Slip...' });
                setLoading(false);
            }
        }
        fetchPackingSlip();
    }, [packingSlipName, deliveryNoteId, setLoadingController]);

    if (error) {
        return <div className="flex items-center justify-center min-h-screen text-red-600 bg-red-50 p-4 rounded-lg">{error}</div>;
    }
    if (loading || !packingSlip) {
        return <div className="flex items-center justify-center min-h-screen text-gray-600">Loading packing slip...</div>;
    }

    return (
        <div className="max-w-4xl mx-auto px-4 py-8">
            <Link href={`/packaging/${deliveryNoteId}`}><ArrowLeft size={30} className='mb-2 rounded-md active:bg-gray-300' /></Link>
            <h1 className="text-2xl font-bold mb-4">Packing Slip: {packingSlip.name}</h1>
            <div className="bg-white p-6 rounded-lg shadow-md mb-6">
                <div className="mb-2">Delivery Note: <span className="font-semibold">{packingSlip.delivery_note}</span></div>
                <div className="mb-2">Created Date: <span className="font-semibold">{new Date(packingSlip.created_date).toLocaleDateString()}</span></div>
            </div>

            <div className="overflow-x-auto">
                <p className="text-gray-600 mb-2">Items in Packing Slip:</p>
                <table className="w-full border-collapse">
                    <thead>
                        <tr className="bg-gray-50">
                            <th className="px-4 py-3 text-left border-b">Item Code</th>
                            <th className="px-4 py-3 text-left border-b">Total Required Qty</th>
                            <th className="px-4 py-3 text-left border-b">Packed Qty</th>
                            <th className="px-4 py-3 text-left border-b">Remaining</th>
                            <th className="px-4 py-3 text-left border-b">Barcode</th>
                        </tr>
                    </thead>
                    <tbody>
                        {packingSlip.items.map((item, idx) => {
                            const remaining = Math.max(0, item.total_req_qty - (item.packed_qty || 0));
                            return (
                                <tr key={idx} className={`${remaining === 0 ? 'bg-green-100' : ''}`}>
                                    <td className="px-4 py-3 border-b">{item.item_code}</td>
                                    <td className="px-4 py-3 border-b">{item.total_req_qty}</td>
                                    <td className="px-4 py-3 border-b">{item.packed_qty || 0}</td>
                                    <td className="px-4 py-3 border-b">{remaining}</td>
                                    <td className="px-4 py-3 border-b">{item.barcode}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
            <IntermidScanningController isPackaging={true} />
        </div>
    );
}
