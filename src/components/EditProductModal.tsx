import { useEffect, useState } from "react";
import { FaTimes, FaSave } from "react-icons/fa";
import { AiOutlineBarcode } from "react-icons/ai";
import { useConfirm } from "../components/ConfirmDialog";
import { updateProductItem, createAuditLog } from "../lib/supabase";
import toast from "react-hot-toast";
import { ProductItem } from "../types/inventory";

interface EditProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProductUpdated: () => void;
  product: ProductItem | null;
}

function EditProductModal({
  isOpen,
  onClose,
  onProductUpdated,
  product,
}: EditProductModalProps) {
  const [editItemForm, setEditItemForm] = useState({
    item_name: product?.item_name || "",
    category: product?.category || "",
    price: product?.price || 0,
    weight: product?.weight || "",
    barcode: product?.barcode || "",
  });
  const [isEditing, setIsEditing] = useState(false);
  const { confirm } = useConfirm();

  // Update form state if product changes
  useEffect(() => {
    if (product && isOpen) {
      setEditItemForm({
        item_name: product.item_name || "",
        category: product.category || "",
        price: product.price || 0,
        weight: product.weight || "",
        barcode: product.barcode || "",
      });
    }
  }, [product, isOpen]);

  const handleEditFormChange = (
    field: keyof typeof editItemForm,
    value: string | number
  ) => {
    setEditItemForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSaveProduct = async () => {
    if (!product) return;

    confirm({
      title: "Edit Product",
      message: "Are you sure you want to save these changes to the product?",
      confirmText: "Save",
      cancelText: "Cancel",
      onConfirm: async () => {
        try {
          setIsEditing(true);

          const result = await updateProductItem(product.item_id, {
            item_name: editItemForm.item_name,
            category: editItemForm.category,
            price: editItemForm.price,
            weight: editItemForm.weight,
            barcode: editItemForm.barcode,
          });

          if (result.success) {
            // Create audit log
            const currentWorker = JSON.parse(
              localStorage.getItem("currentWorker") || "{}"
            );
            await createAuditLog({
              employee_id: currentWorker.data?.worker?.employee_id || "",
              email: currentWorker.data?.worker?.email || "",
              action_type: "EDIT PRODUCT",
              details: `Edited product "${product.item_name}" Information`,
              on_page: "Inventory",
            });

            toast.success("Product updated successfully");
            onProductUpdated();
            onClose();
          } else {
            toast.error(result.error || "Failed to update product");
          }
        } catch (error) {
          console.error("Error updating product:", error);
          toast.error("An error occurred while updating the product");
        } finally {
          setIsEditing(false);
        }
      },
    });
  };

  if (!isOpen || !product) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-10">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-primary">Edit Product</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <FaTimes />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Product Name
            </label>
            <input
              type="text"
              value={editItemForm.item_name}
              onChange={(e) =>
                handleEditFormChange("item_name", e.target.value)
              }
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category
            </label>
            <input
              type="text"
              value={editItemForm.category}
              onChange={(e) => handleEditFormChange("category", e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Price (₱)
            </label>
            <input
              type="number"
              value={editItemForm.price}
              onChange={(e) =>
                handleEditFormChange("price", parseFloat(e.target.value))
              }
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary"
              step="0.01"
              min="0"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Weight
            </label>
            <input
              type="text"
              value={editItemForm.weight}
              onChange={(e) => handleEditFormChange("weight", e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary"
              placeholder="e.g., 500g, 1kg"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Barcode
            </label>
            <div className="flex items-center">
              <AiOutlineBarcode className="text-gray-500 mr-2" size={20} />
              <input
                type="text"
                value={editItemForm.barcode}
                onChange={(e) =>
                  handleEditFormChange("barcode", e.target.value)
                }
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary"
                required
              />
            </div>
          </div>

          <div className="flex justify-end mt-6 gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSaveProduct}
              disabled={isEditing}
              className="px-4 py-2 bg-primary text-white rounded-md shadow-sm text-sm font-medium hover:bg-red-700 disabled:bg-red-300 disabled:cursor-not-allowed flex items-center gap-1"
            >
              <FaSave />
              {isEditing ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default EditProductModal;
