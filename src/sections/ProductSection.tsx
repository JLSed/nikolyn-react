import { useState } from "react";
import { FaSearch } from "react-icons/fa";
import { BiSolidCartAdd } from "react-icons/bi";
import { ProductItemEntries } from "../types/inventory";
import { toast } from "react-hot-toast";

// Define a type for products in the order
export type OrderProduct = {
  entry_id: string;
  item_id: string;
  item_name: string;
  weight: string;
  price: number;
  quantity: number;
};

interface Props {
  products: ProductItemEntries[];
  setProducts: React.Dispatch<React.SetStateAction<ProductItemEntries[]>>;
  orderProducts: Record<string, OrderProduct>;
  setOrderProducts: React.Dispatch<
    React.SetStateAction<Record<string, OrderProduct>>
  >;
}

function ProductSection({
  products,
  setProducts,
  orderProducts,
  setOrderProducts,
}: Props) {
  const [searchTerm, setSearchTerm] = useState("");

  const groupedProducts = products.reduce((acc, product) => {
    const itemId = product.TBL_PRODUCT_ITEM.item_id;
    const itemQuanity = product.quantity || 0;

    if (!acc[itemId]) {
      acc[itemId] = {
        ...product,
        quantity: itemQuanity,
      };
    } else {
      acc[itemId].quantity += itemQuanity;
    }

    return acc;
  }, {} as Record<string, ProductItemEntries & { quantity: number }>);

  const productsWithQuantity = Object.values(groupedProducts);

  // Filter products based on the search term
  const filteredProducts = productsWithQuantity.filter((product) =>
    product.TBL_PRODUCT_ITEM.item_name
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  );

  // Limit the number of products to 5
  const limitedProducts = filteredProducts.slice(0, 5);

  // Handle adding a product to the order
  const addToOrder = (product: ProductItemEntries & { quantity: number }) => {
    if (product.quantity <= 0) {
      toast.error(`No more ${product.TBL_PRODUCT_ITEM.item_name} available`);
      return;
    }

    const itemId = product.TBL_PRODUCT_ITEM.item_id;

    // Update the products list by reducing the quantity
    setProducts((prevProducts) => {
      return prevProducts.map((p) => {
        if (
          p.TBL_PRODUCT_ITEM.item_id === itemId &&
          p.entry_id === product.entry_id
        ) {
          return {
            ...p,
            quantity: (p.quantity || 0) > 0 ? (p.quantity || 0) - 1 : 0,
          };
        }
        return p;
      });
    });

    // Add to order products
    setOrderProducts((prev) => {
      const existing = prev[itemId];

      return {
        ...prev,
        [itemId]: {
          entry_id: product.entry_id,
          item_id: itemId,
          item_name: product.TBL_PRODUCT_ITEM.item_name,
          weight: product.TBL_PRODUCT_ITEM.weight,
          price: product.TBL_PRODUCT_ITEM.price,
          quantity: existing ? existing.quantity + 1 : 1,
        },
      };
    });
  };

  return (
    <div className="bg-primary text-secondary rounded-tr-lg p-4 min-h-96">
      <p className="text-2xl font-bold text-accent">Products</p>
      <div className="relative flex text-primary mt-2">
        <FaSearch className="absolute left-2 text-primary h-full" />
        <input
          id="search_product"
          className="flex-1 mr-4 p-2 pl-8 border-2 border-primary bg-secondary rounded-xl rounded-tl-none rounded-bl-none"
          placeholder="Search Product..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <p className="text-secondary">Filter</p>
      </div>
      <table className="w-full">
        <thead className="text-left">
          <tr>
            <th className="p-2">Product Name</th>
            <th className="p-2">Quantity</th>
            <th className="p-2">Price</th>
          </tr>
        </thead>
        <tbody id="productBody" className="bg-primary text-secondary">
          {limitedProducts.length > 0 ? (
            limitedProducts.map((product) => (
              <tr
                key={product.entry_id}
                className="group hover:bg-secondary hover:text-primary transition-colors"
              >
                <td className="p-2 rounded-tl-xl rounded-bl-xl">
                  {product.TBL_PRODUCT_ITEM.item_name} (
                  {product.TBL_PRODUCT_ITEM.weight})
                </td>
                <td className="p-2">{product.quantity}</td>
                <td className="relative p-2 overflow-hidden">
                  ₱{product.TBL_PRODUCT_ITEM.price.toFixed(2)}
                  <button
                    className="absolute right-0 top-0 h-full flex justify-center items-center gap-4 px-4 rounded-tl-full rounded-bl-full bg-primary text-secondary transform translate-x-full group-hover:translate-x-0 transition-transform duration-300"
                    onClick={() => addToOrder(product)}
                    disabled={product.quantity <= 0}
                  >
                    <BiSolidCartAdd className="text-xl" />
                    Add
                  </button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={3} className="text-center p-2">
                No products found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export default ProductSection;
