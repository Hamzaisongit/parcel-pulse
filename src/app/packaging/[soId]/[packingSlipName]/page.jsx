"use client";

import { useState, useEffect, useContext } from "react";
import { useParams } from "next/navigation";
import { getVideoDevices, startScanning, stopScanning } from '../../../../services/barcodeReader';
import { GlobalContext } from '../../../../Context/globalContext';
import useBarcode from '../../../../Stores/barcodeStore';
import IntermidScanningController from '../../../../Components/IntermidScanningController';
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function PackingSlipDetailPage() {
  const params = useParams();
  const deliveryNoteId = params.soId;
  const packingSlipName = params.packingSlipName;
  const [packingSlip, setPackingSlip] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [barcodeInput, setBarcodeInput] = useState("");
  const [selectedVideoDevice, setSelectedVideoDevice] = useState("");
  const [videoDevices, setVideoDevices] = useState([]);
  const [localItems, setLocalItems] = useState([]); // for packed_qty
  const barcode = useBarcode((state) => state.barcode);
  const setBarcode = useBarcode((state) => state.setBarcode);
  const { setLoadingController, currentProcessingInfo, setScanningController, scanning, setScanning } = useContext(GlobalContext);

  useEffect(() => {
    async function fetchPackingSlip() {
      try {
        setLoadingController({ show: true, text: 'Loading Packing Slip...' });
        const response = await fetch(`/api/packing-slips/${packingSlipName}`);
        if (!response.ok) {
          throw new Error('Failed to fetch packing slip');
        }
        const data = await response.json();
        setPackingSlip(data.data);
        // Use qty as packed quantity, custom_maximum_req_quantity as max required
        setLocalItems(data.data.items.map(item => ({ ...item })));
      } catch (err) {
        setError('Failed to fetch packing slip. Please try again.');
      } finally {
        setLoadingController({ show: false, text: 'Loading Packing Slip...' });
        setLoading(false);
      }
    }
    fetchPackingSlip();
  }, [packingSlipName, setLoadingController]);

  useEffect(() => {
    if (!barcode) return;
    handleUniqueBarcodeScans(barcode);
  }, [barcode]);

  function handleBarcodeChange(event) {
    setBarcodeInput((event.target.value).trim());
  }

  async function handleBarcodeSubmit(barcodeValue) {
    if (!barcodeValue || !packingSlip) return;
    try {
      setLoadingController({ show: true, text: 'Processing barcode...' });
      // Find all items with matching item_code (simulate barcode match)
      const matchingItems = localItems.filter(item =>
        item.item_code == String(barcodeValue).slice(0, 12)
      );
      if (matchingItems.length === 0) {
        setScanningController({ show: true, text: `No matching Item found for the barcode!`, status: 'failure' });
        return;
      }
      // Check if all matching items are fully packed
      const allFullyPacked = matchingItems.every(item =>
        (item.qty || 0) >= item.custom_maximum_req_quantity
      );
      if (allFullyPacked) {
        setScanningController({ show: true, text: `All items with this barcode are already packed!`, status: 'alert' });
        return;
      }
      // Find the first item that needs packing
      const itemToPack = matchingItems.find(item =>
        (item.qty || 0) < item.custom_maximum_req_quantity
      );
      if (itemToPack) {
        const newQty = (itemToPack.qty || 0) + 1;
        // Update local state
        setLocalItems(items => items.map(i =>
          i.item_code === itemToPack.item_code ? { ...i, qty: newQty } : i
        ));
        setScanningController({ show: true, text: `Successfully packed ${itemToPack.item_code}`, status: 'success' });
        // Optionally, update the backend here
      }
    } catch (err) {
      setScanningController({ show: true, text: `Failed to Process`, status: 'failure' });
    } finally {
      setLoadingController({ show: false, text: 'Processing barcode...' });
    }
  }

  const toggleScanning = () => {
    if (!selectedVideoDevice) {
      alert('Please select a Video Device');
      return;
    }
    setScanning(!scanning);
    setBarcode("");
    if (scanning) {
      currentProcessingInfo.current.status = 'idle';
      stopScanning();
    } else {
      startScanning('videoElement', selectedVideoDevice);
    }
  };

  function handleUniqueBarcodeScans(barcodeValue) {
    if (!barcodeValue || currentProcessingInfo.current.status === 'processing' || !packingSlip) {
      return;
    }
    currentProcessingInfo.current.barcodeValue = barcodeValue;
    currentProcessingInfo.current.status = 'processing';
    handleBarcodeSubmit(barcodeValue);
  }

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
        <div className="mb-2">From Case No: <span className="font-semibold">{packingSlip.from_case_no}</span></div>
        <div className="mb-2">To Case No: <span className="font-semibold">{packingSlip.to_case_no}</span></div>
      </div>
      {/* Camera Screen */}
      <div className={`${scanning ? '' : 'hidden'} overflow-scroll fixed inset-0 flex flex-col items-center justify-center gap-10 bg-gray-50`}>
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
              onClick={() => { handleBarcodeSubmit(barcodeInput) }}
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
      {/* Barcode scanning section */}
      <div className="barcode-section bg-white p-6 rounded-lg shadow-md mb-8">
        <div className="flex flex-col gap-2">
          <div className="flex flex-col gap-4">
            <select
              id='videoSelect'
              onClick={(event) => {
                event.preventDefault();
                if (videoDevices.length) return;
                getVideoDevices().then(devices => {
                  setVideoDevices(devices)
                }).catch((e) => {
                  alert('Camera Permission is required!')
                })
              }}
              onChange={(e) => {
                setSelectedVideoDevice(e.target.value)
              }}
              className="px-4 py-2 text-xl border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value={""}>Selected Video-Default</option>
              {videoDevices.map((device) => {
                return <option key={device.deviceId} value={device.deviceId}>{device.label}</option>
              })}
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
      <div className="overflow-x-auto">
        <p className="text-gray-600 mb-2">Items in Packing Slip:</p>
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-50">
              <th className="px-4 py-3 text-left border-b">Item Code</th>
              <th className="px-4 py-3 text-left border-b">Packed Qty</th>
            </tr>
          </thead>
          <tbody>
            {localItems.map((item, idx) => (
              <tr key={idx} > 
                <td className="px-4 py-3 border-b">{item.item_code}</td>
                <td className="px-4 py-3 border-b">{item.qty}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <IntermidScanningController isPackaging={true} />
    </div>
  );
} 