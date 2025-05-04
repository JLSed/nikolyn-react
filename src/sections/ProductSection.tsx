import { useEffect, useState } from "react";
import { FaSearch } from "react-icons/fa";
import { getAllProducts } from "../lib/supabase";
import { BiSolidCartAdd } from "react-icons/bi";
import { ProductItemEntries } from "../types/inventory";

function ProductSection() {
  const [products, setProducts] = useState<ProductItemEntries[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const fetchProducts = async () => {
      const result = await getAllProducts();
      if (result.success) {
        setProducts(result.data || []);
      }
    };
    fetchProducts();
  }, []);

  // Filter products based on the search term
  const filteredProducts = products.filter((product) =>
    product.TBL_PRODUCT_ITEM.item_name
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  );

  // Limit the number of products displayed to 5
  const limitedProducts = filteredProducts.slice(0, 5);

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
                className="group hover:bg-secondary  hover:text-primary transition-colors"
              >
                <td className="p-2 rounded-tl-xl rounded-bl-xl">
                  {product.TBL_PRODUCT_ITEM.item_name} (
                  {product.TBL_PRODUCT_ITEM.weight})
                </td>
                <td className="p-2">1</td>{" "}
                {/* Assuming quantity is 1 per entry */}
                <td className="relative p-2 overflow-hidden">
                  ₱{product.TBL_PRODUCT_ITEM.price}
                  <div className="absolute right-0 top-0 h-full cursor-pointer flex justify-center items-center gap-4 px-4 rounded-tl-full rounded-bl-full bg-primary text-secondary transform translate-x-full group-hover:translate-x-0 transition-transform duration-300">
                    <BiSolidCartAdd className="text-xl" />
                    Add
                  </div>
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
