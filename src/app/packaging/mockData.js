export const mockDeliveryNotes = [
    {
        name: "DN-2024-001",
        customer: "ABC Company Ltd",
        posting_date: "2024-01-15",
        items: [
            {
                item_name: "Product A",
                item_code: "SKU-01",
                packed_qty: 0,
                total_req_qty: 25,
                barcode: "112345678901"
            },
            {
                item_name: "Product B",
                item_code: "SKU-02",
                packed_qty: 0,
                total_req_qty: 30,
                barcode: "112345678902"
            },
            {
                item_name: "Product C",
                item_code: "SKU-03",
                packed_qty: 0,
                total_req_qty: 20,
                barcode: "112345678903"
            }
        ],
        packing_slips: []
    },
    {
        name: "DN-2024-002",
        customer: "XYZ Corporation",
        posting_date: "2024-01-16",
        items: [
            {
                item_name: "Product D",
                item_code: "SKU-04",
                packed_qty: 0,
                total_req_qty: 15,
                barcode: "112345678904"
            },
            {
                item_name: "Product E",
                item_code: "SKU-05",
                packed_qty: 0,
                total_req_qty: 22,
                barcode: "112345678905"
            }
        ],
        packing_slips: []
    },
    {
        name: "DN-2024-003",
        customer: "DEF Industries",
        posting_date: "2024-01-17",
        items: [
            {
                item_name: "Product F",
                item_code: "SKU-06",
                packed_qty: 0,
                total_req_qty: 18,
                barcode: "112345678906"
            },
            {
                item_name: "Product G",
                item_code: "SKU-07",
                packed_qty: 0,
                total_req_qty: 12,
                barcode: "112345678907"
            },
            {
                item_name: "Product H",
                item_code: "SKU-08",
                packed_qty: 0,
                total_req_qty: 28,
                barcode: "112345678908"
            },
            {
                item_name: "Product I",
                item_code: "SKU-09",
                packed_qty: 0,
                total_req_qty: 35,
                barcode: "112345678909"
            }
        ],
        packing_slips: []
    },
    {
        name: "DN-2024-004",
        customer: "GHI Solutions",
        posting_date: "2024-01-18",
        items: [
            {
                item_name: "Product J",
                item_code: "SKU-10",
                packed_qty: 0,
                total_req_qty: 40,
                barcode: "112345678910"
            }
        ],
        packing_slips: []
    },
    {
        name: "DN-2024-005",
        customer: "JKL Enterprises",
        posting_date: "2024-01-19",
        items: [
            {
                item_name: "Product K",
                item_code: "SKU-11",
                packed_qty: 0,
                total_req_qty: 16,
                barcode: "112345678911"
            },
            {
                item_name: "Product L",
                item_code: "SKU-12",
                packed_qty: 0,
                total_req_qty: 24,
                barcode: "112345678912"
            },
            {
                item_name: "Product M",
                item_code: "SKU-13",
                packed_qty: 0,
                total_req_qty: 19,
                barcode: "112345678913"
            }
        ],
        packing_slips: []
    }
];

// Helper function to calculate packed quantity for items based on packing slips
export function calculatePackedQuantity(deliveryNote) {
    const updatedDeliveryNote = { ...deliveryNote };
    
    updatedDeliveryNote.items = updatedDeliveryNote.items.map(item => {
        let totalPacked = 0;
        
        // Sum up packed quantities from all packing slips
        deliveryNote.packing_slips.forEach(slip => {
            // Match by item_name for consistency with packing slip structure
            const slipItem = slip.items.find(slipItem => slipItem.item_name === item.item_name);
            if (slipItem) {
                totalPacked += slipItem.packed_qty || 0;
            }
        });
        
        return {
            ...item,
            packed_qty: totalPacked
        };
    });
    
    return updatedDeliveryNote;
}

// Helper function to get remaining quantity for an item
export function getRemainingQuantity(item) {
    return Math.max(0, item.total_req_qty - item.packed_qty);
}
