import { Toaster } from "react-hot-toast";
import NavBar from "../components/NavBar";

function DashboardPage() {
  return (
    <main className="flex flex-col gap-2 bg-secondary text-primary font-outfit h-fit min-h-screen">
      <Toaster position="top-right" />
      <NavBar />
      <div className="flex justify-between items-center">
        <p className="font-michroma font-black text-3xl">DASHBOARD</p>
        <div className="flex gap-2 pr-2"></div>
      </div>

      <div className="px-4 py-2 flex gap-6">
        <div className="bg-gray-300 p-6 rounded-lg flex flex-col  gap-2">
          <p className="font-bold text-2xl">Sales (Today)</p>
          <p className="text-5xl text-center">PHP 1000</p>
        </div>
        <div className="bg-gray-300 p-6 rounded-lg flex flex-col  gap-2">
          <p className="font-bold text-2xl">Sales (Weekly)</p>
          <p className="text-5xl text-center">PHP 223</p>
        </div>
        <div className="bg-gray-300 p-6 rounded-lg flex flex-col  gap-2">
          <p className="font-bold text-2xl">Sales (Monthly)</p>
          <p className="text-5xl text-center">PHP 0</p>
        </div>
      </div>
    </main>
  );
}

export default DashboardPage;
