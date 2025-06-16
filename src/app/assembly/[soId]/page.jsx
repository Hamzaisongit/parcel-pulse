'use client';

import { useState, useEffect, useRef, useContext } from 'react';
import { useParams } from 'next/navigation';
import apiService from '../../../services/api';
import { getselectedVideoDevices, getVideoDevices, reader, startScanning, stopScanning } from '../../../services/barcodeReader';
import { GlobalContext } from '../../../Context/globalContext';
import useBarcode from '../../../Stores/barcodeStore';
import IntermidScanningController from '../../../Components/IntermidScanningController';

export default function SalesOrderDetailPage() {
    // State variables
    const [salesOrder, setSalesOrder] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [barcodeInput, setBarcodeInput] = useState(''); // This is the barcode input
    const [selectedVideoDevice, setSelectedVideoDevice] = useState('')
    const [videoDevices, setVideoDevices] = useState([])
    // const [currentProcessingInfo, setcurrentProcessingInfo] = useState(''); // This is the barcode that is currently being processed
   
    const barcode = useBarcode((state)=> state.barcode)
    const setBarcode = useBarcode((state)=> state.setBarcode)

    // Get the sales order ID from the URL
    const params = useParams();
    const salesOrderId = params.soId;

    const {setLoadingController, currentProcessingInfo, setScanningController, scanning, setScanning} = useContext(GlobalContext)

    // Your ERPNext API token
    // const token = '708ce20d2f35906:f9a7dae3b071cc1';

    // Fetch sales order when component mounts
    useEffect(() => {
        fetchSalesOrder();
    }, [salesOrderId]);

    useEffect(()=>{
        if(!barcode) return;
        handleUniqueBarcodeScans(barcode)
    }, [barcode])

    useEffect(()=>{
        getVideoDevices().then(devices => {
            console.log(devices)
            setVideoDevices(devices)}
        ); 
    },[])
    // useEffect(() => {
    //     document.addEventListener('barcode', handleUniqueBarcodeScans);
    //     return () => document.removeEventListener('barcode', handleUniqueBarcodeScans);
    // }, []);

    async function fetchSalesOrder() {
        try {
            const order = await apiService.getSalesOrder(salesOrderId);
            setSalesOrder(order);
            setLoading(false);
        } catch (err) {
            setError('Failed to fetch sales order. Please try again.');
            setLoading(false);
            console.error('Error:', err);
        }
    }

    // Handle barcode input
    function handleBarcodeChange(event) {
        setBarcodeInput((event.target.value).trim());
    }

    // Handle barcode submission
    async function handleBarcodeSubmit(barcodeValue) { 

        console.log('here',barcodeValue, salesOrder)
        if (!barcodeValue || !salesOrder) return;

        try {
            setLoadingController({show:true, text:'Loading'})
            // Find all items with matching UPC/EAN
            console.log("salesOrder before update", salesOrder)
            const matchingItems = salesOrder.items.filter(item => 
                item.custom_upcean == String(barcodeValue).slice(0, 12) // just a hack to match the barcode
            );

            if (matchingItems.length === 0) {
                setScanningController({show:true, text: `No matching Item found for this item!`})
                return;
            }

            // Check if all matching items are fully assembled
            const allFullyAssembled = matchingItems.every(item => 
                item.qty - item.custom_quantity_assembled === 0
            );

            if (allFullyAssembled) {
                setScanningController({show:true, text: `All items with this barcode are already assembled!`})
                return;
            }

            // Find the first item that needs assembly
            const itemToAssemble = matchingItems.find(item => 
                (item.custom_quantity_assembled || 0) < item.qty
            );

            console.log('Current assembled quantity:', itemToAssemble?.custom_quantity_assembled);

            if (itemToAssemble) {
                // Increment assembled quantity
                const newAssembledQuantity = (itemToAssemble.custom_quantity_assembled || 0) + 1;
                
                // Update the item
                await apiService.updateAssemblyQuantity(
                    salesOrder,
                    itemToAssemble.name,
                    newAssembledQuantity
                );

                // // Refresh the sales order
                await fetchSalesOrder();
                
                setSalesOrder(p=>{
                    const newItems = p.items.map(item=>{
                        if(item.name === itemToAssemble.name){
                            return {
                                ...item, 
                                custom_quantity_assembled: newAssembledQuantity
                            };
                        }
                        return item;
                    });
                   
                    return {...p, items: newItems};
                })
                // Show success message
                setScanningController({show:true, text: `Successfully assembled ${itemToAssemble.item_code}`})
            }

            // // Clear barcode
            // setBarcode('');
            

        } catch (err) {
            console.error('Error processing barcode:', err);
            setScanningController({show:true, text: `Failed to Process`})
        } finally {

            // currentProcessingInfo.current.status = 'idle'
            setLoadingController({show:false, text:'Loading'})
            // setBarcode('')
        }
    }

    // Toggle scanning mode
    const toggleScanning = () => {
        if(scanning){
            currentProcessingInfo.current.status = 'idle'
            stopScanning();
        }else{
            //reader.start();
            if(!selectedVideoDevice){
                startScanning('videoElement', videoDevices[0].deviceId);
            }else{
                startScanning('videoElement', selectedVideoDevice);
            }
        }
        setScanning(!scanning);
        setBarcode('');
    }

    function handleUniqueBarcodeScans(barcodeValue){
        console.log('got itt:', barcodeValue, 'currentProcessingInfo:', currentProcessingInfo.current);
        if(!barcodeValue || currentProcessingInfo.current.status === 'processing' || !salesOrder) {
            return;
        }
        currentProcessingInfo.current.barcodeValue = barcodeValue;
        currentProcessingInfo.current.status = 'processing';
        handleBarcodeSubmit(barcodeValue);
    }

    // Show loading state
    if (loading) {
        return <div className="loading">Loading sales order...</div>;
    }

    // Show error state
    if (error) {
        return <div className="error">{error}</div>;
    }

    // Show error if sales order is not found
    if (!salesOrder) {
        return <div className="error">Sales order not found</div>;
    }

    console.log("updated state", salesOrder)

    return (
        <div className="max-w-6xl mx-auto px-4 py-8">
            <div className="header mb-8">
                <h1 className="text-2xl font-bold mb-2">Sales Order Items - {salesOrder.name}</h1>
                <p className="text-gray-600 mb-6">Customer: {salesOrder.customer}</p>
                
                <div className="mb-6">
                    <video id="videoElement" className="w-64 h-48 object-cover rounded-lg shadow-md"></video>
                </div>

                {/* Barcode scanning section */}
                <div className="barcode-section bg-white p-6 rounded-lg shadow-md mb-8">
                    <h2 className="text-xl font-semibold mb-4">Barcode Scanning</h2>
                    <div className="flex flex-col sm:flex-row gap-4">
                        <input
                            type="text"
                            value={barcodeInput}
                            onChange={handleBarcodeChange}
                            placeholder="Scan or enter barcode"
                            className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            disabled={!scanning}
                        />
                        <div className="flex gap-2">
                            <button 
                                type="button" 
                                onClick={toggleScanning}
                                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
                            >
                                {scanning ? 'Stop Scanning' : 'Start Scanning'}
                            </button>
                            {!scanning && (
                                <select 
                                    id='videoSelect'
                                    onChange={(e)=>{
                                       setSelectedVideoDevice(e.target.value)
                                    }}
                                    className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                                >
                                    <option value={""}>Selected Video-Default</option>
                                    {videoDevices.map((device)=>{
                                        return <option key={device.deviceId} value={device.deviceId}>
                                            {device.label}
                                        </option>
                                    })}
                                </select>
                            )}
                            {scanning && (
                                <button 
                                    onClick={()=>{handleBarcodeSubmit(barcodeInput)}}
                                    className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors"
                                >
                                    Process
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                    <thead>
                        <tr className="bg-gray-50">
                            <th className="px-4 py-3 text-left border-b">Hash Value</th>
                            <th className="px-4 py-3 text-left border-b">Item Name</th>
                            <th className="px-4 py-3 text-left border-b">SKU ID</th>
                            <th className="px-4 py-3 text-left border-b">UPC/EAN</th>
                            <th className="px-4 py-3 text-left border-b">Assembled Quantity</th>
                            <th className="px-4 py-3 text-left border-b">Pending Quantity</th>
                        </tr>
                    </thead>
                    <tbody>
                        {salesOrder.items.map(item => (
                            <tr key={item.name} className="hover:bg-gray-50">
                                <td className="px-4 py-3 border-b">{item.name || '-'}</td>
                                <td className="px-4 py-3 border-b">{item.item_name}</td>
                                <td className="px-4 py-3 border-b">{item.item_code || '-'}</td>
                                <td className="px-4 py-3 border-b">{item.custom_upcean || '-'}</td>
                                <td className="px-4 py-3 border-b">{item.custom_quantity_assembled || 0}</td>
                                <td className="px-4 py-3 border-b">{item.qty - item.custom_quantity_assembled}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <IntermidScanningController></IntermidScanningController>
        </div>
    );
} 