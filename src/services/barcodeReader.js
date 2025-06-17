import { BrowserMultiFormatReader } from "@zxing/browser"; 
import useBarcode from "../Stores/barcodeStore";

const setBarcode = useBarcode.getState().setBarcode;

const reader = new BrowserMultiFormatReader();
let readerInstance = null;

let videoElement = null;
let scanning = false;

/**
 * Get list of available video input devices (cameras)
 * @returns {Promise<MediaDeviceInfo[]>} List of available video devices
 */
export const getVideoDevices = async () => {
    try {
        await navigator.mediaDevices.getUserMedia({video:true})
        const devices = await navigator.mediaDevices.enumerateDevices();
        return devices.filter(device => device.kind === 'videoinput');
    } catch (error) {
        console.error('Error getting video devices:', error);
        throw error;
    }
};

/**
 * Start scanning for barcodes using the specified video device
 * @param {string} videoElementId - ID of the video element to use for scanning
 * @param {string} [deviceId] - Optional device ID of the camera to use
 * @returns {Promise<{stopScanning: Function}>} Object containing function to stop scanning
 */
export const startScanning = async (videoElementId, deviceId = null) => {
    if (scanning) {
        throw new Error('Scanning is already in progress');
    }

    try {
        videoElement = document.getElementById(videoElementId);
        if (!videoElement) {
            throw new Error('Video element not found');
        }

        scanning = true;
        
        // Start scanning with the specified device
        readerInstance = await reader.decodeFromVideoDevice(
            deviceId,
            videoElement,
            (result, error) => {
                if (result) {
                    // const barcodeEvent = new CustomEvent("barcode", {
                    //     detail: { barcode: result.getText() },
                    //     bubbles: true,
                    //     cancelable: true
                    // });
                    // document.dispatchEvent(barcodeEvent);
                    setBarcode(result.getText())
                    console.log('Barcode detected:', result.getText());
                }
                if (error && error.name !== 'NotFoundException') {
                    console.error('Error during scanning:', error);
                }
            }
        );

        return {
            stopScanning: () => stopScanning()
        };
    } catch (error) {
        scanning = false;
        console.error('Error starting barcode scanner:', error);
        throw error;
    }
};

/**
 * Stop the barcode scanning process
 */
export const stopScanning = () => {
    if (!scanning) return;

    try {
        readerInstance.stop();
        if (videoElement) {
            const stream = videoElement.srcObject;
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
            videoElement.srcObject = null;
        }
    } catch (error) {
        console.error('Error stopping scanner:', error);
    } finally {
        readerInstance = null;
        scanning = false;
        videoElement = null;
    }
};



