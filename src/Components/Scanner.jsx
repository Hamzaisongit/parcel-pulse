"use client";

import { useEffect, useRef, useState } from "react";
import { BrowserMultiFormatReader } from "@zxing/browser";
import { DecodeHintType } from "@zxing/library";

// Simple black & white conversion for canvas
function toBlackAndWhite(ctx, width, height) {
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
        // Luminance formula
        const v = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
        const bw = v > 128 ? 255 : 0;
        data[i] = data[i + 1] = data[i + 2] = bw;
    }
    ctx.putImageData(imageData, 0, 0);
}

// Helper to crop the canvas to the scanning area
function cropCanvasToScanArea(canvas, scanArea) {
    // scanArea: { width, height }
    const cameraCanvasImageWidth = canvas.width;
    const cameraCanvasImageHeight = canvas.height;

    // Center the crop area
    const cropW = scanArea.width;
    const cropH = scanArea.height;
    const left = Math.floor((cameraCanvasImageWidth - cropW) / 2);
    const top = Math.floor((cameraCanvasImageHeight - cropH) / 2);

    const croppedCanvas = document.createElement("canvas");
    croppedCanvas.width = cropW;
    croppedCanvas.height = cropH;
    const croppedCtx = croppedCanvas.getContext("2d");
    // Optional: fill white background
    croppedCtx.rect(0, 0, cropW, cropH);
    croppedCtx.fillStyle = "white";
    croppedCtx.fill();
    croppedCtx.drawImage(
        canvas,
        left,
        top,
        cropW,
        cropH,
        0,
        0,
        cropW,
        cropH
    );
    return croppedCanvas;
}

