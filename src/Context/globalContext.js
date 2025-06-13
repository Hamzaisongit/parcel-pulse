'use client'

import { createContext, useState } from "react";

export const GlobalContext = createContext()

export const GlobalContextProvider = ({children})=>{
    const [loadingController, setLoadingController] = useState({
        show: false,
        text: 'Loading..'
    })

    return (
        <GlobalContext.Provider value={{loadingController, setLoadingController}}>
            {children}
        </GlobalContext.Provider>
    )
} 