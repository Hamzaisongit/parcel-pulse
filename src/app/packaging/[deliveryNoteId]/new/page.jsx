'use client';

import { useState, useEffect, useContext } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getVideoDevices, startScanning, stopScanning } from '../../../../services/barcodeReader';
import { GlobalContext } from '../../../../Context/globalContext';
import useBarcode from '../../../../Stores/barcodeStore';
import Link from 'next/link';
import { ArrowLeft, X, ScanLine, Plus, Minus, CheckSquare, Camera } from 'lucide-react';
import { mockDeliveryNotes, calculatePackedQuantity, getRemainingQuantity } from '../../mockData';
import IntermidScanningController from '../../../../Components/IntermidScanningController';

export default function NewPackingSlipPage() {
    // --- STATE MANAGEMENT ---
    const [deliveryNote, setDeliveryNote] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [packedQty, setPackedQty] = useState({}); // { [item_name]: qty }
    const [videoDevices, setVideoDevices] = useState([]);
    const [selectedVideoDevice, setSelectedVideoDevice] = useState('');
    const [isScannerOpen, setIsScannerOpen] = useState(false);

    const params = useParams();
    const deliveryNoteId = params.deliveryNoteId;
    const router = useRouter();
    const { setLoadingController, setScanningController, currentProcessingInfo } = useContext(GlobalContext);

    // Zustand store for barcode state
    const barcode = useBarcode((state) => state.barcode);
    const setBarcode = useBarcode((state) => state.setBarcode);

    // --- DATA FETCHING ---
    useEffect(() => {
        fetchDeliveryNote();
    }, [deliveryNoteId]);

    // --- ✨ CORE BARCODE PROCESSING LOGIC (INTEGRATED) ✨ ---
    // This useEffect hook now correctly listens for barcode changes from the global store.
    useEffect(() => {
        console.log('[BarcodeDebug] useEffect: barcode:', barcode, 'isScannerOpen:', isScannerOpen);
        if (barcode && isScannerOpen) {
            console.log('[BarcodeDebug] Barcode detected in Zustand store:', barcode);
            handleUniqueBarcodeScans(barcode);
        }
    }, [barcode, isScannerOpen]); // It runs whenever a new barcode is scanned

    async function fetchDeliveryNote() {
        try {
            setLoadingController({ show: true, text: 'Loading Delivery Note..' });
            const storedDeliveryNotes = localStorage.getItem('mockDeliveryNotes');
            let deliveryNotesData = storedDeliveryNotes ? JSON.parse(storedDeliveryNotes) : mockDeliveryNotes;
            if (!storedDeliveryNotes) {
                localStorage.setItem('mockDeliveryNotes', JSON.stringify(mockDeliveryNotes));
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
            setLoadingController({ show: false, text: '' });
            setLoading(false);
        }
    }

    // This is the main logic function that processes the scanned barcode.
    async function handleBarcodeSubmit(barcodeValue) {
        console.log('[BarcodeDebug] handleBarcodeSubmit called with value:', barcodeValue);
        if (!barcodeValue || !deliveryNote) {
            console.log('[BarcodeDebug] No barcode value or deliveryNote is null.');
            return;
        }

        const matchingItem = deliveryNote.items.find(item => item.barcode === String(barcodeValue).slice(0, 12));
        if (matchingItem) {
            console.log('[BarcodeDebug] Matching item found:', matchingItem.item_code, matchingItem.item_name);
        } else {
            console.log('[BarcodeDebug] No matching item for barcode:', barcodeValue);
        }

        if (!matchingItem) {
            setScanningController({ show: true, text: 'Item not found!', status: 'failure' });
            return;
        }

        const remainingInDN = getRemainingQuantity(matchingItem);
        const packedInThisSlip = packedQty[matchingItem.item_name] || 0;

        console.log('[BarcodeDebug] Remaining in DN:', remainingInDN, 'Packed in this slip:', packedInThisSlip);

        if (packedInThisSlip >= remainingInDN) {
            setScanningController({ show: true, text: 'All required units packed', status: 'alert' });
            return;
        }

        // If checks pass, increment the quantity for the item
        incrementQty(matchingItem.item_name);
        setScanningController({ show: true, text: `Packed ${matchingItem.item_code}`, status: 'success' });
    }

    // This gatekeeper function prevents a single scan from being processed multiple times.
    function handleUniqueBarcodeScans(barcodeValue) {
        console.log('[BarcodeDebug] handleUniqueBarcodeScans called with value:', barcodeValue);
        if (currentProcessingInfo.current.status === 'processing') {
            console.log('[BarcodeDebug] Already processing, skipping.');
            return;
        }
        currentProcessingInfo.current.status = 'processing';
        handleBarcodeSubmit(barcodeValue);

        // Reset the barcode in the global store so we can detect the next scan
        setBarcode('');
    }

    // --- UI HANDLERS & ACTIONS ---
    const incrementQty = (itemName) => {
        setPackedQty(prev => ({ ...prev, [itemName]: (prev[itemName] || 0) + 1 }));
    };

    const decrementQty = (itemName) => {
        setPackedQty(prev => ({ ...prev, [itemName]: Math.max(0, (prev[itemName] || 0) - 1) }));
    };

    const openScanner = async () => {
        try {
            const devices = await getVideoDevices();
            console.log('[BarcodeDebug] Video devices found:', devices);
            if (devices.length === 0) {
                alert('No camera devices found.');
                return;
            }
            setVideoDevices(devices);
            const rearCamera = devices.find(d => d.label.toLowerCase().includes('back')) || devices[0];
            setSelectedVideoDevice(rearCamera.deviceId);
            setIsScannerOpen(true);
        } catch (e) {
            console.log('[BarcodeDebug] Error getting video devices:', e);
            alert('Camera permission is required to use the scanner.');
        }
    };

    useEffect(() => {
        console.log('[BarcodeDebug] useEffect: isScannerOpen:', isScannerOpen, 'selectedVideoDevice:', selectedVideoDevice);
        if (isScannerOpen && selectedVideoDevice) {
            console.log('[BarcodeDebug] Starting scanning on videoElement with device:', selectedVideoDevice);
            startScanning('videoElement', selectedVideoDevice);
        } else {
            console.log('[BarcodeDebug] Stopping scanning');
            stopScanning();
        }
        return () => {
            console.log('[BarcodeDebug] Cleanup: stopScanning');
            stopScanning();
        };
    }, [isScannerOpen, selectedVideoDevice]);

    function createPackingSlip() {
        const selectedItems = Object.keys(packedQty).filter(key => packedQty[key] > 0);
        if (selectedItems.length === 0) {
            alert('Scan at least one item to create a slip.');
            return;
        }
        const packingSlipName = `PAC-${String((deliveryNote.packing_slips?.length || 0) + 1).padStart(3, '0')}`;
        const newPackingSlip = {
            name: packingSlipName,
            delivery_note: deliveryNoteId,
            created_date: new Date().toISOString(),
            items: selectedItems.map(itemName => {
                const item = deliveryNote.items.find(i => i.item_name === itemName);
                return { ...item, packed_qty: packedQty[itemName] };
            })
        };
        const storedNotes = JSON.parse(localStorage.getItem('mockDeliveryNotes'));
        const updatedNotes = storedNotes.map(note => 
            note.name === deliveryNoteId 
            ? { ...note, packing_slips: [...note.packing_slips, newPackingSlip] }
            : note
        );
        localStorage.setItem('mockDeliveryNotes', JSON.stringify(updatedNotes));
        router.push(`/packaging/${deliveryNoteId}/${packingSlipName}`);
    }

    // --- LOADING / ERROR STATES ---
    if (error) return <div className="flex items-center justify-center h-screen text-red-500 p-4">{error}</div>;
    if (loading || !deliveryNote) return <div className="flex items-center justify-center h-screen text-gray-500">Loading...</div>;

    const totalPackedInSlip = Object.values(packedQty).reduce((sum, qty) => sum + qty, 0);

    // --- ✨ THE CLEAN UI YOU LIKED ✨ ---
    return (
        <div className="bg-gray-100 min-h-screen pb-28">
            {/* --- SCANNER MODAL --- */}
            {isScannerOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex flex-col items-center justify-center p-4">
                    <div className="bg-white rounded-xl w-full max-w-md p-4 space-y-4">
                        <div className="flex justify-between items-center"><h3 className="font-bold text-lg">Scan Barcode</h3><button onClick={() => setIsScannerOpen(false)} className="p-2 rounded-full hover:bg-gray-200"><X size={24} /></button></div>
                        <div className="relative w-full aspect-square bg-gray-900 rounded-lg overflow-hidden"><video id="videoElement" className="w-full h-full object-cover"></video><div className="absolute top-1/2 left-0 w-full h-0.5 bg-red-500 animate-ping"></div></div>
                        <div className="flex items-center space-x-2"><Camera size={20} className="text-gray-500" /><select value={selectedVideoDevice} onChange={(e) => setSelectedVideoDevice(e.target.value)} className="w-full bg-gray-100 border-gray-300 border rounded-md p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">{videoDevices.map((d) => (<option key={d.deviceId} value={d.deviceId}>{d.label}</option>))}</select></div>
                    </div>
                </div>
            )}
            
            {/* --- MAIN PAGE CONTENT --- */}
            <div className="max-w-3xl mx-auto p-4">
                <header className="flex items-center mb-4"><Link href={`/packaging/${deliveryNoteId}`} className="p-2 mr-2 rounded-full hover:bg-gray-200"><ArrowLeft size={24} /></Link><h1 className="text-xl font-bold text-gray-800">New Packing Slip</h1></header>
                <div className="space-y-3">
                    {deliveryNote.items.map(item => {
                        const remainingInDN = getRemainingQuantity(item);
                        const packedInThisSlip = packedQty[item.item_name] || 0;
                        const isCompleted = remainingInDN <= 0;
                        return (
                            <div key={item.item_name} className={`bg-white p-3 rounded-lg shadow-sm border ${packedInThisSlip > 0 ? 'border-blue-500' : 'border-transparent'}`}>
                                <p className="font-bold text-gray-800">{item.item_code}</p>
                                <div className="flex justify-between items-center mt-2">
                                    <div className="text-sm text-gray-500">Required: <span className="font-semibold text-gray-700">{remainingInDN}</span>{isCompleted && <CheckSquare size={16} className="inline ml-1 text-green-600" />}</div>
                                    <div className="flex items-center gap-3 bg-gray-100 rounded-full"><button onClick={() => decrementQty(item.item_name)} className="px-3 py-1 text-blue-600 font-bold text-lg active:bg-gray-300 rounded-full">-</button><span className="font-bold text-lg text-gray-900 w-6 text-center">{packedInThisSlip}</span><button onClick={() => incrementQty(item.item_name)} disabled={packedInThisSlip >= remainingInDN} className="px-3 py-1 text-blue-600 font-bold text-lg active:bg-gray-300 rounded-full disabled:text-gray-300">+</button></div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* --- STICKY FOOTER FOR ACTIONS --- */}
            <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-3 shadow-top">
                <div className="max-w-3xl mx-auto flex gap-4">
                    <button onClick={openScanner} className="w-1/3 flex-shrink-0 flex flex-col items-center justify-center p-2 bg-white text-blue-600 border-2 border-blue-600 font-semibold rounded-lg hover:bg-blue-50 active:scale-95 transition-all"><ScanLine size={24} /><span className="text-xs mt-1">Scan</span></button>
                    <button onClick={createPackingSlip} disabled={totalPackedInSlip === 0} className="w-2/3 flex-grow p-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 active:scale-95 transition-all disabled:bg-gray-400 disabled:cursor-not-allowed">Create Slip ({totalPackedInSlip} {totalPackedInSlip === 1 ? 'Item' : 'Items'})</button>
                </div>
            </div>
            <IntermidScanningController />
        </div>
    );
}
