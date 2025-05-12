import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { MdDashboard, MdPointOfSale, MdInventory } from "react-icons/md";
import { GrSystem } from "react-icons/gr";
import { IMAGE } from "../constants/images";
import { createAuditLog, getCurrentWorker } from "../lib/supabase";
import { Worker, WorkerRole } from "../types/worker";
import PasswordChangeModal from "../components/PasswordChangeModal";
import { toast, Toaster } from "react-hot-toast";
import { signOut } from "../lib/auth";

const iconMap = {
  GrSystem: <GrSystem size={24} />,
  MdPointOfSale: <MdPointOfSale size={24} />,
  MdInventory: <MdInventory size={24} />,
  MdDashboard: <MdDashboard size={24} />,
};

function LandingPage() {
  const navigate = useNavigate();
  const [workerName, setWorkerName] = useState("");
  const [workerInfo, setWorkerInfo] = useState<Worker>({} as Worker);
  const [workerRoles, setWorkerRoles] = useState<WorkerRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState("");

  const [employeeId, setEmployeeId] = useState("");
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);

  useEffect(() => {
    const fetchWorkerData = async () => {
      setLoading(true);
      try {
        const currentWorker = localStorage.getItem("currentWorker");
        if (currentWorker) {
          console.log("Current Worker from localStorage:", currentWorker);
          const parsedWorker = JSON.parse(currentWorker);
          setWorkerName(parsedWorker.shortenedName || "");
          setWorkerRoles(parsedWorker.data?.roles || []);

          if (parsedWorker.data?.worker?.status === "PENDING") {
            setEmployeeId(parsedWorker.data.worker.employee_id);
            setIsPasswordModalOpen(true);
          }
        } else {
          const result = await getCurrentWorker();
          if (result.success) {
            console.log(result);
            setWorkerInfo(result?.data?.worker || ({} as Worker));
            const { first_name, middle_name, last_name, employee_id, status } =
              result?.data?.worker || {};
            const shortenedName = `${first_name?.charAt(0)}. ${
              middle_name ? middle_name.charAt(0) + ". " : ""
            }${last_name}`;

            const currentWorker = { ...result, shortenedName: shortenedName };
            setWorkerName(shortenedName);
            setEmployeeId(employee_id || "");
            localStorage.setItem(
              "currentWorker",
              JSON.stringify(currentWorker)
            );

            setWorkerRoles(result?.data?.roles || []);

            if (status === "PENDING") {
              setIsPasswordModalOpen(true);
            }
          } else {
            console.error("Failed to fetch worker data:", result?.error);
            // If can't get worker data, redirect to login
            navigate("/");
          }
        }
      } catch (error) {
        console.error("Error fetching worker data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchWorkerData();
  }, [navigate]);

  const handlePasswordUpdateSuccess = () => {
    setIsPasswordModalOpen(false);
    // Update the localStorage with the new status
    const currentWorker = localStorage.getItem("currentWorker");
    if (currentWorker) {
      const parsedWorker = JSON.parse(currentWorker);
      if (parsedWorker.data?.worker) {
        parsedWorker.data.worker.status = "ACTIVE";
        localStorage.setItem("currentWorker", JSON.stringify(parsedWorker));
      }
    }

    toast.success("Your account is now active");
  };

  useEffect(() => {
    const intervalId = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString());
    }, 1000);

    return () => clearInterval(intervalId);
  }, []);

  const handleClockOut = async () => {
    const result = await signOut();
    if (result.success) {
      await createAuditLog({
        employee_id: workerInfo.employee_id,
        email: workerInfo.email,
        action_type: "LOG OUT",
        details: `Account "${workerInfo.email}" log off the system`,
        on_page: "Landing Page",
      });
      localStorage.removeItem("currentWorker");
      navigate("/");
    } else {
      console.error(result.message);
    }
  };

  return (
    <main className="bg-secondary min-h-screen text-primary font-outfit relative overflow-hidden">
      <Toaster position="top-right" />

      <div className="absolute bottom-0 left-0 right-0 pointer-events-none">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 1440 320"
          className="w-full"
        >
          <path
            fill="#BA0000"
            fillOpacity="1"
            d="M0,224L48,213.3C96,203,192,181,288,181.3C384,181,480,203,576,202.7C672,203,768,181,864,186.7C960,192,1056,224,1152,229.3C1248,235,1344,213,1392,202.7L1440,192L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
          ></path>
        </svg>
      </div>

      <div className="container mx-auto px-4 py-8 flex flex-col md:flex-row min-h-screen relative z-10">
        <div className="md:w-1/2 flex flex-col justify-center mb-10 md:mb-0 md:pr-8">
          <div className="relative">
            <img
              src={IMAGE.logo}
              alt="Nikolyn's Laundry Shop Logo"
              className="absolute -z-10 opacity-15 max-w-xs"
              style={{
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
              }}
            />

            <h1 className="text-4xl md:text-6xl font-bold mb-6 font-michroma leading-tight">
              Nikolyn's Laundry Shop
            </h1>

            <h2 className="text-2xl md:text-3xl font-outfit mb-8">
              POS & Inventory System
            </h2>

            <div className="bg-white/70 backdrop-blur-sm p-6 rounded-lg shadow-md">
              <h3 className="text-2xl font-bold mb-3">
                Welcome, {workerName || "User"}!
              </h3>
              <p className="text-lg mb-6">
                Please select a module from the menu to begin your session.
              </p>

              <div className="text-sm border-t border-gray-200 pt-4 mt-4">
                <p className="mt-1">Current time: {currentTime}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right side - Navigation buttons */}
        <div className="md:w-1/2 flex flex-col justify-center md:pl-8">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="bg-white/90 backdrop-blur-sm p-6 rounded-lg shadow-lg">
              <h3 className="text-xl font-semibold mb-4 border-b border-gray-200 pb-2">
                Accessible Modules
              </h3>

              <div className="space-y-3">
                {workerRoles.map((role) => {
                  const icon = iconMap[role.icon as keyof typeof iconMap];
                  return (
                    <button
                      key={role.role_id}
                      onClick={() => navigate(role.link)}
                      className="w-full flex items-center p-4 rounded-lg bg-white shadow-md hover:shadow-lg transition-all transform hover:-translate-y-1 text-primary border border-gray-200 hover:border-primary group"
                    >
                      <div className="text-primary text-2xl mr-4 group-hover:scale-110 transition-transform">
                        {icon}
                      </div>
                      <div className="flex-1 text-left">
                        <span className="text-lg font-semibold">
                          {role.access_page}
                        </span>
                      </div>
                      <div className="text-gray-400 group-hover:text-primary group-hover:translate-x-1 transition-transform">
                        →
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="mt-6 pt-4 border-t border-gray-200">
                <button
                  onClick={handleClockOut}
                  className="w-full flex items-center justify-center p-3 rounded-lg bg-primary text-white hover:bg-red-700 transition-colors gap-2"
                >
                  Log Out
                </button>
              </div>

              {workerRoles.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No accessible modules found for your account.
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Password Change Modal */}
      <PasswordChangeModal
        isOpen={isPasswordModalOpen}
        employeeId={employeeId}
        onSuccess={handlePasswordUpdateSuccess}
      />
    </main>
  );
}

export default LandingPage;
