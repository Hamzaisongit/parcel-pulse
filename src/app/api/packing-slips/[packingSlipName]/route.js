import { NextResponse } from 'next/server';

export async function GET(request, { params }) {
  const { packingSlipName } = params;
  try {
    const response = await fetch(`${process.env.ERP_SITE}/api/v2/document/Packing Slip/${packingSlipName}`, {
      headers: {
        'Accept': 'application/json',
        'Cookie': request.headers.get('cookie')
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch packing slip' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);

  } catch (error) {
    console.error('Error fetching packing slip:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 