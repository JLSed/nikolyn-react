import { useEffect, useState } from "react";
import NavBar from "../components/NavBar";
import AddProductEntryModal from "../components/AddProductEntryModal";
import SuccessNotification from "../components/SuccessNotification";
import { PiStackPlusFill } from "react-icons/pi";
import { TbStackPush } from "react-icons/tb";
import AddProductItemModal from "../components/AddProductItemModal";
import { getAllProducts } from "../lib/supabase";
import { ProductItemEntries } from "../types/inventory";
import { FaSearch, FaChevronDown, FaChevronRight } from "react-icons/fa";
import { AiOutlineBarcode } from "react-icons/ai";

function InventoryPage() {
  const [isAddEntryModalOpen, setIsAddEntryModalOpen] = useState(false);
  const [isAddItemModalOpen, setIsAddItemModalOpen] = useState(false);
  const [showSuccess, setShowSuccess] = useState({
    message: "",
    isVisible: false,
  });
  const [products, setProducts] = useState<ProductItemEntries[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>(
    {}
  );
  const [loading, setLoading] = useState(true);

  // Group products by item_id to show them together
  const groupedProducts = products.reduce((acc, product) => {
    const itemName = product.TBL_PRODUCT_ITEM.item_name;
    if (!acc[itemName]) {
      acc[itemName] = {
        item: product.TBL_PRODUCT_ITEM,
        entries: [],
      };
    }
    acc[itemName].entries.push(product);
    return acc;
  }, {} as Record<string, { item: any; entries: ProductItemEntries[] }>);

  const fetchProducts = async () => {
    setLoading(true);
    const result = await getAllProducts();
    if (result.success) {
      setProducts(result.data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleProductAdded = () => {
    fetchProducts();
  };

  const handleAddEntrySuccess = () => {
    setShowSuccess({
      message: "New entry added successfully!",
      isVisible: true,
    });
  };

  const handleAddItemSuccess = () => {
    setShowSuccess({
      message: "New item added successfully!",
      isVisible: true,
    });
  };

  const toggleExpandItem = (itemName: string) => {
    setExpandedItems((prev) => ({
      ...prev,
      [itemName]: !prev[itemName],
    }));
  };

  // Filter products based on search term
  const filteredProducts = Object.entries(groupedProducts).filter(
    ([itemName]) => itemName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <main className="flex flex-col gap-2 bg-secondary text-primary font-outfit h-svh overflow-hidden">
      <NavBar />
      <div className="flex justify-between items-center">
        <p className="font-michroma font-black text-3xl">INVENTORY</p>
        <div className="flex gap-2 pr-2"></div>
      </div>
      <div className="flex justify-between bg-primary mx-4 p-4 rounded-lg">
        <div className="relative flex-1 max-w-md">
          <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search for product..."
            className="pl-10 p-2 w-full rounded-lg bg-secondary border border-primary"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setIsAddItemModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-accent3 text-primary rounded"
          >
            <TbStackPush className="text-xl" />
            Add Product Item
          </button>
          <button
            onClick={() => setIsAddEntryModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-accent3 text-primary rounded"
          >
            <PiStackPlusFill />
            Add Product Entry
          </button>
        </div>
      </div>

      <div className="bg-primary text-secondary mx-4 p-4 rounded-lg mt-2 overflow-auto flex-1 text-center ">
        <div className="grid grid-cols-4 font-bold py-2 text-accent text-xl">
          <div>Product Name</div>
          <div>Category</div>
          <div>Total Quantity</div>
          <div>Price</div>
        </div>

        {loading ? (
          <div className="animate-pulse space-y-2 py-2">
            {[...Array(4)].map((_, index) => (
              <div
                key={index}
                className="bg-secondary text-primary mb-2 rounded-lg overflow-hidden"
              >
                <div className="grid grid-cols-4 py-3">
                  <div className="flex items-center gap-2 px-2">
                    <div className="w-4 h-4 bg-gray-300 rounded-full"></div>
                    <div className="h-5 bg-gray-300 rounded w-3/4"></div>
                  </div>
                  <div className="h-5 bg-gray-300 rounded w-1/2 mx-auto"></div>
                  <div className="h-5 bg-gray-300 rounded w-1/4 mx-auto"></div>
                  <div className="h-5 bg-gray-300 rounded w-1/2 mx-auto"></div>
                </div>
                <div className="bg-gray-200 h-0.5 w-full"></div>
                <div className="relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent shimmer"></div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredProducts.length > 0 ? (
          filteredProducts.map(([itemName, { item, entries }]) => (
            <div
              key={itemName}
              className="bg-secondary text-primary mb-2 rounded-lg hover:bg-gray-300 transition-colors select-none"
            >
              <div
                className="grid grid-cols-4 py-3 cursor-pointer"
                onClick={() => toggleExpandItem(itemName)}
              >
                <div className="flex items-center gap-2 px-2">
                  {expandedItems[itemName] ? (
                    <FaChevronDown />
                  ) : (
                    <FaChevronRight />
                  )}
                  <span className="font-semibold  text-left">{itemName}</span>
                </div>
                <div>{item.category}</div>
                <div className="font-semibold">
                  {entries.reduce(
                    (sum, entry) => sum + (entry.quantity || 1),
                    0
                  )}
                </div>
                <div>₱ {item.price}</div>
              </div>

              {expandedItems[itemName] && (
                <div className="bg-[#c4c7c3] rounded-xl p-3 mb-2">
                  <div className=" grid grid-cols-4 font-semibold text-accent2 mb-1 text-sm pb-1 border-b border-gray-600">
                    <div>Batch</div>
                    <div>Purchase Date</div>
                    <div>Quantity</div>
                    <div>Expiration Date</div>
                  </div>
                  {entries.map((entry) => (
                    <div
                      key={entry.entry_id}
                      className="grid grid-cols-4 py-1 text-sm hover:bg-blue-300 rounded"
                    >
                      <div>#{entry.entry_id.substring(0, 8)}</div>
                      <div>
                        {new Date(entry.purchased_date).toLocaleDateString()}
                      </div>
                      <div className="font-semibold">{entry.quantity || 1}</div>
                      <div>
                        {new Date(entry.expiration_date).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                  <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                    <p>Weight: {item.weight}</p>

                    <p className="flex items-center gap-1">
                      <AiOutlineBarcode /> {item.barcode}
                    </p>
                  </div>
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="text-center py-10">
            {products.length === 0
              ? "No products found in inventory."
              : "No products match your search."}
          </div>
        )}
      </div>

      <AddProductItemModal
        isOpen={isAddItemModalOpen}
        onClose={() => setIsAddItemModalOpen(false)}
        onProductAdded={handleProductAdded}
        onSuccess={handleAddItemSuccess}
      />
      <AddProductEntryModal
        isOpen={isAddEntryModalOpen}
        onClose={() => setIsAddEntryModalOpen(false)}
        onProductAdded={handleProductAdded}
        onSuccess={handleAddEntrySuccess}
      />

      <SuccessNotification
        message={showSuccess.message}
        isVisible={showSuccess.isVisible}
        onHide={() => setShowSuccess({ message: "", isVisible: false })}
      />
    </main>
  );
}

export default InventoryPage;
