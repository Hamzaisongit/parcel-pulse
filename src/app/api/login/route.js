import { NextResponse } from 'next/server';

export async function POST(request) {
    const body = await request.json();
    
    const erpResponse = await fetch('https://mycompany404.erpnext.com/api/method/login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(body)
    });

    console.log(erpResponse)
    const data = await erpResponse.json();
    // Get the cookie from ERPNext response
    const cookieSplitArray = erpResponse.headers.get('set-cookie').split(',');
    
    // Create a new response with the data
    const response = new Response(JSON.stringify(data), {
        status: erpResponse.status,
        headers: {
            'Content-Type': 'application/json',
        },
    });

    if (cookieSplitArray) {
        // ⚠️ Important: Manually set attributes or the browser might ignore it
        response.headers.set(
            'Set-Cookie',
            process.env.NODE_ENV=='development' ? (cookieSplitArray[0] + ',' + cookieSplitArray[1]).replace('Secure;','') : (cookieSplitArray[0] + ',' + cookieSplitArray[1])
        );
    }

    console.log('actualCookie : ', cookieSplitArray[0] + ',' + cookieSplitArray[1])
    console.log('custom response', response)
    
    return response;
}
