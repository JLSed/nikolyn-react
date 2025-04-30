import React from 'react'

function ProductSection() {
  return (
          <div className="bg-primary text-secondary">
            <p className="text-4xl font-bold text-accent">Products</p>
            <div className="flex text-primary">
              <input
                id="search_product"
                className="flex-1 mr-4 p-1 border-2 border-primary bg-secondary"
                placeholder="Search Product..."
              />
              <p>Filter</p>
            </div>
            <table className="w-full">
              <thead className=" text-left">
                <tr>
                  <th className="p-2">Product Name</th>
                  <th className="p-2">Quantity</th>
                  <th className="p-2">Price</th>
                </tr>
              </thead>
              <tbody
                id="productBody"
                className="bg-primary text-secondary"
              ></tbody>
            </table>
          </div>
  )
}

export default ProductSection