export default function BarcodeScanner() {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const [result, setResult] = useState("");
    const [processing, setProcessing] = useState(false);
    const [devices, setDevices] = useState([]);
    const [selectedDeviceId, setSelectedDeviceId] = useState("");
    const [cameraActive, setCameraActive] = useState(false);
    const [scanMode, setScanMode] = useState("1D"); // "1D" or "2D"

    // Actual camera resolution (native, not UI)
    const [nativeResolution, setNativeResolution] = useState({ width: 1280, height: 720 });

    // UI video and scan area dimensions (scaled down from native)
    const [videoWidth, setVideoWidth] = useState(480);
    const [videoHeight, setVideoHeight] = useState(320);

    // Adjustable scan area (barcode area) dimensions
    const [scanAreaWidth, setScanAreaWidth] = useState(240);
    const [scanAreaHeight, setScanAreaHeight] = useState(80);

    // For captured image
    const [capturedImageUrl, setCapturedImageUrl] = useState(null);

    // For storing the cropped canvas (zoomed-in scan area)
    const croppedCanvasRef = useRef(null);

    // Update scan area defaults when scanMode changes
    useEffect(() => {
        if (scanMode === "2D") {
            setScanAreaWidth(180);
            setScanAreaHeight(180);
        } else {
            setScanAreaWidth(240);
            setScanAreaHeight(80);
        }
    }, [scanMode]);

    // Camera setup: get native resolution and set UI video size to same aspect ratio, scaled down
    useEffect(() => {
        let stream;
        async function setupCamera() {
            try {
                const allDevices = await navigator.mediaDevices.enumerateDevices();
                const videoDevices = allDevices.filter((d) => d.kind === "videoinput");
                setDevices(videoDevices);
                if (!selectedDeviceId && videoDevices.length > 0) {
                    setSelectedDeviceId(videoDevices[0].deviceId);
                }
                if (videoRef.current && (selectedDeviceId || videoDevices.length > 0)) {
                    // Try to get the highest possible resolution for the selected camera
                    const constraints = {
                        video: {
                            deviceId: selectedDeviceId
                                ? { exact: selectedDeviceId }
                                : undefined,
                            facingMode: selectedDeviceId ? undefined : "environment",
                            width: { ideal: 4096 },
                            height: { ideal: 2160 },
                        },
                    };

                    stream = await navigator.mediaDevices.getUserMedia(constraints);
                    videoRef.current.srcObject = stream;

                    // Wait for video metadata to load to get actual resolution
                    await new Promise((resolve) => {
                        videoRef.current.onloadedmetadata = () => resolve();
                    });

                    // Get the actual video resolution
                    const track = stream.getVideoTracks()[0];
                    let settings = track.getSettings ? track.getSettings() : {};
                    let width = settings.width || videoRef.current.videoWidth || 1280;
                    let height = settings.height || videoRef.current.videoHeight || 720;

                    // Fallback if not available
                    if (!width || !height) {
                        width = 1280;
                        height = 720;
                    }

                    setNativeResolution({ width, height });

                    // Scale down to fit max 480px width or 320px height, keeping aspect ratio
                    let maxW = 480, maxH = 320;
                    let scale = Math.min(maxW / width, maxH / height, 1);
                    let scaledW = Math.round(width * scale);
                    let scaledH = Math.round(height * scale);

                    setVideoWidth(scaledW);
                    setVideoHeight(scaledH);

                    setCameraActive(true);
                }
            } catch {
                setCameraActive(false);
            }
        }
        setupCamera();
        return () => {
            setCameraActive(false);
            if (stream) stream.getTracks().forEach((t) => t.stop());
        };
        // eslint-disable-next-line
    }, [selectedDeviceId, scanMode]);

    // --- Capture image functionality ---
    // This function captures the current scan area as an image and sets the capturedImageUrl state
    const handleCaptureImage = async () => {
        if (!canvasRef.current) return;
        setProcessing(true);
        setResult("");
        // Calculate crop area in native resolution
        const scaleX = nativeResolution.width / videoWidth;
        const scaleY = nativeResolution.height / videoHeight;
        const cropW = Math.round(scanAreaWidth * scaleX);
        const cropH = Math.round(scanAreaHeight * scaleY);
        const left = Math.floor((nativeResolution.width - cropW) / 2);
        const top = Math.floor((nativeResolution.height - cropH) / 2);

        // Draw the current video frame to the canvas at native resolution
        const ctx = canvasRef.current.getContext("2d");
        canvasRef.current.width = nativeResolution.width;
        canvasRef.current.height = nativeResolution.height;
        if (videoRef.current) {
            ctx.drawImage(
                videoRef.current,
                0,
                0,
                nativeResolution.width,
                nativeResolution.height
            );
        }

        // Black and white conversion for better accuracy
        // toBlackAndWhite(ctx, nativeResolution.width, nativeResolution.height);

        // Crop to scan area
        const croppedCanvas = document.createElement("canvas");
        croppedCanvas.width = cropW;
        croppedCanvas.height = cropH;
        const croppedCtx = croppedCanvas.getContext("2d");
        croppedCtx.rect(0, 0, cropW, cropH);
        croppedCtx.fillStyle = "white";
        croppedCtx.fill();
        croppedCtx.drawImage(
            canvasRef.current,
            left,
            top,
            cropW,
            cropH,
            0,
            0,
            cropW,
            cropH
        );

        // Store the cropped canvas for possible later use
        croppedCanvasRef.current = croppedCanvas;

        // Convert to data URL and set state
        const url = croppedCanvas.toDataURL("image/png");
        setCapturedImageUrl(url);

        // Barcode reading is now done here, on the zoomed-in captured image
        try {
            const reader = new BrowserMultiFormatReader(
                new Map([[DecodeHintType.TRY_HARDER, true]])
            );
            const res = await reader.decodeFromCanvas(croppedCanvas);
            setResult(res.getText());
        } catch {
            setResult("");
        }
        setProcessing(false);
    };

    // Clear captured image and result
    const handleClearCapturedImage = () => {
        setCapturedImageUrl(null);
        setResult("");
    };

    // Overlay dimensions for scan area
    const overlayStyle = {
        width: `${scanAreaWidth}px`,
        height: `${scanAreaHeight}px`,
        left: "50%",
        top: "50%",
        transform: "translate(-50%, -50%)",
    };

    // Canvas dimensions for video feed (UI only, actual capture is at nativeResolution)
    const canvasDims = { width: videoWidth, height: videoHeight };

    // Overlay background style for visible, semi-transparent effect
    const overlayBgStyle = {
        ...overlayStyle,
        background: "rgba(255,255,0,0.15)", // light yellow, semi-transparent
        boxShadow: "0 0 0 9999px rgba(0,0,0,0.35)", // darken outside
        zIndex: 3,
        pointerEvents: "none",
        boxSizing: "border-box",
        border: "2px dashed #facc15", // yellow-400
        borderRadius: "0.75rem",
    };

    return (
        <div className="w-full max-w-full mx-auto">
            <div className="flex flex-wrap justify-center gap-4 mb-2">
                <label className="flex items-center gap-1 text-sm">
                    Camera:
                    <select
                        value={selectedDeviceId}
                        onChange={e => setSelectedDeviceId(e.target.value)}
                        className="border rounded px-1 py-0.5"
                        disabled={devices.length === 0}
                    >
                        {devices.length === 0 && (
                            <option value="">No camera found</option>
                        )}
                        {devices.map((device) => (
                            <option key={device.deviceId} value={device.deviceId}>
                                {device.label || `Camera ${device.deviceId.slice(-4)}`}
                            </option>
                        ))}
                    </select>
                </label>
                <label className="flex items-center gap-1 text-sm">
                    Mode:
                    <select
                        value={scanMode}
                        onChange={e => setScanMode(e.target.value)}
                        className="border rounded px-1 py-0.5"
                    >
                        <option value="1D">1D Barcode</option>
                        <option value="2D">2D QR/DataMatrix</option>
                    </select>
                </label>
                <label className="flex items-center gap-1 text-sm">
                    Video Width:
                    <input
                        type="number"
                        min={scanAreaWidth + 20}
                        max={1920}
                        value={videoWidth}
                        onChange={e => setVideoWidth(Number(e.target.value))}
                        className="border rounded px-1 py-0.5 w-16"
                    />
                </label>
                <label className="flex items-center gap-1 text-sm">
                    Video Height:
                    <input
                        type="number"
                        min={scanAreaHeight + 20}
                        max={1080}
                        value={videoHeight}
                        onChange={e => setVideoHeight(Number(e.target.value))}
                        className="border rounded px-1 py-0.5 w-16"
                    />
                </label>
                <label className="flex items-center gap-1 text-sm">
                    Scan Area Width:
                    <input
                        type="number"
                        min={40}
                        max={videoWidth - 20}
                        value={scanAreaWidth}
                        onChange={e => setScanAreaWidth(Number(e.target.value))}
                        className="border rounded px-1 py-0.5 w-16"
                    />
                </label>
                <label className="flex items-center gap-1 text-sm">
                    Scan Area Height:
                    <input
                        type="number"
                        min={20}
                        max={videoHeight - 20}
                        value={scanAreaHeight}
                        onChange={e => setScanAreaHeight(Number(e.target.value))}
                        className="border rounded px-1 py-0.5 w-16"
                    />
                </label>
            </div>
            <div
                className="relative w-full max-w-full bg-black rounded-xl overflow-hidden flex items-center justify-center"
                style={{
                    height: `${videoHeight + 20}px`,
                    maxHeight: "90vh",
                    minHeight: "60px",
                }}
            >
                <div
                    className="relative"
                    style={{
                        width: `${videoWidth}px`,
                        height: `${videoHeight}px`,
                        maxWidth: "100%",
                        maxHeight: "100%",
                    }}
                >
                    <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        className="absolute top-0 left-0 w-full h-full object-cover rounded-xl block"
                        style={{
                            zIndex: 1,
                            width: `${videoWidth}px`,
                            height: `${videoHeight}px`,
                            maxWidth: "100%",
                            maxHeight: "100%",
                        }}
                        width={videoWidth}
                        height={videoHeight}
                    />
                    {/* Visible, semi-transparent barcode guide overlay */}
                    <div
                        className="absolute"
                        style={overlayBgStyle}
                    />
                    {/* Hidden canvas for capture (actual capture is at nativeResolution, not UI size) */}
                    <canvas
                        ref={canvasRef}
                        width={nativeResolution.width}
                        height={nativeResolution.height}
                        style={{
                            display: "none",
                        }}
                    />
                    {/* Show captured image preview */}
                    {capturedImageUrl && (
                        <div
                            className="absolute top-0 left-0 w-full h-full flex items-center justify-center bg-black bg-opacity-60 z-10"
                            style={{
                                borderRadius: "0.75rem",
                            }}
                        >
                            <img
                                src={capturedImageUrl}
                                alt="Captured"
                                className="max-w-full max-h-full rounded-lg border-4 border-yellow-400 shadow-lg"
                                style={{
                                    maxWidth: `${scanAreaWidth}px`,
                                    maxHeight: `${scanAreaHeight}px`,
                                    background: "white",
                                }}
                            />
                        </div>
                    )}
                </div>
            </div>
            <div className="mt-4 text-lg text-center">
                {processing
                    ? "Processing..."
                    : result
                        ? `Barcode: ${result}`
                        : cameraActive
                            ? "Camera ready. Hold barcode in view and press Capture Image."
                            : "Camera not started"}
            </div>
            {capturedImageUrl && (
                <div className="mt-2 flex flex-col items-center">
                    <a
                        href={capturedImageUrl}
                        download="barcode-capture.png"
                        className="text-blue-600 underline text-sm"
                    >
                        Download Captured Image
                    </a>
                </div>
            )}
            <div className="mt-4 flex flex-row gap-2 justify-center">
                <button
                    type="button"
                    className="border rounded px-2 py-1 text-sm bg-yellow-200 hover:bg-yellow-300 transition"
                    onClick={handleCaptureImage}
                    disabled={!cameraActive || processing}
                >
                    {processing ? "Processing..." : "Capture Image"}
                </button>
                {capturedImageUrl && (
                    <button
                        type="button"
                        className="border rounded px-2 py-1 text-sm bg-gray-200 hover:bg-gray-300 transition"
                        onClick={handleClearCapturedImage}
                    >
                        Clear Image
                    </button>
                )}
            </div>
        </div>


    );
}
