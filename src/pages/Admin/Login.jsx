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
      setError(err.message);
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

        {error && (
          <p className="text-red-500 text-sm font-medium my-3 text-center py-2 px-4 bg-red-100 rounded">
            Invalid Credentials! Please try again.
          </p>
        )}

        <div className="space-y-3 pb-4 mt-8">
          <Input
            label="Your Email"
            name="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            required
          />
          <Input
            label="Password"
            name="password"
            type="password"
            value={password}
            placeholder="Enter your password"
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        <Button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors py-2 flex justify-center items-center"
        >
          {loading ? <Spinner /> : "Sign In"}
        </Button>
      </form>
    </div>
  );
}
