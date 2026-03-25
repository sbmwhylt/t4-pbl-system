import { useState, useEffect } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../../firebase";
import { useNavigate } from "react-router-dom";
import { useAuthState } from "react-firebase-hooks/auth";
import Input from "../../components/ui/Input";
import { toast } from "react-hot-toast";
import Spinner from "../../components/ui/Spinner";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [user, authLoading] = useAuthState(auth);
  const navigate = useNavigate();

  // Redirect logged-in users away from login page
  useEffect(() => {
    if (!authLoading && user) {
      navigate("/admin/dashboard", { replace: true });
    }
  }, [user, authLoading, navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate("/admin/dashboard");
      toast.success("Logged in successfully!");
      // console.log("Logged in user:", auth.currentUser);
    } catch (err) {
      toast.error("Invalid Credentials, please try again.");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm">
        <form
          onSubmit={handleLogin}
          className="bg-white rounded-2xl shadow-sm border border-gray-200 px-8 py-10"
        >
          {/* Logo & Title */}
          <div className="flex flex-col items-center gap-3 mb-8">
            <img src="/T4-logo.png" alt="T4 Logo" className="w-16" />
            <div className="text-center">
              <h2 className="text-xl font-bold text-gray-900 tracking-tight">
                Welcome back
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                Sign in to T4 Admin Panel
              </p>
            </div>
          </div>

          {/* Fields */}
          <div className="space-y-4">
            <Input
              label="Email"
              name="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              className="w-full rounded-lg px-3.5 py-2.5 border border-gray-300 text-sm focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none transition-colors"
            />
            <Input
              label="Password"
              name="password"
              type="password"
              value={password}
              placeholder="Enter your password"
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full rounded-lg px-3.5 py-2.5 border border-gray-300 text-sm focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none transition-colors"
            />
          </div>

          {/* Sign In Button */}
          <button
            type="submit"
            disabled={loading}
            className={`mt-6 w-full rounded-lg bg-purple-600 text-white font-medium py-2.5 text-sm transition-colors flex justify-center items-center ${
              loading
                ? "opacity-60 cursor-not-allowed"
                : "hover:bg-purple-700 cursor-pointer"
            }`}
          >
            {loading ? <Spinner /> : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
}
