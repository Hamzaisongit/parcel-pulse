# Parcel-pulse

## Reconsiliation logic may be if we need it anytime

      //fetch salesOrder sidelined from
      //getAll it's items and overwrite them with new value for the sidelined item
      //ie, chnage the value of sidelined item to zero

      //ftehc salesOrder to be sidelined for
      //get all it's items array
      //overwrite with new value
      //ie, take sidelinedItem's assembled quantity
      // assign it to a counter : reconsilable quantity
      // for all the matching sku items..

      // repeat the following :
      // check if it's assembly qty is same as pending assembly : qty - delivered
      // if not then add the remaining quantity to be assembled into assembled quantity 
      // & substract the added amount from reconsilable counter
      // keep doing it till either there's no more mathcin sku items
      // OR reconsilable quantity becomes zero