'use client'

import Link from "next/link"

export default function Page() {
    return (
        <div className="flex flex-col bg-amber-300 justify-center min-h-[100vh] mx-auto">
            <div className="flex-1 bg-blue-50 rounded-lg shadow p-8 flex flex-col justify-center items-center">
                <h2 className="text-2xl font-semibold mb-4 text-blue-800">Assembly Section</h2>
                <Link
                    href="/assembly"
                    className="px-5 py-2 bg-blue-200 text-blue-900 rounded hover:bg-blue-300 transition-colors font-medium"
                >
                    Go to Assembly
                </Link>
            </div>
            <div className="flex-1 bg-green-50 rounded-lg shadow p-8 flex flex-col justify-center items-center">
                <h2 className="text-2xl font-semibold mb-4 text-green-800">Packaging Section</h2>
                <Link
                    href="/packaging"
                    className="px-5 py-2 bg-green-200 text-green-900 rounded hover:bg-green-300 transition-colors font-medium"
                >
                    Go to Packaging
                </Link>
            </div>
        </div>
    )
}