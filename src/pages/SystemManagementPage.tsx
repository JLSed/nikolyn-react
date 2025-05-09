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
} from "../lib/supabase";
import { Worker, WorkerRole, WorkerWithRoles } from "../types/worker";

function SystemManagementPage() {
  const navigate = useNavigate();
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

  // Fetch workers and roles data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch workers
        const workersResult = await getAllWorkers();
        if (workersResult.success) {
          console.log(workersResult);
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

    fetchData();
  }, []);

  // Filter workers based on search term
  const filteredWorkers = workers.filter((data) => {
    const fullName = `${data.worker.first_name} ${
      data.worker.middle_name || ""
    } ${data.worker.last_name}`.toLowerCase();
    return (
      fullName.includes(searchTerm.toLowerCase()) ||
      data.worker.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  // Handle worker row click
  const handleWorkerClick = (data: WorkerWithRoles) => {
    setSelectedWorker(data);
    setEditWorker({
      first_name: data.worker.first_name,
      middle_name: data.worker.middle_name,
      last_name: data.worker.last_name,
      email: data.worker.email,
    });

    // Extract role IDs from worker roles
    const roleIds = data.worker_roles.map((role) => role.role_id);
    console.log(roleIds);
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
      setIsModalOpen(false);
    } catch (error) {
      console.error("Error updating worker:", error);
      toast.error("Failed to update worker information");
    } finally {
      setIsProcessing(false);
    }
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <main className="flex flex-col gap-2 bg-secondary text-primary font-outfit h-fit min-h-screen">
      <Toaster position="top-right" />
      <NavBar />
      <div className="flex justify-between items-center">
        <p className="font-michroma font-black text-3xl">SYSTEM MANAGEMENT</p>
        <div className="flex gap-2 pr-2">
          <button
            onClick={() => navigate("/create-account")}
            className="border-2 border-primary px-2 py-1 flex items-center gap-2 rounded-lg bg-primary text-secondary hover:bg-secondary hover:text-primary transition-colors"
          >
            <IoPersonAdd />
            Create New Account
          </button>
          <button
            onClick={() => navigate("/delete-account")}
            className="border-2 border-primary px-2 py-1 flex items-center gap-2 rounded-lg bg-primary text-secondary hover:bg-secondary hover:text-primary transition-colors"
          >
            <IoPersonRemoveSharp />
            Delete Account
          </button>
          <button
            onClick={() => navigate("/order-log")}
            className="border-2 border-primary px-2 py-1 flex items-center gap-2 rounded-lg bg-primary text-secondary hover:bg-secondary hover:text-primary transition-colors"
          >
            <AiOutlineAudit />
            Audit Log
          </button>
        </div>
      </div>

      <div className="px-4 py-2">
        {/* Search Bar */}
        <div className="relative flex-1 max-w-md mb-4">
          <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name or email..."
            className="pl-10 p-2 w-full rounded-lg bg-white border border-primary"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Workers Table */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {/* Table Header */}
          <div className="grid grid-cols-6 bg-primary text-secondary p-3 font-bold">
            <div>Employee</div>
            <div>Email</div>
            <div>Roles</div>
            <div>Employee ID</div>
            <div>Auth ID</div>
            <div>Created</div>
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
                  className="grid grid-cols-6 p-3 hover:bg-gray-100 cursor-pointer transition-colors"
                >
                  <div className="font-medium">
                    {data.worker.first_name} {data.worker.middle_name || ""}{" "}
                    {data.worker.last_name}
                  </div>
                  <div>{data.worker.email}</div>
                  <div>
                    <div className="flex flex-wrap gap-1">
                      {data.worker_roles.map((role) => (
                        <span
                          key={role.role_id}
                          className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-bold"
                        >
                          {role.role_name}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="font-mono text-sm">
                    {data.worker.employee_id.substring(0, 8)}...
                  </div>
                  <div className="font-mono text-sm">
                    {data.worker.auth_id.substring(0, 8)}...
                  </div>
                  <div>{formatDate(data.worker.created_at)}</div>
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
                  <label className="block text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    value={editWorker.email || ""}
                    onChange={(e) =>
                      setEditWorker({ ...editWorker, email: e.target.value })
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
                      : "hover:bg-blue-700"
                  }`}
                >
                  {isProcessing ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

export default SystemManagementPage;
