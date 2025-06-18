'use client';

import { useState, useEffect, useRef, useContext } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getselectedVideoDevices, getVideoDevices, reader, startScanning, stopScanning } from '../../../services/barcodeReader';
import { GlobalContext } from '../../../Context/globalContext';
import useBarcode from '../../../Stores/barcodeStore';
import IntermidScanningController from '../../../Components/IntermidScanningController';
import { ArrowLeft } from 'lucide-react';

export default function SalesOrderDetailPage() {
    // State variables
    const [salesOrder, setSalesOrder] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [barcodeInput, setBarcodeInput] = useState(''); // This is the barcode input
    const [selectedVideoDevice, setSelectedVideoDevice] = useState('')
    const [videoDevices, setVideoDevices] = useState([])
    // const [currentProcessingInfo, setcurrentProcessingInfo] = useState(''); // This is the barcode that is currently being processed

    const barcode = useBarcode((state) => state.barcode)
    const setBarcode = useBarcode((state) => state.setBarcode)

    // Get the sales order ID from the URL
    const params = useParams();
    const salesOrderId = params.soId;

    const router = useRouter()
    const { setLoadingController, currentProcessingInfo, setScanningController, scanning, setScanning } = useContext(GlobalContext)

    // Your ERPNext API token
    // const token = '708ce20d2f35906:f9a7dae3b071cc1';

    // Fetch sales order when component mounts
    useEffect(() => {
        fetchSalesOrder();
    }, [salesOrderId]);

    useEffect(() => {
        if (!barcode) return;
        handleUniqueBarcodeScans(barcode)
    }, [barcode])

    useEffect(() => {

    }, [])
    // useEffect(() => {
    //     document.addEventListener('barcode', handleUniqueBarcodeScans);
    //     return () => document.removeEventListener('barcode', handleUniqueBarcodeScans);
    // }, []);

    async function fetchSalesOrder() {
        try {
            setLoadingController({ show: true, text: 'Loading Sales Order..' })
            const response = await fetch(`/api/sales-orders/${salesOrderId}`, {
                credentials: 'include',
                headers: {
                    'Accept': 'application/json',
                },
            });
            if (!response.ok) {
                throw new Error('Failed to fetch sales order');
            }
            const data = await response.json();
            setSalesOrder(data.data);
        } catch (err) {
            setError('Failed to fetch sales order. Please try again.');
            console.error('Error:', err);
        } finally {
            setLoadingController({ show: false, text: 'Loading Sales Order..' })
            setLoading(false);
        }
    }

    // Handle barcode input
    function handleBarcodeChange(event) {
        setBarcodeInput((event.target.value).trim());
    }

    // Handle barcode submission
    async function handleBarcodeSubmit(barcodeValue) {

        console.log('here', barcodeValue, salesOrder)
        if (!barcodeValue || !salesOrder) return;

        try {
            setLoadingController({ show: true, text: 'Loading' })
            // Find all items with matching UPC/EAN
            console.log("salesOrder before update", salesOrder)
            const matchingItems = salesOrder.items.filter(item =>
                item.custom_upcean == String(barcodeValue).slice(0, 12) // just a hack to match the barcode
            );

            if (matchingItems.length === 0) {
                setScanningController({ show: true, text: `No matching Item found for the barcode!`, status: 'failure' })
                return;
            }

            // Check if all matching items are fully assembled
            const allFullyAssembled = matchingItems.every(item =>
                item.qty - item.custom_quantity_delivered - item.custom_quantity_assembled === 0
            );

            if (allFullyAssembled) {
                setScanningController({ show: true, text: `All items with this barcode are already assembled!`, status: 'alert' })
                return;
            }

            // Find the first item that needs assembly
            const itemToAssemble = matchingItems.find(item =>
                (item.custom_quantity_assembled || 0) < item.qty - item.custom_quantity_delivered
            );

            if (itemToAssemble) {
                // Increment assembled quantity
                const newAssembledQuantity = (itemToAssemble.custom_quantity_assembled || 0) + 1;

                // Update the item
                const updatedItems = salesOrder.items.map((i)=>{
                    if(i.name == itemToAssemble.name){
                        return {
                            ...i,
                            custom_quantity_assembled: newAssembledQuantity
                        }
                    }
                    
                    return i;
                })

                const updateResponse = await fetch(`/api/sales-orders/${salesOrder.name}`, {
                    method: 'PUT',
                    credentials: 'include',
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        items: updatedItems
                    })
                });

                if (!updateResponse.ok) {
                    throw new Error('Failed to update assembly quantity');
                }

                // Refresh the sales order
                // await fetchSalesOrder();

                setSalesOrder(p => {
                    const newItems = p.items.map(item => {
                        if (item.name === itemToAssemble.name) {
                            return {
                                ...item,
                                custom_quantity_assembled: newAssembledQuantity
                            };
                        }
                        return item;
                    });

                    return { ...p, items: newItems };
                })
                // Show success message
                setScanningController({ show: true, text: `Successfully assembled ${itemToAssemble.item_code}`, status: 'success' })
            }

            // // Clear barcode
            // setBarcode('');


        } catch (err) {
            console.error('Error processing barcode:', err);
            setScanningController({ show: true, text: `Failed to Process`, status: 'failure' })
        } finally {

            // currentProcessingInfo.current.status = 'idle'
            setLoadingController({ show: false, text: 'Loading' })
            // setBarcode('')
        }
    }

    // Toggle scanning mode
    const toggleScanning = () => {
        if (!selectedVideoDevice) {
            alert('Please select a Video Device')
            return;
        }
        setScanning(!scanning);
        setBarcode('');

        if (scanning) {
            currentProcessingInfo.current.status = 'idle'
            stopScanning();
        } else {
            //reader.start();
            startScanning('videoElement', selectedVideoDevice);
        }


    }

    function handleUniqueBarcodeScans(barcodeValue) {
        console.log('got itt:', barcodeValue, 'currentProcessingInfo:', currentProcessingInfo.current);
        if (!barcodeValue || currentProcessingInfo.current.status === 'processing' || !salesOrder) {
            return;
        }
        currentProcessingInfo.current.barcodeValue = barcodeValue;
        currentProcessingInfo.current.status = 'processing';
        handleBarcodeSubmit(barcodeValue);
    }

    // Show loading state
    // if (loading) {
    //     return <div className="loading">Loading sales order...</div>;
    // }

    // // Show error state
    // if (error) {
    //     return <div className="error">{error}</div>;
    // }

    // Show error if sales order is not found
    if (!salesOrder && !loading) {
        return <div className="error">Sales order not found</div>;
    }

    return (
        <div className="max-w-6xl mx-auto px-4 py-8">
            <ArrowLeft size={30} className='mb-2 rounded-md active:bg-gray-300' onClick={() => router.push('/assembly')}></ArrowLeft>
            <h1 className="text-2xl font-bold mb-2">Sales Order Items - {salesOrder.name}</h1>
            <p className="text-gray-600 mb-6">Customer: {salesOrder.customer}</p>
            <div className="header flex flex-col gap-5 mb-5">

                {/* Camera Screen */}
                {
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

                    </div>}


                {/* Barcode scanning section */}
                <div className="barcode-section bg-white p-6 rounded-lg shadow-md mb-8">
                    {/* <h2 className="text-xl font-semibold mb-4">Barcode Scanning</h2> */}
                    <div className="flex flex-col gap-2">
                        <div className="flex flex-col gap-4">

                            <select
                                id='videoSelect'
                                onClick={(event) => {
                                    event.preventDefault()
                                    if (videoDevices.length) return;
                                    
                                    getVideoDevices().then(devices => {
                                        console.log(devices)
                                        setVideoDevices(devices)
                                    }
                                    ).catch((e) => {
                                        alert('Camera Permission is required!')
                                        console.log('error while getting video devices', e)
                                    })
                                }}
                                onChange={(e) => {
                                    setSelectedVideoDevice(e.target.value)
                                }}
                                className="px-4 py-2 text-xl border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                            >
                                <option value={""}>Selected Video-Default</option>
                                {videoDevices.map((device) => {
                                    return <option key={device.deviceId} value={device.deviceId}>
                                        {device.label}
                                    </option>
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
            </div>


            <div className="overflow-x-auto">
                <p className="text-gray-600 mb-2">Order Items:</p>
                <table className="w-full border-collapse">
                    <thead>
                        <tr className="bg-gray-50">
                            <th className="px-4 py-3 text-left border-b">SKU ID</th>
                            <th className="px-4 py-3 text-left border-b">Assembled Quantity</th>
                            <th className="px-4 py-3 text-left border-b">Pending Quantity</th>
                        </tr>
                    </thead>
                    <tbody>
                        {salesOrder?.items?.map(item => (
                            <tr key={item.name} className={`${item.qty - item.custom_quantity_delivered == item.custom_quantity_assembled ? 'bg-green-300' : ''}`}>
                                <td className="px-4 py-3 border-b">{item.item_code || '-'}</td>
                                <td className="px-4 py-3 border-b">{item.custom_quantity_assembled || 0}</td>
                                <td className="px-4 py-3 border-b">{item.qty - item.custom_quantity_delivered - item.custom_quantity_assembled}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <IntermidScanningController></IntermidScanningController>
        </div>
    );
} 