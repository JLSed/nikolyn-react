import { useEffect, useState } from "react";
import { signOut } from "../lib/auth";
import { useNavigate } from "react-router-dom";
import LinkButton from "./LinkButton";
import { getCurrentWorker } from "../lib/supabase";
import { WorkerRole } from "../types/interface";

function NavBar() {
  const navigate = useNavigate();
  const [userName, setUserName] = useState("Nikolyn's Laundry Shop");
  const [isClockOutModalOpen, setIsClockOutModalOpen] = useState(false);
  const [isCashier, setIsCashier] = useState(false);
  const [isSystemAdmin, setIsSystemAdmin] = useState(false);
  const [isInventoryManager, setIsInventoryManager] = useState(false);

  useEffect(() => {
    const displayUserName = async () => {
      const currentWorker = localStorage.getItem("currentWorker");
      if (currentWorker) {
        setUserName(JSON.parse(currentWorker).shortenedName);
        checkUserRoles(JSON.parse(currentWorker).worker_roles);
      } else {
        const result = await getCurrentWorker();
        if (result && result.success) {
          const { first_name, middle_name, last_name } = result?.worker || {};
          const shortenedName = `${first_name?.charAt(0)}. ${
            middle_name ? middle_name.charAt(0) + ". " : ""
          }${last_name}`;
          const currentWorker = { ...result, shortenedName: shortenedName };
          setUserName(shortenedName);
          localStorage.setItem("currentWorker", JSON.stringify(currentWorker));
          // Check user roles
          if (result?.worker_roles) {
            checkUserRoles(result.worker_roles);
          }
        } else {
          console.error("Failed to fetch worker data:", result?.error);
        }
      }
    };
    displayUserName();
  }, []);

  const checkUserRoles = (roles: WorkerRole) => {
    if (roles) {
      Object.values(roles).forEach((role) => {
        if (role.TBL_ROLE?.role_name === "CASHIER") {
          setIsCashier(true);
        }
        if (role.TBL_ROLE?.role_name === "SYSTEM ADMIN") {
          setIsSystemAdmin(true);
        }
        if (role.TBL_ROLE?.role_name === "INVENTORY MANAGER") {
          setIsInventoryManager(true);
        }
      });
    } else {
      console.error("Failed to fetch worker roles:");
    }
  };

  const handleClockOut = async () => {
    const result = await signOut();
    if (result.success) {
      localStorage.removeItem("currentWorker"); // Clear worker name on logout
      setIsClockOutModalOpen(false);
      navigate("/");
    } else {
      console.error(result.message);
    }
  };

  return (
    <nav>
      <div>
        <nav className="flex border-b-2 border-primary p-2 items-center justify-between">
          <p className="select-none font-monstserrat font-semibold bg-gray-300 px-2 shadow-lg rounded">
            {userName}
          </p>
          <div className="flex gap-1">
            <LinkButton buttonName="Dashboard" linkPath="/dashboard" />
            {isCashier && (
              <LinkButton buttonName="Point of Sale" linkPath="/pos" />
            )}
            {isInventoryManager && (
              <LinkButton buttonName="Inventory" linkPath="/inventory" />
            )}
            {isSystemAdmin && (
              <LinkButton
                buttonName="User Management"
                linkPath="/user_management"
              />
            )}

            <button
              className="border rounded-sm border-primary px-2 py-1 cursor-pointer hover:bg-primary hover:text-secondary transition-colors"
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
  );
}

export default NavBar;
