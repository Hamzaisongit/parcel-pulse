'use client'

import { createContext, useState } from "react";
import { useRef } from "react";

export const GlobalContext = createContext()

export const GlobalContextProvider = ({children})=>{
    const [loadingController, setLoadingController] = useState({
        show: false,
        text: 'Loading..'
    })

    const [scanning, setScanning] = useState(false);
    const [scanningController, setScanningController] = useState({show:false, text:''})
    const currentProcessingInfo = useRef({});
   

    return (
        <GlobalContext.Provider value={{loadingController, setLoadingController, scanningController, setScanningController, scanning, setScanning, currentProcessingInfo}}>
            {children}
        </GlobalContext.Provider>
    )
} 