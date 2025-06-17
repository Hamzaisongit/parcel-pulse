import { useContext } from "react"
import { GlobalContext } from "../Context/globalContext"
import { stopScanning } from "../services/barcodeReader";
import useBarcode from "../Stores/barcodeStore";
import { Ban, CircleCheck, OctagonAlert, } from "lucide-react";

export default function IntermidScanningController() {
  
    const {scanningController, setScanningController, currentProcessingInfo, setScanning} = useContext(GlobalContext)
    const setBarcode = useBarcode(state => state.setBarcode)


    if(!scanningController.show) return;

    return (
        <div className="fixed inset-0 z-50 flex flex-col">
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
                                setScanningController({show:false})
                            }}
                            className="px-3 py-2 text-xl font-bold bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
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
                            className="px-3 py-2 text-xl font-bold bg-gray-600 text-white rounded-md hover:bg-gray-500 transition-colors"
                        >
                            Stop Scanning
                        </button>
                    
                </div>
            </div>
        </div>
    );
} 