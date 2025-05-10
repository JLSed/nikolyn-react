import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast, Toaster } from "react-hot-toast";
import { MdArrowBack } from "react-icons/md";
import { IMAGE } from "../constants/images";
import { requestPasswordReset } from "../lib/auth";

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await requestPasswordReset(email);

      if (result.success) {
        setSubmitted(true);
        toast.success("Password reset instructions sent to your email");
      } else {
        toast.error(result.message || "Failed to send reset instructions");
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
      console.error("Password reset error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="bg-secondary flex justify-between items-center h-svh">
      <Toaster position="top-right" />
      <img
        src={IMAGE.wave}
        className="pointer-events-none absolute bottom-0 right-0 left-0"
      />
      <div className="relative flex-1 h-full text-primary font-poppins font-bold">
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10 text-center w-full">
          <p className="text-4xl font-outfit">Nikolyn's Laundry Shop</p>
          <p className="text-7xl">POS & Inventory</p>
          <p className="text-4xl font-outfit">System</p>
          <img
            src={IMAGE.logo}
            alt=""
            className="absolute top-1/4 left-1/2 transform -translate-x-1/2 -translate-y-1/2 -z-20 opacity-15 scale-75"
          />
        </div>
      </div>
      <div className="bg-primary text-secondary p-8 flex flex-col h-full gap-4 m-4 shadow-md flex-1 max-w-96">
        <button
          onClick={() => navigate("/")}
          className="self-start flex items-center gap-2 text-secondary hover:text-accent transition-colors"
        >
          <MdArrowBack /> Back to Login
        </button>

        <h2 className="text-3xl font-outfit font-semibold">Reset Password</h2>

        {submitted ? (
          <div className="flex flex-col items-center mt-4 space-y-4">
            <div className="bg-green-900/20 text-green-300 p-4 rounded-md">
              <p className="font-medium">Reset instructions sent!</p>
              <p className="text-sm mt-2">
                If an account exists with the email you provided, you will
                receive password reset instructions.
              </p>
            </div>
            <button
              onClick={() => navigate("/")}
              className="bg-accent hover:scale-105 transition-all font-outfit font-semibold p-2 mt-4 rounded-md w-full"
            >
              Return to Login
            </button>
          </div>
        ) : (
          <form className="flex flex-col" onSubmit={handleSubmit}>
            <p className="text-sm mb-4">
              Enter your email address and we'll send you instructions to reset
              your password.
            </p>
            <label htmlFor="email" className="text-sm font-outfit">
              Email
            </label>
            <input
              className="text-primary rounded-sm bg-secondary p-2 px-3 font-outfit mb-4"
              type="email"
              id="email"
              placeholder="Enter your email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <button
              className="bg-accent hover:scale-105 transition-all font-outfit font-semibold p-2 mt-4 rounded-md"
              type="submit"
              disabled={loading}
            >
              {loading ? "Sending..." : "Reset Password"}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}

export default ResetPasswordPage;
