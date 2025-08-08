import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const deliveryNote = searchParams.get('delivery_note');
    console.log(deliveryNote)
    // Use filters in the URL if deliveryNote is present
    let url = `${process.env.ERP_SITE}/api/v2/document/Packing Slip`;
    if (deliveryNote) {
      // Properly encode the filters and fields for the URL
      const filters = JSON.stringify([["Packing Slip", "delivery_note", "=", deliveryNote]]);
      const fields = JSON.stringify(["name", "from_case_no", "to_case_no"]);
      url += `?filters=${encodeURIComponent(filters)}&fields=${encodeURIComponent(fields)}`;
    }

    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'Cookie': request.headers.get('cookie')
      },
    });

    console.log(response)

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch packing slips' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json({ data: data.data });

  } catch (error) {
    console.error('Error fetching packing slips:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 