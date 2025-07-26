import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    console.log(request)
    const query = request.nextUrl.searchParams;
    let response;

    if(query.get('item_code')){
      const fetchFilters = `[["Sales Order Item","item_code","=",${`%22` + query.get('item_code') + `%22`}]]`
      const fields = `["name","items.item_code","items.custom_quantity_assembled","items.qty","items.custom_quantity_delivered","items.custom_quantity_packedbilled"]` 
      response = await fetch(`${process.env.ERP_SITE}/api/v2/document/Sales Order?filters=${fetchFilters}&fields=${fields}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Cookie': request.headers.get('cookie')
        }
      });
      //console.log(response)
    }else{
      response = await fetch(`${process.env.ERP_SITE}/api/v2/document/Sales Order`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Cookie': request.headers.get('cookie')
        }
      });
    }

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch sales orders' },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log(data)
    return NextResponse.json(data);

  } catch (error) {
    console.error('Error fetching sales orders:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 