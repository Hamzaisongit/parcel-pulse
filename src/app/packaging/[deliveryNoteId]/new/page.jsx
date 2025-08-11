'use client';

import { useState, useEffect, useContext, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getVideoDevices, startScanning, stopScanning } from '../../../../services/barcodeReader';
import { GlobalContext } from '../../../../Context/globalContext';
import useBarcode from '../../../../Stores/barcodeStore';
import IntermidScanningController from '../../../../Components/IntermidScanningController';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { mockDeliveryNotes, calculatePackedQuantity, getRemainingQuantity } from '../../mockData';

export default function NewPackingSlipPage() {
    const [deliveryNote, setDeliveryNote] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedItems, setSelectedItems] = useState([]);
    const [packedQty, setPackedQty] = useState({}); // { [item_name]: qty }
    const [selectedVideoDevice, setSelectedVideoDevice] = useState('');
    const [videoDevices, setVideoDevices] = useState([]);
    const [scanning, setScanning] = useState(false);
    const [barcodeInput, setBarcodeInput] = useState('');
    
    const params = useParams();
    const deliveryNoteId = params.deliveryNoteId;
    const router = useRouter();
    const { setLoadingController, setScanningController, currentProcessingInfo } = useContext(GlobalContext);
    
    const barcode = useBarcode((state) => state.barcode);
    const setBarcode = useBarcode((state) => state.setBarcode);

    useEffect(() => {
        fetchDeliveryNote();
    }, [deliveryNoteId]);

    useEffect(() => {
        if (!barcode) return;
        handleUniqueBarcodeScans(barcode);
    }, [barcode]);

    async function fetchDeliveryNote() {
        try {
            setLoadingController({ show: true, text: 'Loading Delivery Note..' });
            
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
            } else {
                setError('Delivery note not found');
            }
        } catch (err) {
            setError('Failed to fetch delivery note. Please try again.');
        } finally {
            setLoadingController({ show: false, text: 'Loading Delivery Note..' });
            setLoading(false);
        }
    }

    // Handle barcode input
    function handleBarcodeChange(event) {
        setBarcodeInput(event.target.value.trim());
    }

    // Handle barcode submission
    async function handleBarcodeSubmit(barcodeValue) {
        if (!barcodeValue || !deliveryNote) return;

        try {
            setLoadingController({ show: true, text: 'Loading' });
            
            const matchingItem = deliveryNote.items.find(item =>
                item.barcode === String(barcodeValue).slice(0, 12)
            );

            if (!matchingItem) {
                setScanningController({ show: true, text: 'No matching item found for this barcode!', status: 'failure' });
                return;
            }

            const remaining = getRemainingQuantity(matchingItem);
            const currentPacked = packedQty[matchingItem.item_name] || 0;
            // Only allow packing up to the remaining qty for this slip
            if (remaining - currentPacked <= 0) {
                setScanningController({ show: true, text: 'All items with this barcode are already packed for this slip!', status: 'alert' });
                return;
            }

            // Add item to selection if not already selected
            if (!selectedItems.includes(matchingItem.item_name)) {
                setSelectedItems(prev => [...prev, matchingItem.item_name]);
            }

            // Increment packed qty for this slip
            setPackedQty(prev => {
                const newQty = (prev[matchingItem.item_name] || 0) + 1;
                return { ...prev, [matchingItem.item_name]: newQty };
            });

            setScanningController({ show: true, text: `Added ${matchingItem.item_name} to selection`, status: 'success' });

        } catch (err) {
            console.error('Error processing barcode:', err);
            setScanningController({ show: true, text: 'Failed to process barcode', status: 'failure' });
        } finally {
            setLoadingController({ show: false, text: 'Loading' });
        }
    }

    // Toggle scanning mode
    const toggleScanning = () => {
        if (!selectedVideoDevice) {
            alert('Please select a Video Device');
            return;
        }
        setScanning(!scanning);
        setBarcode('');

        if (scanning) {
            currentProcessingInfo.current.status = 'idle';
            stopScanning();
        } else {
            startScanning('videoElement', selectedVideoDevice);
        }
    };

    function handleUniqueBarcodeScans(barcodeValue) {
        if (!barcodeValue || currentProcessingInfo.current.status === 'processing' || !deliveryNote) {
            return;
        }
        currentProcessingInfo.current.barcodeValue = barcodeValue;
        currentProcessingInfo.current.status = 'processing';
        handleBarcodeSubmit(barcodeValue);
    }

    // Generate automatic packing slip name
    function generatePackingSlipName() {
        const existingSlips = deliveryNote.packing_slips || [];
        
        // Find the highest existing PAC-XXX number
        let maxIndex = 0;
        existingSlips.forEach(slip => {
            const match = slip.name.match(/^PAC-(\d+)$/);
            if (match) {
                const index = parseInt(match[1]);
                if (index > maxIndex) {
                    maxIndex = index;
                }
            }
        });
        
        // Generate next sequential number
        const nextIndex = maxIndex + 1;
        return `PAC-${String(nextIndex).padStart(3, '0')}`;
    }

    // Create packing slip
    function createPackingSlip() {
        if (selectedItems.length === 0) {
            alert('Please select at least one item');
            return;
        }

        const packingSlipName = generatePackingSlipName();

        // Create new packing slip
        const newPackingSlip = {
            name: packingSlipName,
            delivery_note: deliveryNoteId,
            created_date: new Date().toISOString(),
            items: selectedItems.map(itemName => {
                const item = deliveryNote.items.find(i => i.item_name === itemName);
                return {
                    item_name: itemName,
                    item_code: item.item_code,
                    packed_qty: packedQty[itemName] || 0,
                    total_req_qty: item.total_req_qty,
                    barcode: item.barcode
                };
            })
        };

        // Update localStorage
        const storedDeliveryNotes = JSON.parse(localStorage.getItem('mockDeliveryNotes'));
        const updatedDeliveryNotes = storedDeliveryNotes.map(note => {
            if (note.name === deliveryNoteId) {
                return {
                    ...note,
                    packing_slips: [...note.packing_slips, newPackingSlip]
                };
            }
            return note;
        });
        
        localStorage.setItem('mockDeliveryNotes', JSON.stringify(updatedDeliveryNotes));

        // Navigate to the new packing slip
        router.push(`/packaging/${deliveryNoteId}/${packingSlipName}`);
    }

    if (error) {
        return <div className="flex items-center justify-center min-h-screen text-red-600 bg-red-50 p-4 rounded-lg">{error}</div>;
    }
    if (loading) {
        return <div className="flex items-center justify-center min-h-screen text-gray-600">Loading delivery note...</div>;
    }

    return (
        <div className="max-w-6xl mx-auto px-4 py-8">
            <Link href={`/packaging/${deliveryNoteId}`}><ArrowLeft size={30} className='mb-2 rounded-md active:bg-gray-300'></ArrowLeft></Link>
            <h1 className="text-2xl font-bold mb-4">Create New Packing Slip</h1>
            <p className="text-gray-600 mb-6">Delivery Note: {deliveryNoteId} - Customer: {deliveryNote.customer}</p>
            
            {/* Camera Screen */}
            {
                <div className={`${scanning ? '' : 'hidden'} overflow-scroll fixed inset-0 flex flex-col items-center justify-center gap-10 bg-gray-50 z-50`}>
                    <video id="videoElement" className="max-w-screen w-xs h-xs object-cover rounded-lg shadow-md"></video>

                    <div className='flex flex-col items-center justify-center gap-5'>
                        <div className='bg-gray-300 px-3 py-3 rounded-sm flex flex-row items-center justify-center gap-5 shadow-md'>
                            <input
                                type="text"
                                value={barcodeInput}
                                onChange={handleBarcodeChange}
                                placeholder="Scan or enter barcode"
                                className="bg-gray-100 flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                disabled={!scanning}
                            />
                            <button
                                onClick={() => handleBarcodeSubmit(barcodeInput)}
                                className="px-4 py-2 bg-green-500 text-white font-bold rounded-md hover:bg-green-600 transition-colors"
                            >
                                Process
                            </button>
                        </div>

                        <button
                            type="button"
                            onClick={toggleScanning}
                            className="px-4 py-2 bg-blue-500 text-white font-bold rounded-md hover:bg-blue-600 transition-colors"
                        >
                            Stop Scanning
                        </button>
                    </div>
                </div>
            }

            {/* Barcode scanning section */}
            <div className="barcode-section bg-white p-6 rounded-lg shadow-md mb-8">
                {/* <h2 className="text-xl font-semibold mb-4">Barcode Scanning</h2> */}
                <div className="flex flex-col gap-2">
                    <div className="flex flex-col gap-4">

                        <select
                            id='videoSelect'
                            onClick={(event) => {
                                event.preventDefault();
                                if (videoDevices.length) return;
                                
                                getVideoDevices().then(devices => {
                                    setVideoDevices(devices);
                                }).catch((e) => {
                                    alert('Camera Permission is required!');
                                });
                            }}
                            onChange={(e) => {
                                setSelectedVideoDevice(e.target.value);
                            }}
                            className="px-4 py-2 text-xl border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                        >
                            <option value="">Selected Video-Default</option>
                            {videoDevices.map((device) => (
                                <option key={device.deviceId} value={device.deviceId}>
                                    {device.label}
                                </option>
                            ))}
                        </select>

                        <button
                            type="button"
                            onClick={toggleScanning}
                            className="px-4 py-2 bg-blue-500 text-white text-xl font-bold rounded-md hover:bg-blue-600 transition-colors"
                        >
                            {scanning ? 'Stop Scanning' : 'Start Scanning'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Packing Slip Details */}
            <div className="bg-white p-6 rounded-lg shadow-md mb-6">
                <h2 className="text-xl font-semibold mb-4">Packing Slip Details</h2>
                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Packing Slip Name
                    </label>
                    <div className="px-3 py-2 bg-gray-100 border border-gray-300 rounded-md text-gray-700">
                        {generatePackingSlipName()}
                    </div>
                    <p className="text-sm text-gray-500 mt-1">Name will be automatically generated</p>
                </div>
            </div>

            <div className="overflow-x-auto">
                <p className="text-gray-600 mb-2">Items:</p>
                <table className="w-full border-collapse">
                    <thead>
                        <tr className="bg-gray-50">
                            <th className="px-4 py-3 text-center border-b">Item Code</th>
                            <th className="px-4 py-3 text-center border-b">Packed Qty (This Slip)</th>
                            <th className="px-4 py-3 text-center border-b">Remaining Qty (Delivery Note)</th>
                        </tr>
                    </thead>
                    <tbody>
                        {deliveryNote?.items?.map(item => {
                            const remaining = getRemainingQuantity(item);
                            const isSelected = selectedItems.includes(item.item_name);
                            const packedThisSlip = packedQty[item.item_name] || 0;
                            return (
                                <tr key={item.item_name} className={`${remaining === 0 ? 'bg-green-300' : ''} ${isSelected ? 'bg-blue-50' : ''}`}>
                                    <td className="px-4 py-3 text-center border-b">{item.item_code || '-'}</td>
                                    <td className="px-4 py-3 text-center border-b">{packedQty[item.item_name] || 0}</td>
                                    <td className="px-4 py-3 text-center border-b">{remaining - packedThisSlip >= 0 ? remaining - packedThisSlip : 0}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4">
                <button
                    onClick={createPackingSlip}
                    disabled={selectedItems.length === 0}
                    className="px-6 py-3 bg-blue-500 text-white font-medium rounded-lg hover:bg-blue-600 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                    Create Packing Slip
                </button>
                <Link
                    href={`/packaging/${deliveryNoteId}`}
                    className="px-6 py-3 bg-gray-500 text-white font-medium rounded-lg hover:bg-gray-600 transition-colors"
                >
                    Cancel
                </Link>
            </div>

            <IntermidScanningController></IntermidScanningController>
        </div>
    );
}
