import { useEffect, useState } from "react";
import { AddProductModalProps } from "../types/inventory";
import { TbStackPush } from "react-icons/tb";
import { addProductItem, getProductCategories } from "../lib/supabase";

function AddProductItemModal({
  isOpen,
  onClose,
  onProductAdded,
  onSuccess,
}: AddProductModalProps) {
  const [productCategories, setProductCategories] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [formData, setFormData] = useState({
    item_name: "",
    price: 0,
    weight: "",
    category: "",
    barcode: "",
  });

  useEffect(() => {
    const getCategories = async () => {
      const result = await getProductCategories();
      if (result.success) {
        setProductCategories(result.data || []);
      } else {
        console.error("Failed to fetch categories:", result.error);
      }
    };
    getCategories();
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    const result = await addProductItem(formData);
    if (result.success) {
      onProductAdded();
      onSuccess();
      handleClose();
    } else {
      setError("Failed to add product item. Please try again.");
    }
    setIsLoading(false);
  };

  const handleClose = () => {
    setError("");
    setFormData({
      item_name: "",
      price: 0,
      weight: "",
      category: "",
      barcode: "",
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="relative bg-secondary rounded-lg p-6 min-w-96">
        <h2 className="text-xl font-bold  flex items-center gap-2">
          <TbStackPush className="text-2xl" /> Add New Product
        </h2>
        <form onSubmit={handleSubmit} className="space-y-2">
          <div className="">
            <label
              htmlFor="productName"
              className="block text-sm font-medium mb-1"
            >
              Product Name
            </label>
            <input
              required
              type="text"
              id="productName"
              placeholder="e.g Ariel"
              className="w-full px-3 py-2 border border-primary rounded-md bg-secondary"
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  item_name: e.target.value,
                }))
              }
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="price" className="block text-sm font-medium mb-1">
                Price ( ₱ )
              </label>
              <input
                required
                type="text"
                id="price"
                placeholder="0.00"
                className="w-full px-3 py-2 border border-primary rounded-md bg-secondary"
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    price: parseInt(e.target.value),
                  }))
                }
              />
            </div>
            <div>
              <label
                htmlFor="weight"
                className="block text-sm font-medium mb-1"
              >
                Weight
              </label>
              <input
                required
                type="text"
                id="weight"
                placeholder="0.00 kg/g/mL/L"
                className="w-full px-3 py-2 border border-primary rounded-md bg-secondary"
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    weight: e.target.value,
                  }))
                }
              />
            </div>
          </div>

          <div className="">
            <label
              htmlFor="category"
              className="block text-sm font-medium mb-1"
            >
              Category
            </label>
            <input
              required
              type="text"
              id="category"
              list="categoryOptions"
              placeholder="Select or type category"
              className="w-full px-3 py-2 border border-primary rounded-md bg-secondary"
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  category: e.target.value,
                }))
              }
            />
            <datalist id="categoryOptions">
              {productCategories.map((cat) => (
                <option key={cat} value={cat}></option>
              ))}
            </datalist>
          </div>

          <div className="">
            <label htmlFor="barcode" className="block text-sm font-medium mb-1">
              Barcode
            </label>
            <input
              required
              type="text"
              id="barcode"
              placeholder="Enter barcode"
              className="w-full px-3 py-2 border border-primary rounded-md bg-secondary"
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  barcode: e.target.value,
                }))
              }
            />
          </div>
          {error && (
            <div className="rounded-md bg-red-100 border border-red-400 text-red-700 px-4 py-3">
              <p>{error}</p>
            </div>
          )}
          <div className="flex justify-end space-x-2 mt-6">
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 bg-primary hover:bg-blue-700 text-secondary rounded disabled:bg-blue-300"
            >
              {isLoading ? "Adding..." : "Add Product"}
            </button>
          </div>
        </form>
        <button
          onClick={handleClose}
          className="absolute top-2 right-4 text-2xl text-gray-500 hover:text-gray-700"
        >
          ✕
        </button>
      </div>
    </div>
  );
}

export default AddProductItemModal;
