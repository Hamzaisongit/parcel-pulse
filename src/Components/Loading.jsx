'use client'

import React, { useContext } from 'react';
import { GlobalContext } from '../Context/globalContext';


const Loading = () => {
    const {loadingController} = useContext(GlobalContext)
    
    if (!loadingController.show) return null;
    
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/40"></div>
            <div className="relative flex flex-col items-center justify-center gap-3 bg-white px-4 py-5 rounded shadow-md">
                <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-2"></div>
                <p className="text-xl text-center">{loadingController.text}</p>
            </div>
        </div>
    );
};

export default Loading;