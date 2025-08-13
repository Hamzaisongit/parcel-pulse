'use client';

import { useState, useEffect, useRef, useContext } from 'react';
import { useParams } from 'next/navigation';
import { GlobalContext } from '../../../Context/globalContext';
import useBarcode from '../../../Stores/barcodeStore';
import IntermidScanningController from '../../../Components/IntermidScanningController';
import Link from 'next/link';
import { ArrowLeft, X, ScanLine, Camera, Check } from 'lucide-react';
import { mockPickLists } from '../mockData';

// ZXing for barcode reading
import { BrowserMultiFormatReader } from '@zxing/browser';

export default function PickListPage() {
    // --- STATE MANAGEMENT ---
    const [pickList, setPickList] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isScannerOpen, setIsScannerOpen] = useState(false);
    const [videoDevices, setVideoDevices] = useState([]);
    const [selectedVideoDevice, setSelectedVideoDevice] = useState('');
    // We'll use a fixed aspect ratio for the video frame and scan area for consistency
    // across devices, and always display the video at the largest possible size
    // that fits within a max width/height, preserving aspect ratio.
    const DEFAULT_ASPECT = 16 / 9;
    const MAX_VIDEO_WIDTH = 480;
    const MAX_VIDEO_HEIGHT = 320;
    const SCAN_AREA_WIDTH_RATIO = 0.5; // 50% of video width
    const SCAN_AREA_HEIGHT_RATIO = 0.22; // 22% of video height (for barcode strip)

    const [nativeResolution, setNativeResolution] = useState({ width: 1280, height: 720 });
    const [videoFrame, setVideoFrame] = useState({ width: 480, height: 270 }); // 16:9 default
    const [scanArea, setScanArea] = useState({ width: 288, height: 59 }); // 60% x 22% of 480x270

    const params = useParams();
    const pickListId = params.soId;
    const { setLoadingController, setScanningController, currentProcessingInfo } = useContext(GlobalContext);

    const barcode = useBarcode((state) => state.barcode);
    const setBarcode = useBarcode((state) => state.setBarcode);

    // --- REFS ---
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const scanIntervalRef = useRef(null);

    // --- DATA FETCHING & INITIALIZATION ---
    useEffect(() => {
        fetchPickList();
    }, [pickListId]);

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

    // --- BARCODE LOGIC ---
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

        const updatedPickLists = JSON.parse(localStorage.getItem('mockPickLists')).map(list => {
            if (list.name === pickListId) {
                const updatedLocations = list.locations.map(loc =>
                    loc.name === locationToPick.name ? { ...loc, picked_qty: newPickedQty } : loc
                );
                return { ...list, locations: updatedLocations };
            }
            return list;
        });

        localStorage.setItem('mockPickLists', JSON.stringify(updatedPickLists));

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
        setBarcode('');
    }

    // --- CAMERA/SCANNER LOGIC ---
    // Get video devices
    const openScanner = async () => {
        try {
            // Request camera access using getUserMedia to prompt for permissions
            await navigator.mediaDevices.getUserMedia({ video: true });
            const devices = await navigator.mediaDevices.enumerateDevices();
            const videoInputs = devices.filter(d => d.kind === 'videoinput');
            if (videoInputs.length === 0) { alert('No camera devices found.'); return; }
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
            // Map scan area from videoFrame to nativeResolution
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
        // eslint-disable-next-line
    }, [isScannerOpen, nativeResolution, videoFrame, scanArea]);

    // --- RENDER LOGIC ---
    if (error) return <div className="flex items-center justify-center h-screen text-red-500 p-4">{error}</div>;
    if (loading || !pickList) return <div className="flex items-center justify-center h-screen text-gray-500">Loading...</div>;

    const isPickListComplete = pickList.locations?.every(loc => (loc.picked_qty || 0) >= loc.qty);

    // Overlay style for scan area
    const overlayStyle = {
        position: 'absolute',
        left: `${(videoFrame.width - scanArea.width) / 2}px`,
        top: `${(videoFrame.height - scanArea.height) / 2}px`,
        width: `${scanArea.width}px`,
        height: `${scanArea.height}px`,
        border: '2px solid #fbbf24',
        borderRadius: '0.5rem',
        boxShadow: '0 0 0 9999px rgba(0,0,0,0.4) inset',
        pointerEvents: 'none',
        zIndex: 2,
    };

    return (
        <div className="bg-gray-100 min-h-screen pb-28">
            {/* --- SCANNER MODAL --- */}
            {isScannerOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex flex-col items-center justify-center p-4">
                    <div className="bg-white rounded-xl w-full max-w-md p-4 space-y-4">
                        <div className="flex justify-between items-center">
                            <h3 className="font-bold text-lg">Scan Item Barcode</h3>
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
                                        ...overlayStyle,
                                        // Remove left/top/width/height from overlayStyle and use Tailwind for rectangle
                                        left: undefined,
                                        top: undefined,
                                        width: undefined,
                                        height: undefined,
                                        // Center with transform, size with scanArea, keep other overlayStyle props
                                        transform: 'translate(-50%, -50%)',
                                        width: `${scanArea.width * 1.6}px`,
                                        height: `${scanArea.height * 1}px`,
                                    }}
                                    className="absolute left-1/2 top-1/2 rounded-lg pointer-events-none z-20 border-2 border-yellow-400"
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
                                onChange={e => setSelectedVideoDevice(e.target.value)}
                                className="w-full bg-gray-100 border-gray-300 border rounded-md p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                {videoDevices.map((d) => (
                                    <option key={d.deviceId} value={d.deviceId}>{d.label}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>
            )}

            {/* --- MAIN PAGE CONTENT --- */}
            <div className="max-w-3xl mx-auto p-4">
                <header className="flex items-center mb-4">
                    <Link href="/assembly" className="p-2 mr-2 rounded-full hover:bg-gray-200">
                        <ArrowLeft size={24} />
                    </Link>
                    <div>
                        <h1 className="text-xl font-bold text-gray-800">{pickList.name}</h1>
                        <p className="text-sm text-gray-500">{pickList.customer}</p>
                    </div>
                </header>

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
                                        <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
                                            <div className={`h-2.5 rounded-full ${isItemComplete ? 'bg-green-500' : 'bg-blue-500'}`} style={{ width: `${progress}%` }}></div>
                                        </div>
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
