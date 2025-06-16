'use client'

import React, { useContext } from 'react';
import { GlobalContext } from '../Context/globalContext';


const Loading = () => {
    const {loadingController} = useContext(GlobalContext)
    
    if (!loadingController.show) return null;
    
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/40"></div>
            <div className="relative bg-white p-4 rounded shadow-md">
                <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mb-2"></div>
                <p className="text-sm">{loadingController.text}</p>
            </div>
        </div>
    );
};

export default Loading;