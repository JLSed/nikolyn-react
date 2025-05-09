import { useState } from "react";
import { MdVisibility, MdVisibilityOff } from "react-icons/md";
import { login } from "../lib/auth";
import { useNavigate } from "react-router-dom";
import { IMAGE } from "../constants/images";

function LoginPage() {
  const navigate = useNavigate();
  const [seePassword, setSeePassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleViewPassword = (e: { preventDefault: () => void }) => {
    e.preventDefault();
    setSeePassword(!seePassword);
  };

  const handleLogin = async (e: { preventDefault: () => void }) => {
    e.preventDefault();
    setLoading(true);
    const result = await login(email, password);
    if (result.success) {
      navigate("/dashboard", { replace: true });
    } else if (result.message) {
      setError(result.message);
    }

    setLoading(false);
  };

  return (
    <main className="bg-secondary flex justify-between items-center h-svh">
      <img src={IMAGE.wave} className="absolute bottom-0 right-0 left-0" />
      <div className="relative flex-1 h-full text-primary font-poppins font-bold">
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10 text-center">
          <p className="text-4xl font-outfit">Nikolyn's Laundry Shop</p>
          <p className="text-7xl">Management System</p>
          <img
            src={IMAGE.logo}
            alt=""
            className=" absolute top-1/4 left-1/2 transform -translate-x-1/2 -translate-y-1/2 -z-20 opacity-15 scale-75"
          />
        </div>
      </div>
      <div className="bg-primary text-secondary p-8 flex flex-col h-full gap-4 m-4 shadow-md flex-1 max-w-96">
        <h2 className="text-3xl font-outfit font-semibold">Account Login</h2>
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
          <div className="relative mb-6">
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
            id="message"
            className="font-poppins text-sm text-center text-red-500"
          >
            {error}
          </p>
          <button
            className="bg-accent hover:scale-105 transition-all font-outfit font-semibold p-2 mt-4 rounded-md"
            type="submit"
            disabled={loading}
          >
            {loading ? "Logging in..." : "Login"}
          </button>
          <a
            className="border-2 border-primary font-outfit font-semibold p-2 self-center"
            id="signupBtn"
            href="./signup.html"
          >
            Sign Up
          </a>
        </form>
      </div>
    </main>
  );
}

export default LoginPage;
