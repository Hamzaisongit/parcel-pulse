'use client';

import { useState, useEffect, useContext } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getVideoDevices, startScanning, stopScanning } from '../../../services/barcodeReader';
import { GlobalContext } from '../../../Context/globalContext';
import useBarcode from '../../../Stores/barcodeStore';
import IntermidScanningController from '../../../Components/IntermidScanningController';
import Link from 'next/link';
// Add new icons for a clearer interface
import { ArrowLeft, X, ScanLine, Camera, Check, MapPin } from 'lucide-react';
import { mockPickLists } from '../mockData';

export default function PickListPage() {
    // --- STATE MANAGEMENT ---
    const [pickList, setPickList] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isScannerOpen, setIsScannerOpen] = useState(false);
    const [videoDevices, setVideoDevices] = useState([]);
    const [selectedVideoDevice, setSelectedVideoDevice] = useState('');

    const params = useParams();
    const pickListId = params.soId; // The route uses soId, but it's for the pick list
    const { setLoadingController, setScanningController, currentProcessingInfo } = useContext(GlobalContext);
    
    const barcode = useBarcode((state) => state.barcode);
    const setBarcode = useBarcode((state) => state.setBarcode);

    // --- DATA FETCHING & INITIALIZATION ---
    useEffect(() => {
        fetchPickList();
    }, [pickListId]);

    // This hook triggers the processing when a new barcode is detected
    useEffect(() => {
        if (barcode && isScannerOpen) {
            handleUniqueBarcodeScans(barcode);
        }
    }, [barcode, isScannerOpen]);

    async function fetchPickList() {
        try {
            setLoadingController({ show: true, text: 'Loading Pick List...' });
            const storedPickLists = localStorage.getItem('mockPickLists');
            let pickListsData = storedPickLists ? JSON.parse(storedPickLists) : mockPickLists;
            if (!storedPickLists) {
                localStorage.setItem('mockPickLists', JSON.stringify(mockPickLists));
            }
            const mockPickList = pickListsData.find(list => list.name === pickListId);
            if (mockPickList) {
                // Sort locations to show incomplete ones first
                mockPickList.locations.sort((a, b) => {
                    const aComplete = (a.picked_qty || 0) >= a.qty;
                    const bComplete = (b.picked_qty || 0) >= b.qty;
                    return aComplete - bComplete;
                });
                setPickList(mockPickList);
            } else {
                setError('Pick list not found');
            }
        } catch (err) {
            setError('Failed to fetch pick list. Please try again.');
        } finally {
            setLoadingController({ show: false, text: '' });
            setLoading(false);
        }
    }

    // --- YOUR CORE BARCODE LOGIC - INTEGRATED ---
    async function handleBarcodeSubmit(barcodeValue) {
        if (!barcodeValue || !pickList) return;

        const matchingLocations = pickList.locations.filter(loc => loc.barcode == String(barcodeValue).slice(0, 12));

        if (matchingLocations.length === 0) {
            setScanningController({ show: true, text: 'No item found for this barcode!', status: 'failure' });
            return;
        }

        const locationToPick = matchingLocations.find(loc => (loc.picked_qty || 0) < loc.qty);

        if (!locationToPick) {
            setScanningController({ show: true, text: 'All units for this item are already picked.', status: 'alert' });
            return;
        }

        const newPickedQty = (locationToPick.picked_qty || 0) + 1;
        
        // Create the updated list for both state and localStorage
        const updatedPickLists = JSON.parse(localStorage.getItem('mockPickLists')).map(list => {
            if (list.name === pickListId) {
                const updatedLocations = list.locations.map(loc => 
                    loc.name === locationToPick.name ? { ...loc, picked_qty: newPickedQty } : loc
                );
                return { ...list, locations: updatedLocations };
            }
            return list;
        });

        // Update localStorage first
        localStorage.setItem('mockPickLists', JSON.stringify(updatedPickLists));

        // Then update the local state from the same source of truth
        const updatedListForState = updatedPickLists.find(list => list.name === pickListId);
        updatedListForState.locations.sort((a, b) => {
            const aComplete = (a.picked_qty || 0) >= a.qty;
            const bComplete = (b.picked_qty || 0) >= b.qty;
            return aComplete - bComplete;
        });
        setPickList(updatedListForState);

        setScanningController({ show: true, text: `Picked ${locationToPick.item_code}`, status: 'success' });
    }

    function handleUniqueBarcodeScans(barcodeValue) {
        if (currentProcessingInfo.current.status === 'processing') return;
        currentProcessingInfo.current.status = 'processing';
        handleBarcodeSubmit(barcodeValue);
        setBarcode(''); // Reset barcode for next scan
    }

    // --- UI ACTIONS ---
    const openScanner = async () => {
        try {
            const devices = await getVideoDevices();
            if (devices.length === 0) { alert('No camera devices found.'); return; }
            setVideoDevices(devices);
            const rearCamera = devices.find(d => d.label.toLowerCase().includes('back')) || devices[0];
            setSelectedVideoDevice(rearCamera.deviceId);
            setIsScannerOpen(true);
        } catch (e) {
            alert('Camera permission is required.');
        }
    };

    useEffect(() => {
        if (isScannerOpen && selectedVideoDevice) {
            startScanning('videoElement', selectedVideoDevice);
        } else {
            stopScanning();
        }
        return () => stopScanning();
    }, [isScannerOpen, selectedVideoDevice]);

    // --- RENDER LOGIC ---
    if (error) return <div className="flex items-center justify-center h-screen text-red-500 p-4">{error}</div>;
    if (loading || !pickList) return <div className="flex items-center justify-center h-screen text-gray-500">Loading...</div>;

    const isPickListComplete = pickList.locations?.every(loc => (loc.picked_qty || 0) >= loc.qty);

    return (
        <div className="bg-gray-100 min-h-screen pb-28">
            {/* --- SCANNER MODAL --- */}
            {isScannerOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex flex-col items-center justify-center p-4">
                    <div className="bg-white rounded-xl w-full max-w-md p-4 space-y-4">
                        <div className="flex justify-between items-center"><h3 className="font-bold text-lg">Scan Item Barcode</h3><button onClick={() => setIsScannerOpen(false)} className="p-2 rounded-full hover:bg-gray-200"><X size={24} /></button></div>
                        <div className="relative w-full aspect-square bg-gray-900 rounded-lg overflow-hidden"><video id="videoElement" className="w-full h-full object-cover"></video><div className="absolute top-1/2 left-0 w-full h-0.5 bg-red-500 animate-ping"></div></div>
                        <div className="flex items-center space-x-2"><Camera size={20} className="text-gray-500" /><select value={selectedVideoDevice} onChange={(e) => setSelectedVideoDevice(e.target.value)} className="w-full bg-gray-100 border-gray-300 border rounded-md p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">{videoDevices.map((d) => (<option key={d.deviceId} value={d.deviceId}>{d.label}</option>))}</select></div>
                    </div>
                </div>
            )}

            {/* --- MAIN PAGE CONTENT --- */}
            <div className="max-w-3xl mx-auto p-4">
                <header className="flex items-center mb-4"><Link href="/assembly" className="p-2 mr-2 rounded-full hover:bg-gray-200"><ArrowLeft size={24} /></Link><div><h1 className="text-xl font-bold text-gray-800">{pickList.name}</h1><p className="text-sm text-gray-500">{pickList.customer}</p></div></header>

                {/* --- PICKING LOCATIONS LIST --- */}
                <div>
                    <h2 className="text-lg font-semibold text-gray-700 mb-2 px-1">Picking Locations</h2>
                    <div className="space-y-3">
                        {pickList.locations.map(loc => {
                            const picked = loc.picked_qty || 0;
                            const required = loc.qty;
                            const progress = required > 0 ? (picked / required) * 100 : 100;
                            const isItemComplete = picked >= required;
                            return (
                                <div key={loc.name} className={`bg-white rounded-lg shadow-md ${isItemComplete ? 'border-green-300 opacity-60' : ''}`}>
                                    <div className="p-4">
                                        <div className="flex justify-between items-start">
                                            <p className="font-bold text-gray-800 text-lg">{loc.item_code}</p>
                                            <div className="text-right">
                                                <p className="font-bold text-xl text-blue-700">{picked} / {required}</p>
                                                <p className="text-xs text-gray-500">Picked</p>
                                            </div>
                                        </div>
                                        <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2"><div className={`h-2.5 rounded-full ${isItemComplete ? 'bg-green-500' : 'bg-blue-500'}`} style={{ width: `${progress}%` }}></div></div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* --- STICKY FOOTER FOR ACTIONS --- */}
            <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-3 shadow-top">
                <div className="max-w-3xl mx-auto">
                    {isPickListComplete ? (
                        <div className="w-full flex items-center justify-center gap-2 p-3 bg-green-600 text-white font-bold rounded-lg">
                            <Check size={24} /> Pick List Complete
                        </div>
                    ) : (
                        <button onClick={openScanner} className="w-full flex items-center justify-center gap-2 p-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 active:scale-95 transition-all">
                            <ScanLine size={24} /> Scan Item to Pick
                        </button>
                    )}
                </div>
            </div>
            
            <IntermidScanningController />
        </div>
    );
}
