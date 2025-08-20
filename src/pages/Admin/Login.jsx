import { useState, useEffect } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../../firebase";
import { useNavigate } from "react-router-dom";
import { useAuthState } from "react-firebase-hooks/auth";
import Input from "../../components/ui/Input";
import Button from "../../components/ui/Button";
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
    } catch (err) {
      toast.error("Invalid Credentials, please try again.");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-white">
      <form onSubmit={handleLogin} className="bg-white px-8 pt-6 pb-8 w-84">
        <div className="flex flex-col items-center justify-center gap-4">
          <img src="/T4-logo.png" alt="" className="w-18" />
          <h2 className="text-xl font-bold tracking-tight">
            Sign in to T4 Admin
          </h2>
        </div>

        <div className="space-y-3 pb-4 mt-8">
          <Input
            label="Your Email"
            name="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            required
            className="border rounded-full px-3 py-3 border-gray-300 focus:border-purple-500 focus:ring-purple-500 outline-none"
          />
          <Input
            label="Password"
            name="password"
            type="password"
            value={password}
            placeholder="Enter your password"
            onChange={(e) => setPassword(e.target.value)}
            required
            className="border rounded-full px-3 py-3 border-gray-300 focus:border-purple-500 focus:ring-purple-500 outline-none"
          />

          <div>

          </div>
          <a href="" className="flex justify-end border-gray-300 text-sm text-gray-600 hover:text-gray-800">forgot password?</a>
        </div>

      

        <Button
          type="submit"
          disabled={loading}
          className="w-full rounded-full bg-purple-600 text-white font-medium hover:bg-purple-800 transition-colors py-3 flex justify-center items-center cursor-pointer"
        >
          {loading ? <Spinner /> : "Sign In"}
        </Button>
      </form>
    </div>
  );
}
