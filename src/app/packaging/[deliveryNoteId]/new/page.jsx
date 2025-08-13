'use client';

import { useState, useEffect, useRef, useContext } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getVideoDevices } from '../../../../services/barcodeReader';
import { GlobalContext } from '../../../../Context/globalContext';
import useBarcode from '../../../../Stores/barcodeStore';
import Link from 'next/link';
import { ArrowLeft, X, ScanLine, Plus, Minus, CheckSquare, Camera } from 'lucide-react';
import { mockDeliveryNotes, calculatePackedQuantity, getRemainingQuantity } from '../../mockData';
import IntermidScanningController from '../../../../Components/IntermidScanningController';

// ZXing for barcode reading
import { BrowserMultiFormatReader } from '@zxing/browser';

export default function NewPackingSlipPage() {
    // --- STATE MANAGEMENT ---
    const [deliveryNote, setDeliveryNote] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [packedQty, setPackedQty] = useState({}); // { [item_name]: qty }
    const [videoDevices, setVideoDevices] = useState([]);
    const [selectedVideoDevice, setSelectedVideoDevice] = useState('');
    const [isScannerOpen, setIsScannerOpen] = useState(false);

    // Scanner resolution/aspect
    const DEFAULT_ASPECT = 16 / 9;
    const MAX_VIDEO_WIDTH = 480;
    const MAX_VIDEO_HEIGHT = 320;
    const SCAN_AREA_WIDTH_RATIO = 0.5; // 50% of video width
    const SCAN_AREA_HEIGHT_RATIO = 0.22; // 22% of video height

    const [nativeResolution, setNativeResolution] = useState({ width: 1280, height: 720 });
    const [videoFrame, setVideoFrame] = useState({ width: 480, height: 270 }); // 16:9 default
    const [scanArea, setScanArea] = useState({ width: 288, height: 59 }); // 50% x 22% of 480x270

    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const scanIntervalRef = useRef(null);

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

    // --- CORE BARCODE PROCESSING LOGIC ---
    useEffect(() => {
        if (barcode && isScannerOpen) {
            handleUniqueBarcodeScans(barcode);
        }
    }, [barcode, isScannerOpen]);

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

    async function handleBarcodeSubmit(barcodeValue) {
        if (!barcodeValue || !deliveryNote) return;

        const matchingItem = deliveryNote.items.find(item => item.barcode === String(barcodeValue).slice(0, 12));
        if (!matchingItem) {
            setScanningController({ show: true, text: 'Item not found!', status: 'failure' });
            return;
        }

        const remainingInDN = getRemainingQuantity(matchingItem);
        const packedInThisSlip = packedQty[matchingItem.item_name] || 0;

        if (packedInThisSlip >= remainingInDN) {
            setScanningController({ show: true, text: 'All required units packed', status: 'alert' });
            return;
        }

        incrementQty(matchingItem.item_name);
        setScanningController({ show: true, text: `Packed ${matchingItem.item_code}`, status: 'success' });
    }

    function handleUniqueBarcodeScans(barcodeValue) {
        if (currentProcessingInfo.current.status === 'processing') return;
        currentProcessingInfo.current.status = 'processing';
        handleBarcodeSubmit(barcodeValue);
        setBarcode('');
    }

    // --- UI HANDLERS & ACTIONS ---
    const incrementQty = (itemName) => {
        setPackedQty(prev => ({ ...prev, [itemName]: (prev[itemName] || 0) + 1 }));
    };

    const decrementQty = (itemName) => {
        setPackedQty(prev => ({ ...prev, [itemName]: Math.max(0, (prev[itemName] || 0) - 1) }));
    };

    // --- CAMERA/SCANNER LOGIC ---
    const openScanner = async () => {
        try {
            // Request camera access using getUserMedia to prompt for permissions
            await navigator.mediaDevices.getUserMedia({ video: true });
            const devices = await navigator.mediaDevices.enumerateDevices();
            const videoInputs = devices.filter(d => d.kind === 'videoinput');
            if (videoInputs.length === 0) {
                alert('No camera devices found.');
                return;
            }
            setVideoDevices(videoInputs);
            const rearCamera = videoInputs.find(d => d.label.toLowerCase().includes('back')) || videoInputs[0];
            setSelectedVideoDevice(rearCamera.deviceId);
            setIsScannerOpen(true);
        } catch (e) {
            alert('Camera permission is required.');
        }
    };

    // Setup camera feed and get native resolution
    useEffect(() => {
        let stream;
        async function setupCamera() {
            if (!isScannerOpen || !selectedVideoDevice) return;
            try {
                const constraints = {
                    video: {
                        deviceId: { exact: selectedVideoDevice },
                        width: { ideal: 4096 },
                        height: { ideal: 2160 },
                    }
                };
                stream = await navigator.mediaDevices.getUserMedia(constraints);
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                    await new Promise((resolve) => {
                        videoRef.current.onloadedmetadata = () => resolve();
                    });
                    // Get actual video resolution
                    const track = stream.getVideoTracks()[0];
                    let settings = track.getSettings ? track.getSettings() : {};
                    let width = settings.width || videoRef.current.videoWidth || 1280;
                    let height = settings.height || videoRef.current.videoHeight || 720;

                    // Always use the actual camera aspect ratio, but fit into our max frame
                    let aspect = width / height;
                    let frameW = MAX_VIDEO_WIDTH;
                    let frameH = Math.round(frameW / aspect);
                    if (frameH > MAX_VIDEO_HEIGHT) {
                        frameH = MAX_VIDEO_HEIGHT;
                        frameW = Math.round(frameH * aspect);
                    }

                    setNativeResolution({ width, height });
                    setVideoFrame({ width: frameW, height: frameH });

                    // Scan area: always a horizontal strip, consistent ratio
                    setScanArea({
                        width: Math.round(frameW * SCAN_AREA_WIDTH_RATIO),
                        height: Math.round(frameH * SCAN_AREA_HEIGHT_RATIO)
                    });
                }
            } catch (e) {
                setError('Could not start camera');
            }
        }
        setupCamera();
        return () => {
            if (stream) stream.getTracks().forEach((t) => t.stop());
        };
    }, [isScannerOpen, selectedVideoDevice]);

    // Barcode scanning using cropped canvas
    useEffect(() => {
        if (!isScannerOpen) return;
        let reader = new BrowserMultiFormatReader();
        let running = true;

        function scanLoop() {
            if (!videoRef.current || !canvasRef.current) return;
            // Draw video frame to canvas at native resolution
            const ctx = canvasRef.current.getContext('2d');
            ctx.drawImage(videoRef.current, 0, 0, nativeResolution.width, nativeResolution.height);

            // Calculate crop area in native resolution
            const scaleX = nativeResolution.width / videoFrame.width;
            const scaleY = nativeResolution.height / videoFrame.height;
            const cropW = Math.round(scanArea.width * scaleX);
            const cropH = Math.round(scanArea.height * scaleY);
            const left = Math.floor((nativeResolution.width - cropW) / 2);
            const top = Math.floor((nativeResolution.height - cropH) / 2);

            // Create cropped canvas
            const croppedCanvas = document.createElement('canvas');
            croppedCanvas.width = cropW;
            croppedCanvas.height = cropH;
            const croppedCtx = croppedCanvas.getContext('2d');
            croppedCtx.drawImage(
                canvasRef.current,
                left, top, cropW, cropH,
                0, 0, cropW, cropH
            );

            // Try decode
            try {
                const result = reader.decodeFromCanvas(croppedCanvas);
                if (result && running) {
                    setBarcode(result.getText());
                }
            } catch (e) {
                // Only log if it's not the expected "no code found" error
                if (!e.message?.includes("No MultiFormat Readers were able to detect the code")) {
                    console.log("barcode not found!", e);
                }
            }

            scanIntervalRef.current = setTimeout(scanLoop, 350);
        }

        scanLoop();

        return () => {
            running = false;
            if (scanIntervalRef.current) clearTimeout(scanIntervalRef.current);
        };
    }, [isScannerOpen, nativeResolution, videoFrame, scanArea]);

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

    // --- UI ---
    return (
        <div className="bg-gray-100 min-h-screen pb-28">
            {/* --- SCANNER MODAL --- */}
            {isScannerOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex flex-col items-center justify-center p-4">
                    <div className="bg-white rounded-xl w-full max-w-md p-4 space-y-4">
                        <div className="flex justify-between items-center">
                            <h3 className="font-bold text-lg">Scan Barcode</h3>
                            <button onClick={() => setIsScannerOpen(false)} className="p-2 rounded-full hover:bg-gray-200">
                                <X size={24} />
                            </button>
                        </div>
                        <div
                            className="relative mx-auto w-[420px] h-[260px] max-w-full max-h-full bg-[#111] rounded-xl overflow-hidden"
                        >
                            <video
                                ref={videoRef}
                                autoPlay
                                playsInline
                                muted
                                className="absolute top-0 left-0 w-[420px] h-[260px] max-w-full max-h-full object-cover rounded-xl block z-[1]"
                                width={nativeResolution.width}
                                height={nativeResolution.height}
                            />
                            {/* Barcode capture area overlay */}
                            <div
                                className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none"
                            >
                                <div
                                    style={{
                                        position: 'absolute',
                                        left: '50%',
                                        top: '50%',
                                        width: `${scanArea.width * 1.2}px`, // width a bit bigger than height (scaling factor)
                                        height: `${scanArea.height * 0.8}px`, // height scaling factor for control
                                        border: '2px solid #fbbf24',
                                        borderRadius: '0.5rem',
                                        boxShadow: '0 0 0 9999px rgba(0,0,0,0.4) inset',
                                        pointerEvents: 'none',
                                        zIndex: 2,
                                        transform: 'translate(-50%, -50%)',
                                    }}
                                    className="absolute rounded-lg pointer-events-none z-20"
                                ></div>
                            </div>
                            {/* Hidden canvas for capture */}
                            <canvas
                                ref={canvasRef}
                                width={nativeResolution.width}
                                height={nativeResolution.height}
                                style={{ display: 'none' }}
                            />
                        </div>
                        <div className="flex items-center space-x-2">
                            <Camera size={20} className="text-gray-500" />
                            <select
                                value={selectedVideoDevice}
                                onChange={(e) => setSelectedVideoDevice(e.target.value)}
                                className="w-full bg-gray-100 border-gray-300 border rounded-md p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                {videoDevices.map((d) => (
                                    <option key={d.deviceId} value={d.deviceId}>{d.label || `Camera ${videoDevices.indexOf(d) + 1}`}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>
            )}

            {/* --- MAIN PAGE CONTENT --- */}
            <div className="max-w-3xl mx-auto p-4">
                <header className="flex items-center mb-4">
                    <Link href={`/packaging/${deliveryNoteId}`} className="p-2 mr-2 rounded-full hover:bg-gray-200">
                        <ArrowLeft size={24} />
                    </Link>
                    <h1 className="text-xl font-bold text-gray-800">New Packing Slip</h1>
                </header>
                <div className="space-y-3">
                    {deliveryNote.items.map(item => {
                        const remainingInDN = getRemainingQuantity(item);
                        const packedInThisSlip = packedQty[item.item_name] || 0;
                        const isCompleted = remainingInDN <= 0;
                        return (
                            <div key={item.item_name} className={`bg-white p-3 rounded-lg shadow-sm border ${packedInThisSlip > 0 ? 'border-blue-500' : 'border-transparent'}`}>
                                <p className="font-bold text-gray-800">{item.item_code}</p>
                                <div className="flex justify-between items-center mt-2">
                                    <div className="text-sm text-gray-500">
                                        Required: <span className="font-semibold text-gray-700">{remainingInDN}</span>
                                        {isCompleted && <CheckSquare size={16} className="inline ml-1 text-green-600" />}
                                    </div>
                                    <div className="flex items-center gap-3 bg-gray-100 rounded-full">
                                        <button onClick={() => decrementQty(item.item_name)} className="px-3 py-1 text-blue-600 font-bold text-lg active:bg-gray-300 rounded-full">-</button>
                                        <span className="font-bold text-lg text-gray-900 w-6 text-center">{packedInThisSlip}</span>
                                        <button onClick={() => incrementQty(item.item_name)} disabled={packedInThisSlip >= remainingInDN} className="px-3 py-1 text-blue-600 font-bold text-lg active:bg-gray-300 rounded-full disabled:text-gray-300">+</button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* --- STICKY FOOTER FOR ACTIONS --- */}
            <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-3 shadow-top">
                <div className="max-w-3xl mx-auto flex gap-4">
                    <button onClick={openScanner} className="w-1/3 flex-shrink-0 flex flex-col items-center justify-center p-2 bg-white text-blue-600 border-2 border-blue-600 font-semibold rounded-lg hover:bg-blue-50 active:scale-95 transition-all">
                        <ScanLine size={24} />
                        <span className="text-xs mt-1">Scan</span>
                    </button>
                    <button onClick={createPackingSlip} disabled={totalPackedInSlip === 0} className="w-2/3 flex-grow p-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 active:scale-95 transition-all disabled:bg-gray-400 disabled:cursor-not-allowed">
                        Create Slip ({totalPackedInSlip} {totalPackedInSlip === 1 ? 'Item' : 'Items'})
                    </button>
                </div>
            </div>
            <IntermidScanningController />
        </div>
    );
}