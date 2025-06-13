import { create } from "zustand";

const barcodeStore = (set) => ({
     barcode : '',
     setBarcode : (barcode)=>{
        console.log('setting barcode..')
        set(()=>({
            barcode: barcode
        }))
     }
})

const useBarcode = create(barcodeStore)

export default useBarcode;