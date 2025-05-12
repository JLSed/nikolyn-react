import { useEffect, useState } from "react";
import { Toaster, toast } from "react-hot-toast";
import NavBar from "../components/NavBar";
import { useNavigate } from "react-router-dom";
import { FaArrowLeft, FaFileExport, FaFilter } from "react-icons/fa6";
import { MdSearch } from "react-icons/md";
import { getAllAuditLogs, getWorkerByEmployeeId } from "../lib/supabase";
import { AuditLog } from "../types/api";
import { Worker } from "../types/worker";

interface AuditLogWithActor extends AuditLog {
  log_id: string;
  timestamp: string;
}

function AuditLogPage() {
  const navigate = useNavigate();
  const [logs, setLogs] = useState<AuditLogWithActor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLog, setSelectedLog] = useState<AuditLogWithActor | null>(
    null
  );
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [actor, setActor] = useState<Worker | null>(null);
  const [actionTypeFilter, setActionTypeFilter] = useState<string>("ALL");
  const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
  const [dateRange, setDateRange] = useState({
    startDate: today,
    endDate: today,
  });
  const [dateFilterMode, setDateFilterMode] = useState<"single" | "range">(
    "single"
  );
  const [selectedDate, setSelectedDate] = useState(today);
  const [isFilterMenuOpen, setIsFilterMenuOpen] = useState(false);
  const [uniqueActionTypes, setUniqueActionTypes] = useState<string[]>([]);

  useEffect(() => {
    const fetchLogs = async () => {
      setLoading(true);
      try {
        const result = await getAllAuditLogs();
        if (result.success) {
          setLogs(result.data || []);

          const actionTypes = Array.from(
            new Set((result.data || []).map((log) => log.action_type))
          );
          setUniqueActionTypes(actionTypes);
        } else {
          toast.error("Failed to load audit logs");
          console.error("Error fetching audit logs:", result.error);
        }
      } catch (error) {
        console.error("Exception in fetching logs:", error);
        toast.error("An error occurred while loading logs");
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();
  }, []);

  const filteredLogs = logs.filter((log) => {
    const logDate = new Date(log.timestamp).toISOString().split("T")[0];
    const matchesSearch =
      log.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.action_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.on_page.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesActionType =
      actionTypeFilter === "ALL" || log.action_type === actionTypeFilter;
    const matchesDate =
      logDate >= dateRange.startDate && logDate <= dateRange.endDate;

    return matchesSearch && matchesActionType && matchesDate;
  });

  const handleLogClick = async (log: AuditLogWithActor) => {
    setSelectedLog(log);
    setIsModalOpen(true);

    try {
      const result = await getWorkerByEmployeeId(log.employee_id);
      if (result.success) {
        setActor(result?.data || null);
      } else {
        setActor(null);
        console.error("Error fetching worker details:", result.error);
      }
    } catch (error) {
      console.error("Error fetching worker details:", error);
      setActor(null);
    }
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const resetDateToToday = () => {
    setDateRange({
      startDate: today,
      endDate: today,
    });
    setSelectedDate(today);
  };

  const exportToCSV = () => {
    if (filteredLogs.length === 0) {
      toast.error("No logs to export");
      return;
    }

    try {
      const headers = ["Timestamp", "Email", "Action Type", "Details", "Page"];

      const csvRows = filteredLogs.map((log) => [
        new Date(log.timestamp).toLocaleString(),
        log.email,
        log.action_type,
        log.details,
        log.on_page,
      ]);

      const csvContent = [
        headers.join(","),
        ...csvRows.map((row) =>
          row.join(",").replace(/,/g, ";").replace(/"/g, '""')
        ),
      ].join("\n");

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute(
        "download",
        `audit_logs_${new Date().toISOString().slice(0, 10)}.csv`
      );
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("Logs exported to CSV");
      URL.revokeObjectURL(url);
    } catch (error) {
      toast.error("Failed to export logs");
    }
  };

  return (
    <main className="flex flex-col gap-2 bg-secondary text-primary font-outfit h-fit min-h-screen">
      <Toaster position="top-right" />
      <NavBar />
      <div className="flex justify-between items-center">
        <p className="font-michroma font-black text-3xl">AUDIT LOGS</p>
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
        {/* Search and Filter Controls */}
        <div className="mb-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search logs..."
                className="pl-10 p-2 w-full rounded-lg bg-white border border-primary"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <button
              onClick={() => setIsFilterMenuOpen(!isFilterMenuOpen)}
              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-red-700 flex items-center gap-2"
            >
              <FaFilter /> {isFilterMenuOpen ? "Hide Filters" : "Show Filters"}
            </button>

            <button
              onClick={exportToCSV}
              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-red-700 flex items-center gap-2"
            >
              <FaFileExport /> Export to CSV
            </button>
          </div>

          {isFilterMenuOpen && (
            <div className="mt-4 p-4 bg-white rounded-lg shadow-md border border-gray-200 animate-fadeIn">
              <h3 className="font-bold text-lg mb-3 text-primary">
                Filter Audit Logs
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Action Type Filter */}
                <div className="space-y-2">
                  <label className="font-medium text-primary">
                    Action Type:
                  </label>
                  <select
                    className="p-2 w-full rounded-lg bg-white border border-primary"
                    value={actionTypeFilter}
                    onChange={(e) => setActionTypeFilter(e.target.value)}
                  >
                    <option value="ALL">All Action Types</option>
                    {uniqueActionTypes.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Date Filter Mode */}
                <div className="space-y-2">
                  <label className="font-medium text-primary">
                    Date Filter Type:
                  </label>
                  <select
                    className="p-2 w-full rounded-lg bg-white border border-primary"
                    value={dateFilterMode}
                    onChange={(e) =>
                      setDateFilterMode(e.target.value as "single" | "range")
                    }
                  >
                    <option value="single">Single Date</option>
                    <option value="range">Date Range</option>
                  </select>
                </div>

                {/* Date Selector(s) */}
                <div className="space-y-2 md:col-span-2">
                  {dateFilterMode === "single" ? (
                    <div className="flex flex-col space-y-2">
                      <label className="font-medium text-primary">
                        Select Date:
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="date"
                          className="flex-1 p-2 rounded-lg bg-white border border-primary"
                          value={selectedDate}
                          onChange={(e) => {
                            setSelectedDate(e.target.value);
                            setDateRange({
                              startDate: e.target.value,
                              endDate: e.target.value,
                            });
                          }}
                        />
                        <button
                          onClick={resetDateToToday}
                          className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-red-700"
                        >
                          Today
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col space-y-2">
                      <label className="font-medium text-primary">
                        Select Date Range:
                      </label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm text-gray-600">From:</label>
                          <input
                            type="date"
                            className="w-full p-2 rounded-lg bg-white border border-primary mt-1"
                            value={dateRange.startDate}
                            onChange={(e) =>
                              setDateRange((prev) => ({
                                ...prev,
                                startDate: e.target.value,
                              }))
                            }
                          />
                        </div>
                        <div>
                          <label className="text-sm text-gray-600">To:</label>
                          <input
                            type="date"
                            className="w-full p-2 rounded-lg bg-white border border-primary mt-1"
                            value={dateRange.endDate}
                            onChange={(e) =>
                              setDateRange((prev) => ({
                                ...prev,
                                endDate: e.target.value,
                              }))
                            }
                          />
                        </div>
                      </div>
                      <button
                        onClick={resetDateToToday}
                        className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-red-700 self-start mt-2"
                      >
                        Today
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Filter status summary */}
              <div className="mt-4 p-3 bg-gray-50 rounded-lg text-sm">
                <p className="font-medium">Active Filters:</p>
                <ul className="list-disc pl-5 mt-1 space-y-1">
                  {actionTypeFilter !== "ALL" && (
                    <li>
                      Action Type:{" "}
                      <span className="font-semibold">{actionTypeFilter}</span>
                    </li>
                  )}
                  <li>
                    Date:{" "}
                    <span className="font-semibold">
                      {dateFilterMode === "single"
                        ? new Date(selectedDate).toLocaleDateString()
                        : `${new Date(
                            dateRange.startDate
                          ).toLocaleDateString()} to ${new Date(
                            dateRange.endDate
                          ).toLocaleDateString()}`}
                    </span>
                  </li>
                  {searchTerm && (
                    <li>
                      Search:{" "}
                      <span className="font-semibold">"{searchTerm}"</span>
                    </li>
                  )}
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Audit Logs Table */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {/* Table Header */}
          <div className="grid grid-cols-[180px_200px_1fr_150px] bg-primary text-secondary p-3 font-bold">
            <div>Timestamp</div>
            <div>Email</div>
            <div>Details</div>
            <div>Action Type</div>
          </div>

          {/* Table Body */}
          <div className="divide-y divide-gray-200">
            {loading ? (
              <div className="p-4 text-center">Loading audit logs...</div>
            ) : filteredLogs.length > 0 ? (
              filteredLogs.map((log) => (
                <div
                  key={log.log_id}
                  onClick={() => handleLogClick(log)}
                  className="grid grid-cols-[180px_200px_1fr_150px] p-3 hover:bg-gray-100 cursor-pointer transition-colors"
                >
                  <div className="overflow-hidden text-ellipsis whitespace-nowrap">
                    {formatDateTime(log.timestamp)}
                  </div>
                  <div className="overflow-hidden text-ellipsis whitespace-nowrap">
                    {log.email}
                  </div>
                  <div className="truncate pr-2">{log.details}</div>
                  <div>
                    <span className="text-center px-2 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700">
                      {log.action_type}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-4 text-center text-gray-500">
                No audit logs found.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Log Details Modal */}
      {isModalOpen && selectedLog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold">Audit Log Details</h2>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="text-gray-500 hover:text-gray-700 text-xl"
                >
                  ✕
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <p className="text-gray-500">Log ID</p>
                  <p className="font-semibold">{selectedLog.log_id}</p>
                </div>
                <div>
                  <p className="text-gray-500">Timestamp</p>
                  <p className="font-semibold">
                    {formatDateTime(selectedLog.timestamp)}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">Email</p>
                  <p className="font-semibold">{selectedLog.email}</p>
                </div>
                <div>
                  <p className="text-gray-500">Employee ID</p>
                  <p className="font-semibold">{selectedLog.employee_id}</p>
                </div>
                <div>
                  <p className="text-gray-500">Actor Name</p>
                  <p className="font-semibold">
                    {actor
                      ? `${actor.first_name} ${
                          actor.middle_name ? actor.middle_name + " " : ""
                        }${actor.last_name}`
                      : "Unknown"}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">Action Type</p>
                  <p className="font-semibold">
                    <span className="px-2 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700">
                      {selectedLog.action_type}
                    </span>
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">On Page</p>
                  <p className="font-semibold">{selectedLog.on_page}</p>
                </div>
              </div>

              <div className="mb-6">
                <h3 className="text-xl font-bold mb-2">Details</h3>
                <div className="bg-gray-50 p-3 rounded-lg whitespace-pre-wrap">
                  {selectedLog.details}
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-primary text-white rounded-md hover:bg-red-700"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

export default AuditLogPage;
