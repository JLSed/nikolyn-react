import { useEffect, useState } from "react";
import { getAllProductItems, addProductEntry } from "../lib/supabase";
import { AiOutlineBarcode } from "react-icons/ai";
import { FaSearch } from "react-icons/fa";
import { PiStackPlusFill } from "react-icons/pi";
import { AddProductModalProps, ProductItem } from "../types/inventory";

function AddProductEntryModal({
  isOpen,
  onClose,
  onProductAdded,
  onSuccess,
}: AddProductModalProps) {
  const [productItems, setProductItems] = useState<ProductItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedItem, setSelectedItem] = useState<ProductItem | null>(null);
  const [formData, setFormData] = useState({
    expiration_date: "",
    purchased_date: "",
    quantity: 1,
    supplier: "", // New field
    or_id: "", // New field
    damaged_quantity: 0, // New field
    missing_quantity: 0, // New field
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchProductItems = async () => {
      const result = await getAllProductItems();
      if (result.success) {
        setProductItems(result.data || []);
      }
    };
    if (isOpen) {
      fetchProductItems();
    }
  }, [isOpen]);

  const filteredItems = productItems.filter((item) =>
    item.item_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) return;

    setIsLoading(true);
    const result = await addProductEntry({
      item_id: selectedItem.item_id,
      ...formData,
    });
    setIsLoading(false);

    if (result.success) {
      onProductAdded();
      // Reset form
      setSelectedItem(null);
      setFormData({
        expiration_date: "",
        purchased_date: "",
        quantity: 1,
        supplier: "",
        or_id: "",
        damaged_quantity: 0,
        missing_quantity: 0,
      });
      onClose();
      onSuccess();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="relative bg-secondary rounded-lg p-6 min-w-96">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <PiStackPlusFill className="text-2xl" /> Add New Entry
        </h2>

        {!selectedItem ? (
          // Product Selection Screen
          <div>
            <div className="relative mb-4">
              <FaSearch className="absolute h-full left-2" />
              <input
                type="text"
                placeholder="Search products..."
                className="w-full p-2 pl-8 border rounded-lg"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="max-h-60 overflow-y-auto px-4">
              {filteredItems.length > 0 ? (
                filteredItems.map((item) => (
                  <div
                    key={item.item_id}
                    className="p-2 hover:bg-gray-100 cursor-pointer rounded-lg"
                    onClick={() => setSelectedItem(item)}
                  >
                    <p className="flex items-center gap-1 font-semibold text-sm text-gray-600">
                      <AiOutlineBarcode />
                      {item.barcode}
                    </p>
                    <p className="font-semibold text-xl">{item.item_name}</p>
                    <p className="text-sm text-gray-600">
                      {item.category} - ₱ {item.price} - {item.weight}
                    </p>
                  </div>
                ))
              ) : (
                <div>
                  <p className="text-center text-gray-500">
                    No products found.
                  </p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <p className="font-semibold text-lg">{selectedItem.item_name}</p>
              <p className="text-sm text-gray-600">
                {selectedItem.category} - ₱{selectedItem.price} -{" "}
                {selectedItem.weight}
              </p>
            </div>

            {/* Grid layout for form fields */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block mb-1">Supplier</label>
                <input
                  type="text"
                  placeholder="Enter supplier name"
                  className="w-full p-2 border border-primary rounded-lg font-semibold bg-secondary"
                  value={formData.supplier}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      supplier: e.target.value,
                    }))
                  }
                />
              </div>
              <div>
                <label className="block mb-1">Quantity</label>
                <input
                  type="number"
                  min="1"
                  required
                  className="w-full p-2 border border-primary rounded-lg font-semibold bg-secondary"
                  value={formData.quantity}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      quantity: parseInt(e.target.value),
                    }))
                  }
                />
              </div>

              <div>
                <label className="block mb-1">Expiration Date</label>
                <input
                  type="date"
                  required
                  className="w-full p-2 border border-primary rounded-lg font-semibold bg-secondary"
                  value={formData.expiration_date}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      expiration_date: e.target.value,
                    }))
                  }
                />
              </div>

              <div>
                <label className="block mb-1">Purchase Date</label>
                <input
                  type="date"
                  required
                  className="w-full p-2 border border-primary rounded-lg font-semibold bg-secondary"
                  value={formData.purchased_date}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      purchased_date: e.target.value,
                    }))
                  }
                />
              </div>

              <div>
                <label className="block mb-1">Damaged Quantity</label>
                <input
                  type="number"
                  min="0"
                  className="w-full p-2 border border-primary rounded-lg font-semibold bg-secondary"
                  value={formData.damaged_quantity}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      damaged_quantity: parseInt(e.target.value) || 0,
                    }))
                  }
                />
              </div>

              <div>
                <label className="block mb-1">Missing Quantity</label>
                <input
                  type="number"
                  min="0"
                  className="w-full p-2 border border-primary rounded-lg font-semibold bg-secondary"
                  value={formData.missing_quantity}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      missing_quantity: parseInt(e.target.value) || 0,
                    }))
                  }
                />
              </div>
            </div>
            <div className="col-span-2 mb-4">
              <label className="block mb-1">Order Receipt/Invoice ID</label>
              <input
                type="text"
                placeholder="Enter OR or invoice number"
                className="w-full p-2 border border-primary rounded-lg font-semibold bg-secondary"
                value={formData.or_id}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    or_id: e.target.value,
                  }))
                }
              />
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setSelectedItem(null)}
                className="px-4 py-2 font-semibold border border-primary rounded"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="px-4 py-2 bg-primary hover:bg-red-700 text-secondary rounded disabled:bg-red-300"
              >
                {isLoading ? "Adding..." : "Add Entry"}
              </button>
            </div>
          </form>
        )}

        <button
          onClick={onClose}
          className="absolute top-2 right-4 text-2xl text-gray-500 hover:text-gray-700"
        >
          ✕
        </button>
      </div>
    </div>
  );
}

export default AddProductEntryModal;
