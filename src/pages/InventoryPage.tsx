import { useEffect, useState } from "react";
import NavBar from "../components/NavBar";
import AddProductEntryModal from "../components/AddProductEntryModal";
import { PiStackPlusFill } from "react-icons/pi";
import { TbStackPush } from "react-icons/tb";
import { MdDeleteForever } from "react-icons/md";
import AddProductItemModal from "../components/AddProductItemModal";
import {
  getAllProducts,
  updateProductEntry,
  createAuditLog,
  deleteProductItem,
} from "../lib/supabase";
import { ProductItem, ProductItemEntries } from "../types/inventory";
import {
  FaSearch,
  FaChevronDown,
  FaChevronRight,
  FaTimes,
  FaSave,
} from "react-icons/fa";
import { AiOutlineBarcode } from "react-icons/ai";
import { RiFileDamageFill } from "react-icons/ri";
import { GrDocumentMissing } from "react-icons/gr";
import toast, { Toaster } from "react-hot-toast";
import { useConfirm } from "../components/ConfirmDialog";
import { MdEdit } from "react-icons/md";
import EditProductModal from "../components/EditProductModal";

function InventoryPage() {
  const [isAddEntryModalOpen, setIsAddEntryModalOpen] = useState(false);
  const [isAddItemModalOpen, setIsAddItemModalOpen] = useState(false);
  const [isRemoveItemModalOpen, setIsRemoveItemModalOpen] = useState(false);
  const [products, setProducts] = useState<ProductItemEntries[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>(
    {}
  );
  const [loading, setLoading] = useState(true);
  const [selectedEntry, setSelectedEntry] = useState<ProductItemEntries | null>(
    null
  );
  const [editableEntry, setEditableEntry] = useState<{
    damaged_quantity: number;
    missing_quantity: number;
  }>({
    damaged_quantity: 0,
    missing_quantity: 0,
  });
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isEditItemModalOpen, setIsEditItemModalOpen] = useState(false);
  const [selectedItemToEdit, setSelectedItemToEdit] =
    useState<ProductItem | null>(null);
  const { confirm } = useConfirm();
  const [sortOrder, setSortOrder] = useState<"asc" | "desc" | null>(null);
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
    toast.success("New entry added successfully!");
  };

  const handleAddItemSuccess = () => {
    toast.success("New item added successfully!");
  };

  const toggleExpandItem = (itemName: string) => {
    setExpandedItems((prev) => ({
      ...prev,
      [itemName]: !prev[itemName],
    }));
  };

  const openEntryDetails = (entry: ProductItemEntries, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering parent click events
    setSelectedEntry(entry);
    setEditableEntry({
      damaged_quantity: entry.damaged_quantity || 0,
      missing_quantity: entry.missing_quantity || 0,
    });
  };

  const closeEntryDetails = () => {
    setSelectedEntry(null);
  };

  const handleEditableChange = (
    field: "damaged_quantity" | "missing_quantity",
    value: string
  ) => {
    const numValue = parseInt(value) || 0;
    setEditableEntry((prev) => ({
      ...prev,
      [field]: numValue >= 0 ? numValue : 0,
    }));
  };

  const handleUpdateStock = async () => {
    if (!selectedEntry) return;

    if (
      editableEntry.damaged_quantity ===
        (selectedEntry.damaged_quantity || 0) &&
      editableEntry.missing_quantity === (selectedEntry.missing_quantity || 0)
    ) {
      closeEntryDetails();
      return;
    }

    confirm({
      title: "Update Stock Information",
      message:
        "Are you sure you want to update the damaged and missing quantities for this product entry?",
      confirmText: "Update",
      cancelText: "Cancel",
      onConfirm: async () => {
        try {
          setIsUpdating(true);

          const result = await updateProductEntry(selectedEntry.entry_id, {
            damaged_quantity: editableEntry.damaged_quantity,
            missing_quantity: editableEntry.missing_quantity,
          });

          if (result.success) {
            const currentWorker = JSON.parse(
              localStorage.getItem("currentWorker") || "{}"
            );
            await createAuditLog({
              employee_id: currentWorker.data?.worker?.employee_id || "",
              email: currentWorker.data?.worker?.email || "",
              action_type: "UPDATE INVENTORY",
              details: `Updated stock for "${
                selectedEntry.TBL_PRODUCT_ITEM?.item_name
              }": Changed damaged quantity from ${
                selectedEntry.damaged_quantity || 0
              } to ${editableEntry.damaged_quantity}, missing quantity from ${
                selectedEntry.missing_quantity || 0
              } to ${editableEntry.missing_quantity}`,
              on_page: "Inventory",
            });

            toast.success("Stock information updated successfully");
            closeEntryDetails();
            fetchProducts();
          } else {
            toast.error("Failed to update stock information");
          }
        } catch (error) {
          console.error("Error updating stock:", error);
          toast.error("An error occurred while updating stock");
        } finally {
          setIsUpdating(false);
        }
      },
    });
  };

  const handleRemoveProductItem = async (itemId: string, itemName: string) => {
    confirm({
      title: "Remove Product Item",
      message: `Are you sure you want to delete "${itemName}"? This will remove the product and all its entries from the inventory.`,
      confirmText: "Delete",
      cancelText: "Cancel",
      onConfirm: async () => {
        try {
          setIsDeleting(true);

          const result = await deleteProductItem(itemId);

          if (result.success) {
            const currentWorker = JSON.parse(
              localStorage.getItem("currentWorker") || "{}"
            );
            await createAuditLog({
              employee_id: currentWorker.data?.worker?.employee_id || "",
              email: currentWorker.data?.worker?.email || "",
              action_type: "DELETE PRODUCT",
              details: `Removed product item "${itemName}" from inventory`,
              on_page: "Inventory",
            });

            toast.success(`Product "${itemName}" removed successfully`);
            fetchProducts();
          } else {
            toast.error(result.error || "Failed to remove product");
          }
        } catch (error) {
          console.error("Error removing product:", error);
          toast.error("An error occurred while removing the product");
        } finally {
          setIsDeleting(false);
        }
      },
    });
  };

  const handleEditButtonClick = (e: React.MouseEvent, item: ProductItem) => {
    e.stopPropagation();
    setSelectedItemToEdit(item);

    setIsEditItemModalOpen(true);
  };

  const filteredProducts = Object.entries(groupedProducts)
  .filter(([itemName]) =>
    itemName.toLowerCase().includes(searchTerm.toLowerCase())
  )
  .sort(([_, a], [__, b]) => {
    const totalQuantityA = a.entries.reduce(
      (sum, entry) => sum + (entry.quantity || 0),
      0
    );
    const totalQuantityB = b.entries.reduce(
      (sum, entry) => sum + (entry.quantity || 0),
      0
    );

    if (sortOrder === "asc") {
      return totalQuantityA - totalQuantityB;
    } else if (sortOrder === "desc") {
      return totalQuantityB - totalQuantityA;
    }
    return 0; // No sorting
  });
  const toggleSortOrder = () => {
    setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
  };
  return (
    <main className="flex flex-col gap-2 bg-secondary text-primary font-outfit h-svh overflow-hidden">
      <Toaster position="top-right" />
      <NavBar />
      <div className="flex justify-between items-center">
        <p className="font-michroma font-black text-3xl">INVENTORY</p>
        <div className="flex gap-2 pr-2"></div>
      </div>
      <div className="flex justify-between bg-primary mx-4 p-4 rounded-lg">
        <div className="flex flex-1  items-center gap-2">

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
        <button
      onClick={toggleSortOrder}
      className="flex items-center gap-2 px-4 py-2 bg-secondary text-primary rounded"
    >
      {sortOrder === "asc" ? "Sort: Quantity ↑" : "Sort: Quantity ↓"}
    </button>
            </div>
        
        <div className="flex gap-2">
          <button
            onClick={() => setIsAddItemModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-accent3 text-primary rounded"
          >
            <TbStackPush className="text-xl" />
            Add Product Item
          </button>

          {/* New Remove Product Item button */}
          <button
            onClick={() => setIsRemoveItemModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-accent3 text-primary rounded"
            disabled={isDeleting}
          >
            <MdDeleteForever className="text-xl" />
            {isDeleting ? "Removing..." : "Remove Product Item"}
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
        <div className="grid grid-cols-5 font-bold py-2 text-accent3 text-xl">
          <div>Product Name</div>
          <div>Category</div>
          <div>Total Quantity</div>
          <div>Price</div>
          <div>Actions</div> {/* New column for actions */}
        </div>

        {loading ? (
          <div className="animate-pulse space-y-2 py-2">
            {[...Array(4)].map((_, index) => (
              <div
                key={index}
                className="bg-secondary text-primary mb-2 rounded-lg overflow-hidden"
              >
                <div className="grid grid-cols-5 py-3">
                  {" "}
                  <div className="flex items-center gap-2 px-2">
                    <div className="w-4 h-4 bg-gray-300 rounded-full"></div>
                    <div className="h-5 bg-gray-300 rounded w-3/4"></div>
                  </div>
                  <div className="h-5 bg-gray-300 rounded w-1/2 mx-auto"></div>
                  <div className="h-5 bg-gray-300 rounded w-1/4 mx-auto"></div>
                  <div className="h-5 bg-gray-300 rounded w-1/2 mx-auto"></div>
                  <div className="h-5 bg-gray-300 rounded w-1/4 mx-auto"></div>{" "}
                  {/* Added column */}
                </div>
                {/* Rest of loading skeleton... */}
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
                className="grid grid-cols-5 py-3 cursor-pointer"
                onClick={() => toggleExpandItem(itemName)}
              >
                <div className="flex items-center gap-2 px-2">
                  {expandedItems[itemName] ? (
                    <FaChevronDown />
                  ) : (
                    <FaChevronRight />
                  )}
                  <span className="font-semibold text-left">{itemName}</span>
                </div>
                <div>{item.category}</div>
                <div className="font-semibold">
                  {entries.reduce(
                    (sum, entry) => sum + (entry.quantity || 1),
                    0
                  )}
                </div>
                <div>₱ {item.price}</div>
                <div className="flex justify-center">
                  <button
                    onClick={(e) => handleEditButtonClick(e, item)}
                    className="p-1 text-blue-600 hover:bg-blue-100 rounded-full"
                    title="Edit Product"
                  >
                    <MdEdit size={20} />
                  </button>
                </div>
              </div>

              {expandedItems[itemName] && (
                <div className="bg-white rounded-xl p-3 mb-2">
                  <div className="grid grid-cols-4 font-semibold text-accent2 mb-1 text-sm pb-1 border-b border-gray-600">
                    <div>Supplier</div>
                    <div>Purchase Date</div>
                    <div>Quantity</div>
                    <div>Expiration Date</div>
                  </div>
                  {entries.map((entry) => (
                    <div
                      key={entry.entry_id}
                      className="grid grid-cols-4 py-1 text-sm hover:bg-red-300 rounded cursor-pointer"
                      onClick={(e) => openEntryDetails(entry, e)}
                    >
                      <div className="text-left pl-2 overflow-hidden text-ellipsis">
                        {entry.supplier || "Not specified"}
                      </div>
                      <div>
                        {new Date(entry.purchased_date).toLocaleDateString()}
                      </div>
                      <div className="font-semibold flex items-center justify-center gap-1">
                        {entry.quantity || 1}
                        {(entry.damaged_quantity > 0 ||
                          entry.missing_quantity > 0) && (
                          <span className="text-xs text-gray-700">
                            {entry.damaged_quantity > 0 && (
                              <span className="ml-1 flex items-center">
                                (<RiFileDamageFill className="text-red-500" />{" "}
                                {entry.damaged_quantity})
                              </span>
                            )}
                            {entry.missing_quantity > 0 && (
                              <span className="ml-1 flex items-center">
                                (
                                <GrDocumentMissing className="text-yellow-500" />{" "}
                                {entry.missing_quantity})
                              </span>
                            )}
                          </span>
                        )}
                      </div>
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

      {/* Entry details modal */}
      {selectedEntry && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-10">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-primary">Entry Details</h3>
              <button
                onClick={closeEntryDetails}
                className="text-gray-500 hover:text-gray-700"
              >
                <FaTimes />
              </button>
            </div>

            <div className="space-y-3 text-primary">
              <div>
                <p className="text-sm text-gray-500">Product:</p>
                <p className="font-semibold text-lg">
                  {selectedEntry.TBL_PRODUCT_ITEM?.item_name}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">

                <div>
                  <p className="text-sm text-gray-500">OR/Invoice ID:</p>
                  <p>{selectedEntry.or_id || "Not specified"}</p>
                </div>

                <div>
                  <p className="text-sm text-gray-500">Supplier:</p>
                  <p>{selectedEntry.supplier || "Not specified"}</p>
                </div>

                <div>
                  <p className="text-sm text-gray-500">Purchase Date:</p>
                  <p>
                    {new Date(
                      selectedEntry.purchased_date
                    ).toLocaleDateString()}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-500">Expiration Date:</p>
                  <p>
                    {new Date(
                      selectedEntry.expiration_date
                    ).toLocaleDateString()}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-500">Quantity:</p>
                  <p className="font-semibold">{selectedEntry.quantity || 1}</p>
                </div>
<div></div>
                <div>
                  <p className="text-sm text-gray-500">Damaged:</p>
                  <div className="flex items-center">
                    <RiFileDamageFill className="text-red-500 mr-1" />
                    <input
                      type="number"
                      min="0"
                      value={editableEntry.damaged_quantity}
                      onChange={(e) =>
                        handleEditableChange("damaged_quantity", e.target.value)
                      }
                      className="w-20 p-1 border border-gray-300 rounded"
                    />
                  </div>
                </div>

                {/* Make missing quantity editable */}
                <div>
                  <p className="text-sm text-gray-500">Missing:</p>
                  <div className="flex items-center">
                    <GrDocumentMissing className="text-yellow-500 mr-1" />
                    <input
                      type="number"
                      min="0"
                      value={editableEntry.missing_quantity}
                      onChange={(e) =>
                        handleEditableChange("missing_quantity", e.target.value)
                      }
                      className="w-20 p-1 border border-gray-300 rounded"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-2 mt-2 border-t border-gray-200">
                <p className="text-sm text-gray-500">Added on:</p>
                <p>{new Date(selectedEntry.added_at).toLocaleString()}</p>
              </div>

              {/* Update Button */}
              <div className="flex justify-end mt-4">
                <button
                  onClick={handleUpdateStock}
                  disabled={isUpdating}
                  className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-md hover:bg-red-700 disabled:bg-red-300 disabled:cursor-not-allowed"
                >
                  <FaSave />
                  {isUpdating ? "Updating..." : "Update Stock"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Remove Product Item modal */}
      {isRemoveItemModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-10">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-primary">
                Remove Product Item
              </h3>
              <button
                onClick={() => setIsRemoveItemModalOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <FaTimes />
              </button>
            </div>

            <div className="mb-4">
              <p className="text-gray-700 mb-4">
                Select a product to remove from inventory:
              </p>

              <div className="max-h-80 overflow-y-auto border border-gray-200 rounded-lg">
                {Object.entries(groupedProducts).length > 0 ? (
                  Object.entries(groupedProducts).map(
                    ([itemName, { item }]) => (
                      <div
                        key={item.item_id}
                        className="p-3 hover:bg-red-100 cursor-pointer border-b border-gray-200 flex justify-between items-center"
                        onClick={() =>
                          handleRemoveProductItem(item.item_id, itemName)
                        }
                      >
                        <div>
                          <p className="font-semibold">{itemName}</p>
                          <p className="text-sm text-gray-600">
                            {item.category} - ₱{item.price}
                          </p>
                        </div>
                        <MdDeleteForever className="text-xl text-red-600" />
                      </div>
                    )
                  )
                ) : (
                  <p className="p-4 text-center text-gray-500">
                    No products available
                  </p>
                )}
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setIsRemoveItemModalOpen(false)}
                className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

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
      <EditProductModal
        isOpen={isEditItemModalOpen}
        onClose={() => setIsEditItemModalOpen(false)}
        onProductUpdated={fetchProducts}
        product={selectedItemToEdit}
      />
    </main>
  );
}

export default InventoryPage;
