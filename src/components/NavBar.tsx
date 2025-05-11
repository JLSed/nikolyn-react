import { ReactNode, useEffect, useState } from "react";
import { signOut } from "../lib/auth";
import { useNavigate } from "react-router-dom";
import LinkButton from "./LinkButton";
import { createAuditLog, getCurrentWorker } from "../lib/supabase";
import { WorkerRole } from "../types/worker";
import { GrSystem } from "react-icons/gr";
import { MdPointOfSale, MdInventory, MdDashboard } from "react-icons/md";
import { Toaster } from "react-hot-toast";

const iconMap: Record<string, ReactNode> = {
  GrSystem: <GrSystem />,
  MdPointOfSale: <MdPointOfSale />,
  MdInventory: <MdInventory />,
  MdDashboard: <MdDashboard />,
};

function NavBar() {
  const navigate = useNavigate();
  const currentWorker = JSON.parse(
    localStorage.getItem("currentWorker") || "{}"
  );
  const [workerName, setworkerName] = useState("Nikolyn's Laundry Shop");
  const [workerRoles, setWorkerRoles] = useState<WorkerRole[] | undefined>([]);
  const [isClockOutModalOpen, setIsClockOutModalOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState("");

  useEffect(() => {
    const displayworkerName = async () => {
      if (currentWorker) {
        setworkerName(currentWorker.shortenedName);
        setWorkerRoles(currentWorker.data?.roles);
      } else {
        const result = await getCurrentWorker();
        if (result.success) {
          console.log(result);
          const { first_name, middle_name, last_name } =
            result?.data?.worker || {};
          const shortenedName = `${first_name?.charAt(0)}. ${
            middle_name ? middle_name.charAt(0) + ". " : ""
          }${last_name}`;
          const currentWorker = { ...result, shortenedName: shortenedName };
          setworkerName(shortenedName);
          localStorage.setItem("currentWorker", JSON.stringify(currentWorker));
          // Check user roles
          setWorkerRoles(result?.data?.roles);
        } else {
          console.error("Failed to fetch worker data:", result?.error);
        }
      }
    };
    displayworkerName();
  }, []);

  const handleClockOut = async () => {
    const result = await signOut();
    if (result.success) {
      await createAuditLog({
        employee_id: currentWorker.data.worker.employee_id,
        email: currentWorker.data.worker.email,
        action_type: "LOG OUT",
        details: `Account "${currentWorker.data.worker.email}" log off the system`,
        on_page: "Clock Out",
      });
      localStorage.removeItem("currentWorker");
      setIsClockOutModalOpen(false);
      navigate("/");
    } else {
      console.error(result.message);
    }
  };

  // Update the current time every second
  useEffect(() => {
    setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString());
    }, 1000);
  }, []);

  return (
    <>
      <Toaster position="top-right" />
      <nav className="sticky top-0 z-50 bg-primary shadow-md">
        <div>
          <nav className="flex p-2 items-center justify-between">
            <div className="flex items-center gap-2  shadow-lg  font-monstserrat font-semibold">
              <p className="bg-gray-300 rounded select-none px-2 ">
                {workerName}
              </p>
              <p className=" bg-gray-300 rounded select-none px-2 ">
                {currentTime}
              </p>
            </div>
            <div className="flex gap-2">
              {workerRoles?.map((role) => {
                const icon = iconMap[role.icon];
                return (
                  <LinkButton
                    key={role.role_id}
                    buttonName={role.access_page}
                    linkPath={role.link}
                    iconComponent={icon}
                  />
                );
              })}

              <button
                className="border-2 rounded-md bg-secondary px-2 py-1 cursor-pointer hover:bg-red-500 hover:text-secondary hover:border-red-500 transition-colors"
                onClick={() => setIsClockOutModalOpen(true)}
              >
                Clock out
              </button>
            </div>
          </nav>
        </div>
        {isClockOutModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 w-80 shadow-lg rounded-sm text-center">
              <h2 className="text-xl font-semibold mb-4 text-gray-800">
                Clock Out?
              </h2>
              <p className="text-gray-600 mb-6">
                Are you sure you want to clock out?
              </p>
              <div className="flex justify-center gap-4">
                <button
                  className="px-4 py-2 bg-gray-300 text-gray-800 rounded-sm hover:bg-gray-400"
                  onClick={() => setIsClockOutModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  className="px-4 py-2 bg-red-500 text-white rounded-sm hover:bg-red-600"
                  onClick={handleClockOut}
                >
                  Clock Out
                </button>
              </div>
            </div>
          </div>
        )}
      </nav>
    </>
  );
}

export default NavBar;
