import { useContext, useState } from "react"
import { GlobalContext } from "../Context/globalContext"
import { stopScanning } from "../services/barcodeReader";
import useBarcode from "../Stores/barcodeStore";
import { sideliningHandler } from "../services/sideliningHandler";
import { Ban, CircleCheck, OctagonAlert, } from "lucide-react";
import { useRouter } from "next/navigation";

export default function IntermidScanningController({ sales_order, scanned_item, isPackaging, setSalesOrder }) {

    const { scanningController, setScanningController, currentProcessingInfo, setScanning } = useContext(GlobalContext)
    const [salesOrdersHavingSameItem, setSalesOrdersHavingSameItems] = useState([])
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const setBarcode = useBarcode(state => state.setBarcode)

    const router = useRouter()

    if (!scanningController.show) return;

    return (
        <div className="fixed inset-0 z-50 flex flex-col">
            <div className={`${(scanningController.status != 'success' || !isPackaging) ? 'hidden' : ''} fixed top-0 left-0 w-full flex flex-col items-center justify-between z-50`}>
                {/* Dropdown bar, only visible when open */}
                {isDropdownOpen && (
                    <div
                        className="flex flex-row items-center overflow-x-auto overflow-y-hidden space-x-2 p-2 bg-white rounded-md shadow-md min-h-[56px] max-h-[56px] transition-all duration-300 w-full"
                        style={{ minWidth: 300, maxWidth: 500, height: 56 }}
                    >
                        {salesOrdersHavingSameItem.length === 0 ? (
                            <div className="flex justify-center items-center w-full h-full">
                                {/* Loading spinner */}
                                <svg className="animate-spin h-6 w-6 text-blue-500" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                                </svg>
                            </div>
                        ) : (
                            [...(new Set(salesOrdersHavingSameItem.map(i => i.name)))].map((salesOrder, i) => (
                                <span
                                    key={i}
                                    className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full font-semibold shadow-sm border border-blue-200 whitespace-nowrap"
                                >
                                    {salesOrder}
                                </span>
                            ))
                        )}
                    </div>
                )}
                {/* Toggle button below the bar */}
                <button
                    className="flex items-center justify-center mt-1 bg-white rounded-full shadow p-1 hover:bg-blue-100 transition-colors"
                    style={{ height: 24, width: 32 }}
                    onClick={async () => {
                        if (isDropdownOpen) {
                            setIsDropdownOpen(false);
                            return;
                        }
                        if (!scanned_item?.item_code) return;
                        setIsDropdownOpen(true);
                        setSalesOrdersHavingSameItems([]); // Show spinner
                        try {
                            const response = await fetch(`/api/sales-orders?item_code=${scanned_item.item_code}`, {
                                credentials: 'include',
                                headers: {
                                    'Accept': 'application/json',
                                },
                            });
                            if (!response.ok) {
                                setSalesOrdersHavingSameItems([]);
                                return;
                            }
                            const data = await response.json();
                            setSalesOrdersHavingSameItems(data.data || []);
                        } catch (e) {
                            setSalesOrdersHavingSameItems([]);
                        }
                    }}
                    title={isDropdownOpen ? "Hide sales orders with this item" : "Show sales orders with this item"}
                >
                    {/* Downward chevron SVG, rotate if open */}
                    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" style={{ transform: isDropdownOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
                        <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </button>
            </div>

            <div className={`flex-grow flex flex-col gap-5 items-center justify-center ${scanningController.status == 'success' ? 'bg-green-400' : (scanningController.status == 'alert' ? 'bg-green-400' : 'bg-red-400')} rounded-lg shadow-lg p-4 border border-gray-200 min-w-[300px]`}>

                {scanningController.status == 'success' && <span><CircleCheck size={50} stroke="white" strokeWidth={2}></CircleCheck></span>}
                {scanningController.status == 'failure' && <span><Ban size={50} stroke="white" strokeWidth={2}></Ban></span>}
                {scanningController.status == 'alert' && <span><OctagonAlert size={50} stroke="white" strokeWidth={2}></OctagonAlert></span>}

                <p className="text-white text-center text-2xl font-bold">{scanningController.text}</p>
                <div className="flex gap-3">
                    <button
                        onClick={() => {
                            currentProcessingInfo.current.status = 'idle'
                            setBarcode('')
                            setScanningController({ show: false })
                        }}
                        className="px-3 py-2 text-xl font-bold bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
                    >
                        Continue Scanning
                    </button>
                    <button
                        onClick={() => {
                            currentProcessingInfo.current.status = 'idle'
                            setBarcode('')
                            setScanningController({ show: false })
                            setScanning(false)
                            stopScanning()
                        }}
                        className="px-3 py-2 text-xl font-bold bg-gray-600 text-white rounded-md hover:bg-gray-500 transition-colors"
                    >
                        Stop Scanning
                    </button>

                </div>

            </div>

            <div className={`absolute bottom-12 w-full flex justify-center ${(scanningController.status != 'success' || !isPackaging) ? 'hidden' : ''}`}>
                <button
                    onClick={() => {
                        sideliningHandler(scanned_item, sales_order).then(() => {
                            currentProcessingInfo.current.status = 'idle'
                            setBarcode('')
                            setScanningController({ show: false })
                            setScanning(false)
                            stopScanning()

                            setSalesOrder(p => {
                                const updatedItems = p.items.map(item => {
                                    if (item.name === scanned_item.name) {
                                        return {
                                            ...item,
                                            custom_quantity_assembled: item.custom_quantity_packedbilled - 1,
                                            custom_quantity_packedbilled: item.custom_quantity_packedbilled - 1
                                        };
                                    }
                                    return item;
                                });
                                return {
                                    ...p,
                                    items: updatedItems
                                }
                            })

                        }).catch(() => {
                            alert('something went wrong while sidelining!')
                        })
                    }}
                    className="px-4 py-1 text-2xs font-bold bg-orange-400 text-white rounded-md hover:bg-orange-500 transition-colors shadow-md"
                >
                    Sideline
                </button>
            </div>
        </div>
    );
} 