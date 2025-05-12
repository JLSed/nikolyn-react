import { useEffect, useState } from "react";
import { Toaster, toast } from "react-hot-toast";
import NavBar from "../components/NavBar";
import { FaEdit, FaPlus, FaTimes } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import {
  getAllLaundryType,
  getAllServices,
  deleteLaundryType,
  deleteService,
  updateLaundryType,
  updateService,
  addLaundryType,
  addService,
  createAuditLog,
} from "../lib/supabase";
import { LaundryType, Service } from "../types/laundry";
import { FaArrowLeft } from "react-icons/fa6";
import { useConfirm } from "../components/ConfirmDialog";

function PricingManagementPage() {
  const navigate = useNavigate();
  const { confirm } = useConfirm();
  const [laundryTypes, setLaundryTypes] = useState<LaundryType[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  const [editingLaundryType, setEditingLaundryType] =
    useState<LaundryType | null>(null);
  const [editingService, setEditingService] = useState<Service | null>(null);

  const [newLaundryType, setNewLaundryType] = useState<
    Omit<LaundryType, "type_id">
  >({
    cloth_name: "",
    limit: 0,
    weight_unit: "kg",
  });
  const [newService, setNewService] = useState<Omit<Service, "service_id">>({
    service_name: "",
    price_per_limit: 0,
  });

  const [isLaundryModalOpen, setIsLaundryModalOpen] = useState(false);
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
  const [isAddingLaundry, setIsAddingLaundry] = useState(false);
  const [isAddingService, setIsAddingService] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const laundryTypesResult = await getAllLaundryType();
      if (laundryTypesResult.success) {
        setLaundryTypes(laundryTypesResult.data || []);
      } else {
        toast.error("Failed to load laundry types");
      }

      const servicesResult = await getAllServices();
      if (servicesResult.success) {
        setServices(servicesResult.data || []);
      } else {
        toast.error("Failed to load services");
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to fetch pricing data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleEditLaundryType = (laundryType: LaundryType) => {
    setEditingLaundryType(laundryType);
    setIsLaundryModalOpen(true);
    setIsAddingLaundry(false);
  };

  const handleDeleteLaundryType = async (
    typeId: string,
    laundryName: string
  ) => {
    confirm({
      title: "Delete Laundry Type",
      message: `Are you sure you want to delete ${laundryName}? This action cannot be undone.`,
      confirmText: "Delete",
      cancelText: "Cancel",
      onConfirm: async () => {
        setIsProcessing(true);
        try {
          const result = await deleteLaundryType(typeId);
          if (result.success) {
            setLaundryTypes(
              laundryTypes.filter((type) => type.type_id !== typeId)
            );
            toast.success("Laundry type deleted successfully");
            const currentWorker = JSON.parse(
              localStorage.getItem("currentWorker") || "{}"
            );
            await createAuditLog({
              employee_id: currentWorker.data?.worker?.employee_id || "",
              email: currentWorker.data?.worker?.email || "",
              action_type: "DELETE LAUNDRY TYPE",
              details: `Deleted ${laundryName} laundry type`,
              on_page: "Pricing Management",
            });
          } else {
            toast.error("Failed to delete laundry type");
          }
        } catch (error) {
          console.error("Error deleting laundry type:", error);
          toast.error("An error occurred while deleting");
        } finally {
          setIsProcessing(false);
        }
      },
    });
  };

  const handleSaveLaundryType = async () => {
    if (!editingLaundryType) return;

    setIsProcessing(true);
    try {
      const result = await updateLaundryType(editingLaundryType.type_id, {
        cloth_name: editingLaundryType.cloth_name,
        limit: editingLaundryType.limit,
        weight_unit: editingLaundryType.weight_unit,
      });

      if (result.success) {
        setLaundryTypes(
          laundryTypes.map((type) =>
            type.type_id === editingLaundryType.type_id
              ? editingLaundryType
              : type
          )
        );
        toast.success("Laundry type updated successfully");
        const currentWorker = JSON.parse(
          localStorage.getItem("currentWorker") || "{}"
        );
        await createAuditLog({
          employee_id: currentWorker.data?.worker?.employee_id || "",
          email: currentWorker.data?.worker?.email || "",
          action_type: "UPDATE LAUNDRY TYPE",
          details: `Edited ${editingLaundryType.cloth_name} laundry type`,
          on_page: "Pricing Management",
        });
        setIsLaundryModalOpen(false);
      } else {
        toast.error("Failed to update laundry type");
      }
    } catch (error) {
      console.error("Error updating laundry type:", error);
      toast.error("An error occurred while updating");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAddNewLaundryType = () => {
    setIsAddingLaundry(true);
    setEditingLaundryType(null);
    setNewLaundryType({
      cloth_name: "",
      limit: 0,
      weight_unit: "kg",
    });
    setIsLaundryModalOpen(true);
  };

  const handleSaveNewLaundryType = async () => {
    if (!newLaundryType.cloth_name || newLaundryType.limit <= 0) {
      toast.error("Please enter a valid laundry type name and limit");
      return;
    }

    setIsProcessing(true);
    try {
      const result = await addLaundryType(newLaundryType);

      if (result.success) {
        if (result.data) {
          setLaundryTypes([...laundryTypes, result.data]);
        }
        toast.success("New laundry type added successfully");
        const currentWorker = JSON.parse(
          localStorage.getItem("currentWorker") || "{}"
        );
        await createAuditLog({
          employee_id: currentWorker.data?.worker?.employee_id || "",
          email: currentWorker.data?.worker?.email || "",
          action_type: "CREATE LAUNDRY TYPE",
          details: `Added ${newLaundryType.cloth_name} laundry type`,
          on_page: "Pricing Management",
        });
        setIsLaundryModalOpen(false);
      } else {
        toast.error("Failed to add new laundry type");
      }
    } catch (error) {
      console.error("Error adding laundry type:", error);
      toast.error("An error occurred while adding");
    } finally {
      setIsProcessing(false);
    }
  };

  // Service Handlers
  const handleEditService = (service: Service) => {
    setEditingService(service);
    setIsServiceModalOpen(true);
    setIsAddingService(false);
  };

  const handleDeleteService = async (
    serviceId: string,
    serviceName: string
  ) => {
    confirm({
      title: "Delete Service",
      message: `Are you sure you want to delete ${serviceName}? This action cannot be undone.`,
      confirmText: "Delete",
      cancelText: "Cancel",
      onConfirm: async () => {
        setIsProcessing(true);
        try {
          const result = await deleteService(serviceId);
          if (result.success) {
            setServices(
              services.filter((service) => service.service_id !== serviceId)
            );
            toast.success("Service deleted successfully");
            const currentWorker = JSON.parse(
              localStorage.getItem("currentWorker") || "{}"
            );
            await createAuditLog({
              employee_id: currentWorker.data?.worker?.employee_id || "",
              email: currentWorker.data?.worker?.email || "",
              action_type: "DELETE SERVICE",
              details: `Deleted ${serviceName} Service`,
              on_page: "Pricing Management",
            });
          } else {
            toast.error("Failed to delete service");
          }
        } catch (error) {
          console.error("Error deleting service:", error);
          toast.error("An error occurred while deleting");
        } finally {
          setIsProcessing(false);
        }
      },
    });
  };

  const handleSaveService = async () => {
    if (!editingService) return;

    setIsProcessing(true);
    try {
      const result = await updateService(editingService.service_id, {
        service_name: editingService.service_name,
        price_per_limit: editingService.price_per_limit,
      });

      if (result.success) {
        setServices(
          services.map((service) =>
            service.service_id === editingService.service_id
              ? editingService
              : service
          )
        );
        toast.success("Service updated successfully");
        const currentWorker = JSON.parse(
          localStorage.getItem("currentWorker") || "{}"
        );
        await createAuditLog({
          employee_id: currentWorker.data?.worker?.employee_id || "",
          email: currentWorker.data?.worker?.email || "",
          action_type: "UPDATE SERVICE",
          details: `Updated ${editingService.service_name} Service`,
          on_page: "Pricing Management",
        });
        setIsServiceModalOpen(false);
      } else {
        toast.error("Failed to update service");
      }
    } catch (error) {
      console.error("Error updating service:", error);
      toast.error("An error occurred while updating");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAddNewService = () => {
    setIsAddingService(true);
    setEditingService(null);
    setNewService({
      service_name: "",
      price_per_limit: 0,
    });
    setIsServiceModalOpen(true);
  };

  const handleSaveNewService = async () => {
    if (!newService.service_name || newService.price_per_limit <= 0) {
      toast.error("Please enter a valid service name and price");
      return;
    }

    setIsProcessing(true);
    try {
      const result = await addService(newService);

      if (result.success) {
        if (result.data) {
          setServices([...services, result.data]);
        }
        toast.success("New service added successfully");
        const currentWorker = JSON.parse(
          localStorage.getItem("currentWorker") || "{}"
        );
        await createAuditLog({
          employee_id: currentWorker.data?.worker?.employee_id || "",
          email: currentWorker.data?.worker?.email || "",
          action_type: "CREATE SERVICE",
          details: `Added ${newService.service_name} Service`,
          on_page: "Pricing Management",
        });
        setIsServiceModalOpen(false);
      } else {
        toast.error("Failed to add new service");
      }
    } catch (error) {
      console.error("Error adding service:", error);
      toast.error("An error occurred while adding");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <main className="flex flex-col gap-2 bg-secondary text-primary font-outfit h-fit min-h-screen">
      <Toaster position="top-right" />
      <NavBar />

      <div className="flex justify-between items-center">
        <p className="font-michroma font-black text-3xl">CHANGE PRICING</p>
        <div className="flex gap-2 pr-2">
          <button
            onClick={() => navigate(-1)}
            className="border-2 border-primary px-2 py-1 flex items-center gap-2 rounded-lg bg-primary text-secondary hover:bg-secondary hover:text-primary transition-colors"
          >
            <FaArrowLeft />
            Go Back
          </button>
        </div>
      </div>

      <div className="px-4 py-2">
        {/* Laundry Types Section */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-primary">Laundry Types</h2>
            <button
              onClick={handleAddNewLaundryType}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-red-700 transition-colors"
              disabled={isProcessing}
            >
              <FaPlus /> Add New Laundry Type
            </button>
          </div>

          {loading ? (
            <div className="text-center py-4">Loading laundry types...</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {laundryTypes.map((laundryType) => (
                <div
                  key={laundryType.type_id}
                  className="border border-gray-300 rounded-lg p-4 relative group hover:shadow-md transition-shadow"
                >
                  <button
                    onClick={() => handleEditLaundryType(laundryType)}
                    className="absolute left-2 top-2 text-gray-500 hover:text-primary"
                    title="Edit"
                  >
                    <FaEdit size={18} />
                  </button>
                  <button
                    onClick={() =>
                      handleDeleteLaundryType(
                        laundryType.type_id,
                        laundryType.cloth_name
                      )
                    }
                    className="absolute right-2 top-2 text-gray-500 hover:text-red-600"
                    title="Delete"
                    disabled={isProcessing}
                  >
                    <FaTimes size={18} />
                  </button>

                  <div className="pt-6">
                    <h3 className="text-xl font-bold text-center mb-2">
                      {laundryType.cloth_name}
                    </h3>
                    <div className="text-center">
                      <p className="text-gray-600">
                        <span className="font-semibold">
                          {laundryType.limit}
                        </span>{" "}
                        {laundryType.weight_unit} Max Load
                      </p>
                    </div>
                  </div>
                </div>
              ))}

              {/* Add New Button for smaller screens */}
              <button
                onClick={handleAddNewLaundryType}
                className="border border-dashed border-gray-300 rounded-lg p-4 flex flex-col items-center justify-center text-gray-500 hover:text-primary hover:border-primary md:hidden"
              >
                <FaPlus size={24} />
                <span className="mt-2">Add New Laundry Type</span>
              </button>
            </div>
          )}
        </div>

        {/* Services Section */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-primary">Services</h2>
            <button
              onClick={handleAddNewService}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-red-700 transition-colors"
              disabled={isProcessing}
            >
              <FaPlus /> Add New Service
            </button>
          </div>

          {loading ? (
            <div className="text-center py-4">Loading services...</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {services.map((service) => (
                <div
                  key={service.service_id}
                  className="border border-gray-300 rounded-lg p-4 relative group hover:shadow-md transition-shadow"
                >
                  <button
                    onClick={() => handleEditService(service)}
                    className="absolute left-2 top-2 text-gray-500 hover:text-primary"
                    title="Edit"
                  >
                    <FaEdit size={18} />
                  </button>
                  <button
                    onClick={() =>
                      handleDeleteService(
                        service.service_id,
                        service.service_name
                      )
                    }
                    className="absolute right-2 top-2 text-gray-500 hover:text-red-600"
                    title="Delete"
                    disabled={isProcessing}
                  >
                    <FaTimes size={18} />
                  </button>

                  <div className="pt-6">
                    <h3 className="text-xl font-bold text-center mb-2">
                      {service.service_name}
                    </h3>
                    <div className="text-center">
                      <p className="text-gray-600">
                        ₱{" "}
                        <span className="font-semibold">
                          {service.price_per_limit}
                        </span>{" "}
                        per Max Load
                      </p>
                    </div>
                  </div>
                </div>
              ))}

              {/* Add New Button for smaller screens */}
              <button
                onClick={handleAddNewService}
                className="border border-dashed border-gray-300 rounded-lg p-4 flex flex-col items-center justify-center text-gray-500 hover:text-primary hover:border-primary md:hidden"
              >
                <FaPlus size={24} />
                <span className="mt-2">Add New Service</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Laundry Type Edit/Add Modal */}
      {isLaundryModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold">
                  {isAddingLaundry
                    ? "Add New Laundry Type"
                    : "Edit Laundry Type"}
                </h2>
                <button
                  onClick={() => setIsLaundryModalOpen(false)}
                  className="text-gray-500 hover:text-gray-700 text-xl"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-gray-700 mb-1">Cloth Name</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    value={
                      isAddingLaundry
                        ? newLaundryType.cloth_name
                        : editingLaundryType?.cloth_name || ""
                    }
                    onChange={(e) =>
                      isAddingLaundry
                        ? setNewLaundryType({
                            ...newLaundryType,
                            cloth_name: e.target.value,
                          })
                        : setEditingLaundryType((prev) =>
                            prev
                              ? { ...prev, cloth_name: e.target.value }
                              : null
                          )
                    }
                    placeholder="e.g. Regular Clothes"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 mb-1">Limit</label>
                  <input
                    type="number"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    value={
                      isAddingLaundry
                        ? newLaundryType.limit
                        : editingLaundryType?.limit || 0
                    }
                    onChange={(e) =>
                      isAddingLaundry
                        ? setNewLaundryType({
                            ...newLaundryType,
                            limit: Number(e.target.value),
                          })
                        : setEditingLaundryType((prev) =>
                            prev
                              ? { ...prev, limit: Number(e.target.value) }
                              : null
                          )
                    }
                    placeholder="e.g. 7"
                    min="0"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 mb-1">
                    Weight Unit
                  </label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    value={
                      isAddingLaundry
                        ? newLaundryType.weight_unit
                        : editingLaundryType?.weight_unit || "kg"
                    }
                    onChange={(e) =>
                      isAddingLaundry
                        ? setNewLaundryType({
                            ...newLaundryType,
                            weight_unit: e.target.value,
                          })
                        : setEditingLaundryType((prev) =>
                            prev
                              ? { ...prev, weight_unit: e.target.value }
                              : null
                          )
                    }
                  >
                    <option value="kg">kg</option>
                    <option value="lb">lb</option>
                    <option value="pcs">pcs</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end space-x-2 mt-6">
                <button
                  onClick={() => setIsLaundryModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  onClick={
                    isAddingLaundry
                      ? handleSaveNewLaundryType
                      : handleSaveLaundryType
                  }
                  disabled={isProcessing}
                  className={`px-4 py-2 bg-primary text-white rounded-md ${
                    isProcessing
                      ? "opacity-50 cursor-not-allowed"
                      : "hover:bg-red-700"
                  }`}
                >
                  {isProcessing ? "Saving..." : "Save"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Service Edit/Add Modal */}
      {isServiceModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold">
                  {isAddingService ? "Add New Service" : "Edit Service"}
                </h2>
                <button
                  onClick={() => setIsServiceModalOpen(false)}
                  className="text-gray-500 hover:text-gray-700 text-xl"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-gray-700 mb-1">
                    Service Name
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    value={
                      isAddingService
                        ? newService.service_name
                        : editingService?.service_name || ""
                    }
                    onChange={(e) =>
                      isAddingService
                        ? setNewService({
                            ...newService,
                            service_name: e.target.value,
                          })
                        : setEditingService((prev) =>
                            prev
                              ? { ...prev, service_name: e.target.value }
                              : null
                          )
                    }
                    placeholder="e.g. Wash & Fold"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 mb-1">
                    Price Per Limit
                  </label>
                  <div className="flex items-center">
                    <span className="px-3 py-2 bg-gray-100 border border-gray-300 rounded-l-md">
                      ₱
                    </span>
                    <input
                      type="number"
                      className="w-full px-3 py-2 border border-gray-300 rounded-r-md"
                      value={
                        isAddingService
                          ? newService.price_per_limit
                          : editingService?.price_per_limit || 0
                      }
                      onChange={(e) =>
                        isAddingService
                          ? setNewService({
                              ...newService,
                              price_per_limit: Number(e.target.value),
                            })
                          : setEditingService((prev) =>
                              prev
                                ? {
                                    ...prev,
                                    price_per_limit: Number(e.target.value),
                                  }
                                : null
                            )
                      }
                      placeholder="e.g. 50"
                      min="0"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    This is the price charged per max load unit
                  </p>
                </div>
              </div>

              <div className="flex justify-end space-x-2 mt-6">
                <button
                  onClick={() => setIsServiceModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  onClick={
                    isAddingService ? handleSaveNewService : handleSaveService
                  }
                  disabled={isProcessing}
                  className={`px-4 py-2 bg-primary text-white rounded-md ${
                    isProcessing
                      ? "opacity-50 cursor-not-allowed"
                      : "hover:bg-red-700"
                  }`}
                >
                  {isProcessing ? "Saving..." : "Save"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

export default PricingManagementPage;
