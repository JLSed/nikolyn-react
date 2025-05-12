import { useEffect, useState } from "react";
import { Toaster, toast } from "react-hot-toast";
import NavBar from "../components/NavBar";
import { AiOutlineAudit } from "react-icons/ai";
import { useNavigate } from "react-router-dom";
import { IoPersonAdd, IoPersonRemoveSharp } from "react-icons/io5";
import { FaSearch } from "react-icons/fa";
import {
  getAllWorkers,
  getAllRoles,
  updateWorker,
  updateWorkerRoles,
  createAuditLog,
} from "../lib/supabase";
import { Worker, WorkerRole, WorkerWithRoles } from "../types/worker";
import { GrMoney, GrPowerReset } from "react-icons/gr";
import CreateAccountModal from "../components/CreateAccountModal";
import { sendPasswordReset, updateWorkerStatus } from "../lib/auth";
import { useConfirm } from "../components/ConfirmDialog";

function SystemManagementPage() {
  const navigate = useNavigate();
  const { confirm } = useConfirm();
  const [workers, setWorkers] = useState<WorkerWithRoles[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedWorker, setSelectedWorker] = useState<WorkerWithRoles | null>(
    null
  );
  const [editWorker, setEditWorker] = useState<Partial<Worker>>({});
  const [availableRoles, setAvailableRoles] = useState<WorkerRole[]>([]);
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("ACTIVE");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Fetch workers and roles data
  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch workers
      const workersResult = await getAllWorkers();
      if (workersResult.success) {
        setWorkers(workersResult.data || []);
      } else {
        toast.error("Failed to load workers");
      }

      // Fetch available roles
      const rolesResult = await getAllRoles();
      if (rolesResult.success) {
        setAvailableRoles(rolesResult.data || []);
      } else {
        toast.error("Failed to load roles");
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to fetch data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateSuccess = () => {
    // Refresh worker list
    fetchData();
  };

  // Filter workers based on search term

  const filteredWorkers = workers.filter((data) => {
    const fullName = `${data.worker.first_name} ${
      data.worker.middle_name || ""
    } ${data.worker.last_name}`.toLowerCase();

    return (
      (fullName.includes(searchTerm.toLowerCase()) ||
        data.worker.email.toLowerCase().includes(searchTerm.toLowerCase())) &&
      (statusFilter === "ALL" || data.worker.status === statusFilter)
    );
  });

  // Handle worker row click
  const handleWorkerClick = (data: WorkerWithRoles) => {
    setSelectedWorker(data);
    setEditWorker({
      first_name: data.worker.first_name,
      middle_name: data.worker.middle_name,
      last_name: data.worker.last_name,
      contact_number: data.worker.contact_number,
      address: data.worker.address,
    });

    // Extract role IDs from worker roles
    const roleIds = data.worker_roles.map((role) => role.role_id);
    setSelectedRoles(roleIds);

    setIsModalOpen(true);
  };

  const handleRoleChange = (roleId: string) => {
    setSelectedRoles((prev) => {
      if (prev.includes(roleId)) {
        return prev.filter((id) => id !== roleId);
      } else {
        return [...prev, roleId];
      }
    });
  };

  // Handle save changes
  const handleSaveChanges = async () => {
    if (!selectedWorker) return;

    setIsProcessing(true);

    try {
      // Update worker information
      const updateWorkerResult = await updateWorker(
        selectedWorker.worker.employee_id,
        editWorker
      );

      if (!updateWorkerResult.success) {
        throw new Error("Failed to update worker information");
      }

      // Update worker roles
      const updateRolesResult = await updateWorkerRoles(
        selectedWorker.worker.employee_id,
        selectedRoles
      );

      if (!updateRolesResult.success) {
        throw new Error("Failed to update worker roles");
      }

      // Update local state
      setWorkers((prev) =>
        prev.map((workerWithRoles) =>
          workerWithRoles.worker.employee_id ===
          selectedWorker.worker.employee_id
            ? {
                worker: {
                  ...workerWithRoles.worker,
                  ...editWorker,
                },
                worker_roles: availableRoles.filter((role) =>
                  selectedRoles.includes(role.role_id)
                ),
              }
            : workerWithRoles
        )
      );

      toast.success("Worker information updated successfully");
      const currentWorker = JSON.parse(
        localStorage.getItem("currentWorker") || "{}"
      );
      await createAuditLog({
        employee_id: currentWorker.data?.worker?.employee_id || "",
        email: currentWorker.data?.worker?.email || "",
        action_type: "UPDATE ACCOUNT",
        details: `Updated Account "${selectedWorker.worker.email}" Information`,
        on_page: "System Management",
      });
      setIsModalOpen(false);
    } catch (error) {
      console.error("Error updating worker:", error);
      toast.error("Failed to update worker information");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReactivateAccount = async () => {
    if (!selectedWorker) return;
    confirm({
      title: "Reactivate Account",
      message: `Are you sure you want to reactivate ${selectedWorker.worker.email}?`,
      confirmText: "Reactivate",
      cancelText: "Cancel",
      onConfirm: async () => {
        setIsProcessing(true);
        try {
          const result = await updateWorkerStatus(
            selectedWorker.worker.employee_id,
            "ACTIVE"
          );

          if (result.success) {
            // Update local state
            setWorkers((prev) =>
              prev.map((worker) =>
                worker.worker.employee_id === selectedWorker.worker.employee_id
                  ? {
                      ...worker,
                      worker: {
                        ...worker.worker,
                        status: "ACTIVE",
                      },
                    }
                  : worker
              )
            );

            toast.success("Account successfully reactivated");
            const currentWorker = JSON.parse(
              localStorage.getItem("currentWorker") || "{}"
            );
            await createAuditLog({
              employee_id: currentWorker.data.worker.employee_id,
              email: currentWorker.data.worker.email,
              action_type: "UPDATE ACCOUNT",
              details: `Account "${selectedWorker.worker.email}" REACTIVATED by ${currentWorker.shortenedName}`,
              on_page: "System Management",
            });
            setIsModalOpen(false);
          } else {
            throw new Error(
              result.error?.message || "Failed to reactivate account"
            );
          }
        } catch (error) {
          console.error("Error reactivating account:", error);
          toast.error("Failed to reactivate account");
        } finally {
          setIsProcessing(false);
        }
      },
    });
  };

  const handleDeactivateAccount = async () => {
    if (!selectedWorker) return;
    confirm({
      title: "Deactivate Account",
      message: `Are you sure you want to deactivate ${selectedWorker.worker.email}?`,
      confirmText: "Deactivate",
      cancelText: "Cancel",
      onConfirm: async () => {
        setIsProcessing(true);
        try {
          const result = await updateWorkerStatus(
            selectedWorker.worker.employee_id,
            "DEACTIVATED"
          );

          if (result.success) {
            // Update local state
            setWorkers((prev) =>
              prev.map((worker) =>
                worker.worker.employee_id === selectedWorker.worker.employee_id
                  ? {
                      ...worker,
                      worker: {
                        ...worker.worker,
                        status: "DEACTIVATED",
                      },
                    }
                  : worker
              )
            );

            toast.success("Account successfully deactivated");
            setIsModalOpen(false);
            const currentWorker = JSON.parse(
              localStorage.getItem("currentWorker") || "{}"
            );
            await createAuditLog({
              employee_id: currentWorker.data.worker.employee_id,
              email: currentWorker.data.worker.email,
              action_type: "UPDATE ACCOUNT",
              details: `Account "${selectedWorker.worker.email}" DEACTIVATED by ${currentWorker.shortenedName}`,
              on_page: "System Management",
            });
          } else {
            throw new Error(
              result.error?.message || "Failed to deactivate account"
            );
          }
        } catch (error) {
          console.error("Error deactivating account:", error);
          toast.error("Failed to deactivate account");
        } finally {
          setIsProcessing(false);
        }
      },
    });
  };

  const handleSendPasswordReset = async () => {
    if (!selectedWorker) return;

    confirm({
      title: "Send Password Reset",
      message: `Are you sure you want to send a password reset email to ${selectedWorker.worker.email}?`,
      confirmText: "Send",
      cancelText: "Cancel",
      onConfirm: async () => {
        setIsProcessing(true);
        try {
          const result = await sendPasswordReset(selectedWorker.worker.email);

          if (result.success) {
            toast.success(
              `Password reset email sent to ${selectedWorker.worker.email}`
            );
          } else {
            throw new Error(
              result.error?.message || "Failed to send password reset"
            );
          }
        } catch (error) {
          console.error("Error sending password reset:", error);
          toast.error("Failed to send password reset email");
        } finally {
          setIsProcessing(false);
        }
      },
    });
  };

  // Format date for display
  // const formatDate = (dateString: string) => {
  //   return new Date(dateString).toLocaleDateString();
  // };

  return (
    <main className="flex flex-col gap-2 bg-secondary text-primary font-outfit h-fit min-h-screen">
      <Toaster position="top-right" />
      <NavBar />
      <div className="flex justify-between items-center">
        <p className="font-michroma font-black text-3xl">SYSTEM MANAGEMENT</p>
        <div className="flex gap-2 pr-2">
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="border-2 border-primary px-2 py-1 flex items-center gap-2 rounded-lg bg-primary text-secondary hover:bg-secondary hover:text-primary transition-colors"
          >
            <IoPersonAdd />
            Create Account
          </button>
          <button
            onClick={() => navigate("/pricing-management")}
            className="border-2 border-primary px-2 py-1 flex items-center gap-2 rounded-lg bg-primary text-secondary hover:bg-secondary hover:text-primary transition-colors"
          >
            <GrMoney />
            Change Pricing
          </button>
          <button
            onClick={() => navigate("/audit-log")}
            className="border-2 border-primary px-2 py-1 flex items-center gap-2 rounded-lg bg-primary text-secondary hover:bg-secondary hover:text-primary transition-colors"
          >
            <AiOutlineAudit />
            Audit Log
          </button>
        </div>
      </div>

      <div className="px-4 py-2">
        {/* Search and Filter Controls */}
        <div className="flex flex-wrap gap-4 mb-4">
          {/* Search Bar */}
          <div className="relative flex-1 max-w-md">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name or email..."
              className="pl-10 p-2 w-full rounded-lg bg-white border border-primary"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Status Filter */}
          <div className="flex items-center">
            <label className="mr-2 font-medium">Status:</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="p-2 rounded-lg bg-white border border-primary"
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="PENDING">Pending</option>
              <option value="DEACTIVATED">Deactivated</option>
            </select>
          </div>
        </div>

        {/* Workers Table */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden text-center">
          {/* Table Header */}
          <div className="grid grid-cols-4 bg-primary text-secondary p-3 font-bold">
            <div>Employee</div>
            <div>Roles</div>
            <div>Contact Number</div>
            <div>Address</div>
          </div>

          {/* Table Body */}
          <div className="divide-y divide-gray-200">
            {loading ? (
              // Loading state
              <div className="p-4 text-center">Loading workers...</div>
            ) : filteredWorkers.length > 0 ? (
              // Workers list
              filteredWorkers.map((data) => (
                <div
                  key={data.worker.employee_id}
                  onClick={() => handleWorkerClick(data)}
                  className={`grid grid-cols-4 p-3 hover:brightness-95 cursor-pointer transition-colors ${
                    data.worker.status === "PENDING"
                      ? "bg-accent3/30"
                      : data.worker.status === "DEACTIVATED"
                      ? "bg-red-100 text-primary"
                      : "hover:bg-gray-100"
                  }`}
                >
                  <div className="flex flex-col text-left">
                    <div className="font-medium">
                      {data.worker.first_name} {data.worker.middle_name || ""}{" "}
                      {data.worker.last_name}
                    </div>
                    <div
                      className={`text-sm ${
                        data.worker.status === "DEACTIVATED"
                          ? "text-black"
                          : "text-gray-600"
                      }`}
                    >
                      {data.worker.email}
                    </div>
                    {data.worker.status !== "ACTIVE" && (
                      <span
                        className={`text-xs font-semibold mt-1 px-2${
                          data.worker.status === "PENDING"
                            ? "bg-orange-200 text-orange-800"
                            : "bg-red-200 text-red-800"
                        }`}
                      >
                        {data.worker.status}
                      </span>
                    )}
                  </div>
                  <div>
                    <div className="flex flex-wrap gap-1 justify-center">
                      {data.worker_roles.map((role) => (
                        <span
                          key={role.role_id}
                          className={`px-2 py-1 rounded-full text-xs font-bold ${
                            data.worker.status === "DEACTIVATED"
                              ? "bg-red-800/50 text-white"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {role.role_name}
                        </span>
                      ))}
                      {data.worker_roles.length === 0 && (
                        <span
                          className={`text-sm italic ${
                            data.worker.status === "DEACTIVATED"
                              ? "text-secondary/70"
                              : "text-gray-500"
                          }`}
                        >
                          No roles assigned
                        </span>
                      )}
                    </div>
                  </div>
                  <div>
                    {data.worker.contact_number ? (
                      data.worker.contact_number
                    ) : (
                      <span
                        className={`text-sm italic ${
                          data.worker.status === "DEACTIVATED"
                            ? "text-black"
                            : "text-gray-500"
                        }`}
                      >
                        No contact number
                      </span>
                    )}
                  </div>
                  <div className="px-2 truncate">
                    {data.worker.address ? (
                      <span title={data.worker.address}>
                        {data.worker.address}
                      </span>
                    ) : (
                      <span
                        className={`text-sm italic ${
                          data.worker.status === "DEACTIVATED"
                            ? "text-black"
                            : "text-gray-500"
                        }`}
                      >
                        No address provided
                      </span>
                    )}
                  </div>
                </div>
              ))
            ) : (
              // No results state
              <div className="p-4 text-center text-gray-500">
                No workers found matching your search.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Edit Worker Modal */}
      {isModalOpen && selectedWorker && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold">Edit Worker</h2>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="text-gray-500 hover:text-gray-700 text-xl"
                >
                  ✕
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-gray-700 mb-1">First Name</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    value={editWorker.first_name || ""}
                    onChange={(e) =>
                      setEditWorker({
                        ...editWorker,
                        first_name: e.target.value,
                      })
                    }
                  />
                </div>
                <div>
                  <label className="block text-gray-700 mb-1">
                    Middle Name
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    value={editWorker.middle_name || ""}
                    onChange={(e) =>
                      setEditWorker({
                        ...editWorker,
                        middle_name: e.target.value,
                      })
                    }
                  />
                </div>
                <div>
                  <label className="block text-gray-700 mb-1">Last Name</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    value={editWorker.last_name || ""}
                    onChange={(e) =>
                      setEditWorker({
                        ...editWorker,
                        last_name: e.target.value,
                      })
                    }
                  />
                </div>

                <div>
                  <label className="block text-gray-700 mb-1">
                    Contact Number
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 09XXXXXXXXX"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    value={editWorker.contact_number || ""}
                    onChange={(e) =>
                      setEditWorker({
                        ...editWorker,
                        contact_number: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-gray-700 mb-1">Address</label>
                  <textarea
                    className="w-full px-3 py-2 border border-gray-300 rounded-md resize-none"
                    rows={3}
                    placeholder="e.g. 123 Main St, Barangay Example, City"
                    value={editWorker.address || ""}
                    onChange={(e) =>
                      setEditWorker({ ...editWorker, address: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="mb-6">
                <h3 className="text-xl font-bold mb-2">Roles</h3>
                <div className="grid grid-cols-3 gap-3">
                  {availableRoles.map((data) => (
                    <div key={data.role_id} className="flex items-center">
                      <input
                        type="checkbox"
                        id={`role-${data.role_id}`}
                        checked={selectedRoles.includes(data.role_id)}
                        onChange={() => handleRoleChange(data.role_id)}
                        className="mr-2 h-5 w-5"
                      />
                      <label
                        htmlFor={`role-${data.role_id}`}
                        className="select-none"
                      >
                        {data.role_name}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
              <div className="mb-4">
                <h3 className="text-xl font-bold mb-2">Actions</h3>
                <div className="flex gap-2">
                  <button
                    onClick={handleDeactivateAccount}
                    disabled={
                      isProcessing ||
                      selectedWorker?.worker.status === "DEACTIVATED"
                    }
                    className={`border-2 border-primary px-2 py-1 flex items-center gap-2 rounded-lg ${
                      selectedWorker?.worker.status === "DEACTIVATED"
                        ? "bg-gray-300 text-gray-600 cursor-not-allowed border-gray-400"
                        : "bg-primary text-secondary hover:bg-secondary hover:text-primary transition-colors"
                    }`}
                  >
                    <IoPersonRemoveSharp />
                    {selectedWorker?.worker.status === "DEACTIVATED"
                      ? "Account Deactivated"
                      : "Deactivate Account"}
                  </button>
                  <button
                    onClick={handleSendPasswordReset}
                    disabled={
                      isProcessing ||
                      selectedWorker?.worker.status === "DEACTIVATED"
                    }
                    className={`border-2 border-primary px-2 py-1 flex items-center gap-2 rounded-lg ${
                      selectedWorker?.worker.status === "DEACTIVATED"
                        ? "bg-gray-300 text-gray-600 cursor-not-allowed border-gray-400"
                        : "bg-primary text-secondary hover:bg-secondary hover:text-primary transition-colors"
                    }`}
                  >
                    <GrPowerReset />
                    Send Password Reset
                  </button>
                  {selectedWorker?.worker.status === "DEACTIVATED" && (
                    <button
                      onClick={handleReactivateAccount}
                      className={`border-2 border-primary px-2 py-1 flex items-center gap-2 rounded-lg bg-primary text-secondary hover:bg-secondary hover:text-primary transition-colors`}
                    >
                      <GrPowerReset />
                      Reactivate Account
                    </button>
                  )}
                </div>
              </div>

              <div className="flex justify-end space-x-2">
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveChanges}
                  disabled={isProcessing}
                  className={`px-4 py-2 bg-primary text-white rounded-md ${
                    isProcessing
                      ? "opacity-50 cursor-not-allowed"
                      : "hover:bg-red-700"
                  }`}
                >
                  {isProcessing ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      <CreateAccountModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        availableRoles={availableRoles}
        onSuccess={handleCreateSuccess}
      />
    </main>
  );
}

export default SystemManagementPage;
