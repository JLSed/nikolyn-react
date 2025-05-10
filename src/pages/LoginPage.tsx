import { useState, useEffect } from "react";
import { MdVisibility, MdVisibilityOff, MdLockClock } from "react-icons/md";
import { login } from "../lib/auth";
import { useNavigate } from "react-router-dom";
import { IMAGE } from "../constants/images";
import { toast, Toaster } from "react-hot-toast";

function LoginPage() {
  const navigate = useNavigate();
  const [seePassword, setSeePassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Login attempt tracking
  const [loginAttempts, setLoginAttempts] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const [lockTimeRemaining, setLockTimeRemaining] = useState(0);
  const MAX_ATTEMPTS = 5;
  const LOCK_DURATION = 1 * 60;

  // Check for saved lock state on component mount
  useEffect(() => {
    const savedLockData = localStorage.getItem("loginLock");
    if (savedLockData) {
      const { lockUntil, attempts } = JSON.parse(savedLockData);

      if (lockUntil > Date.now()) {
        // Lock is still active
        setIsLocked(true);
        setLoginAttempts(attempts);
        const remainingSeconds = Math.ceil((lockUntil - Date.now()) / 1000);
        setLockTimeRemaining(remainingSeconds);
      } else {
        // Lock has expired, clear it
        localStorage.removeItem("loginLock");
      }
    }
  }, []);

  // Timer for countdown when locked
  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    if (isLocked && lockTimeRemaining > 0) {
      intervalId = setInterval(() => {
        setLockTimeRemaining((prev) => {
          if (prev <= 1) {
            // Time's up, unlock
            setIsLocked(false);
            clearInterval(intervalId);
            localStorage.removeItem("loginLock");
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [isLocked, lockTimeRemaining]);

  const handleViewPassword = (e: { preventDefault: () => void }) => {
    e.preventDefault();
    setSeePassword(!seePassword);
  };

  const lockAccount = () => {
    const lockUntil = Date.now() + LOCK_DURATION * 1000;
    setIsLocked(true);
    setLockTimeRemaining(LOCK_DURATION);

    // Save lock state to localStorage
    localStorage.setItem(
      "loginLock",
      JSON.stringify({
        lockUntil,
        attempts: loginAttempts,
      })
    );

    toast.error(
      `Too many failed login attempts. Account locked for ${Math.floor(
        LOCK_DURATION / 60
      )} minutes.`
    );
  };

  const handleLogin = async (e: { preventDefault: () => void }) => {
    e.preventDefault();

    if (isLocked) {
      return;
    }

    setLoading(true);
    const result = await login(email, password);

    if (result.success) {
      // Reset attempts on successful login
      setLoginAttempts(0);
      localStorage.removeItem("loginLock");
      navigate("/dashboard", { replace: true });
    } else {
      // Increment failed attempts
      const newAttempts = loginAttempts + 1;
      setLoginAttempts(newAttempts);

      if (newAttempts >= MAX_ATTEMPTS) {
        lockAccount();
      } else {
        const attemptsLeft = MAX_ATTEMPTS - newAttempts;
        setError(
          `${result.message || "Invalid credentials"}. ${attemptsLeft} ${
            attemptsLeft === 1 ? "attempt" : "attempts"
          } remaining.`
        );
      }
    }

    setLoading(false);
  };

  // Format time remaining as mm:ss
  const formatTimeRemaining = () => {
    const minutes = Math.floor(lockTimeRemaining / 60);
    const seconds = lockTimeRemaining % 60;
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
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
            className=" absolute top-1/4 left-1/2 transform -translate-x-1/2 -translate-y-1/2 -z-20 opacity-15 scale-75"
          />
        </div>
      </div>
      <div className="bg-primary text-secondary p-8 flex flex-col h-full gap-4 m-4 shadow-md flex-1 max-w-96">
        <h2 className="text-3xl font-outfit font-semibold">Account Login</h2>

        {isLocked ? (
          <div className="bg-red-900/30 p-4 rounded-md border border-red-500/50">
            <div className="flex items-center gap-2 text-xl font-semibold text-red-300 mb-2">
              <MdLockClock /> Login Locked
            </div>
            <p className="mb-2">
              Too many failed login attempts. Try again in:
            </p>
            <div className="text-2xl text-center font-mono my-4">
              {formatTimeRemaining()}
              <p
                className="z-20 text-center border rounded-lg cursor-pointer hover:text-accent hover:bg-secondary transition-colors"
                onClick={() => navigate("/reset-password")}
              >
                Forgot Password?
              </p>
            </div>
            <p className="text-sm text-secondary/70">
              For security reasons, this form has been locked due to multiple
              failed login attempts.
            </p>
          </div>
        ) : (
          <form className="flex flex-col" onSubmit={handleLogin}>
            <label htmlFor="email" className="text-sm font-outfit">
              Email
            </label>
            <input
              className="text-primary rounded-sm bg-secondary p-1 px-2 font-outfit mb-2"
              type="email"
              id="email"
              placeholder="Enter email"
              required
              onChange={(e) => setEmail(e.target.value)}
            />
            <label htmlFor="password" className="text-sm font-outfit">
              Password
            </label>
            <div className="relative mb-2">
              <input
                className="text-primary rounded-sm bg-secondary p-1 px-2 font-outfit w-full"
                id="password"
                placeholder="Enter password"
                required
                type={seePassword ? "text" : "password"}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                className="absolute right-2 top-1/2 translate-y-[-50%] text-primary cursor-pointer select-none"
                onClick={handleViewPassword}
              >
                {seePassword ? <MdVisibilityOff /> : <MdVisibility />}
              </button>
            </div>
            <p
              className="text-right text-sm cursor-pointer hover:text-accent3 transition-colors"
              onClick={() => navigate("/reset-password")}
            >
              Forgot Password?
            </p>
            {error && (
              <p className="font-poppins text-sm font-bold text-center text-red-300 my-2 p-2 bg-red-900/20 rounded-md">
                {error}
              </p>
            )}
            <button
              className="z-20 bg-accent hover:scale-105 transition-all font-outfit font-semibold p-2 mt-4 rounded-md"
              type="submit"
              disabled={loading}
            >
              {loading ? "Logging in..." : "Login"}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}

export default LoginPage;
