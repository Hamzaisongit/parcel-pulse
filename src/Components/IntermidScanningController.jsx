import { useContext } from "react"
import { GlobalContext } from "../Context/globalContext"
import { stopScanning } from "../services/barcodeReader";
import useBarcode from "../Stores/barcodeStore";

export default function IntermidScanningController() {
  
    const {scanningController, setScanningController, currentProcessingInfo, setScanning} = useContext(GlobalContext)
    const setBarcode = useBarcode(state => state.setBarcode)


    if(!scanningController.show) return;

    return (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50">
            <div className="bg-white rounded-lg shadow-lg p-4 border border-gray-200 min-w-[300px]">
                <div className="flex flex-col items-center gap-3">
                    <p className="text-gray-700 font-medium">{scanningController.text}</p>
                    <div className="flex gap-3">
                        <button
                            onClick={() => {
                                currentProcessingInfo.current.status = 'idle'
                                setBarcode('')
                                setScanningController({show:false})
                            }}
                            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
                        >
                            Continue Scanning
                        </button>
                        <button
                            onClick={() => {
                                currentProcessingInfo.current.status = 'idle'
                                setBarcode('')
                                setScanningController({show:false})
                                setScanning(false)
                                stopScanning()
                            }}
                            className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
                        >
                            Stop Scanning
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
} 