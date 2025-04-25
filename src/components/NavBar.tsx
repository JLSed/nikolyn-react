import { useState } from "react";
import { signOut } from "../lib/auth";
import { useNavigate } from "react-router-dom";

function NavBar() {
  const navigate = useNavigate();
  const [isClockOutModalOpen, setIsClockOutModalOpen] = useState(false);

  const handleClockOut = async () => {
    const result = await signOut();
    if (result.success) {
      setIsClockOutModalOpen(false);
      navigate("/");
    } else {
      console.error(result.message); // Handle error if needed
    }
  };

  return (
    <nav>
      <div>
        <nav className="flex border-b-2 border-primary p-2 items-center justify-between">
          <p
            id="workerNameDisplay"
            className="select-none font-monstserrat font-semibold bg-gray-300 px-2 shadow-lg rounded"
          >
            Nikolyn's Laundry Shop
          </p>
          <div>
            <a
              data-role="cashier"
              href="../html/pos.html"
              className="nav-link border-2 border-primary px-2 py-1 hover:bg-primary hover:text-secondary transition-colors"
              type="button"
            >
              Point of Sale
            </a>
            <a
              data-role="inventory manager"
              href="../html/inventory.html"
              className="nav-link border-2 border-primary px-2 py-1 hover:bg-primary hover:text-secondary transition-colors"
              type="button"
            >
              Inventory
            </a>
            <a
              data-role="system admin"
              href="../html/usermanagement.html"
              className="nav-link border-2 border-primary px-2 py-1 hover:bg-primary hover:text-secondary transition-colors"
              type="button"
            >
              User Management
            </a>
            <button
              id="clockOutBtn"
              className="border-2 border-primary px-2 py-1 cursor-pointer hover:bg-primary hover:text-secondary transition-colors"
              onClick={() => setIsClockOutModalOpen(true)}
            >
              Clock out
            </button>
          </div>
        </nav>
      </div>
      {isClockOutModalOpen && (
        <div
          id="clockOutModal"
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
        >
          <div className="bg-white p-6 w-80 shadow-lg rounded-sm text-center">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">
              Clock Out?
            </h2>
            <p className="text-gray-600 mb-6">
              Are you sure you want to clock out?
            </p>
            <div className="flex justify-center gap-4">
              <button
                id="cancelClockOut"
                className="px-4 py-2 bg-gray-300 text-gray-800 rounded-sm hover:bg-gray-400"
                onClick={() => setIsClockOutModalOpen(false)}
              >
                Cancel
              </button>
              <button
                id="confirmClockOut"
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
