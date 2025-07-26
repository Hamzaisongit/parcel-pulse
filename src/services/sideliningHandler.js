
export const sideliningHandler = async (sidelinedItem, salesOrderSidelinedFrom) => {
      // Get all sales order's items and overwrite them with new value for the sidelined item
      // i.e., change the value of sidelined item's custom_quantity_assembled to zero
      // Write this value to this sales order using the PUT method API route handler

      // Clone the items array and set the sidelined item's assembled quantity to zero
      const updatedItems = salesOrderSidelinedFrom.items.map(item => {
        if (item.name === sidelinedItem.name) {
          return {
            ...item,
            custom_quantity_assembled: item.custom_quantity_packedbilled - 1,
            custom_quantity_packedbilled: item.custom_quantity_packedbilled - 1
          };
        }
        return item;
      });

      // Send the updated items array to the backend using PUT
      const response = await fetch(`/api/sales-orders/${salesOrderSidelinedFrom.name}`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          items: updatedItems
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update sidelined item in sales order');
      }

      return;
    }