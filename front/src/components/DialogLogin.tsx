import { useState, type FormEvent } from "react";
import { User, Lock, EyeOff, Eye } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

const DialogLogin = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const { login } = useAuth();

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      await login(username, password);
      console.log("Connexion réussie");

      const modal = document.getElementById("login_modal") as HTMLDialogElement;
      if (modal) {
        modal.close();
      }

      setUsername("");
      setPassword("");
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : "Erreur de connexion";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <dialog id="login_modal" className="modal">
        <div className="modal-box bg-white">
          <form method="dialog">
            <button className="btn btn-sm btn-circle btn-secondary absolute right-2 top-2">
              ✕
            </button>
          </form>
          <div className="mb-8 flex justify-center">
            <div className="relative">
              <div className="absolute inset-0 rounded-full bg-gray-100 blur-xl" />
              <div className="relative flex h-32 w-32 items-center justify-center rounded-full bg-gray-50 shadow-inner">
                <div className="flex h-24 w-24 items-center justify-center rounded-full bg-white shadow-md">
                  <img
                    src="https://st3.depositphotos.com/9998432/13335/v/450/depositphotos_133352010-stock-illustration-default-placeholder-man-and-woman.jpg"
                    className="h-12 w-12 rounded-full"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="mb-8 text-center">
            <h1 className="mb-2 text-4xl font-bold text-gray-900">
              Login to your account
            </h1>
            <p className="text-lg text-gray-500">
              Enter your details to login.
            </p>
          </div>

          <div className="mb-8 h-px bg-gray-200" />

          {error && (
            <div className="mb-4 rounded-lg bg-red-50 p-4 text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label
                htmlFor="username"
                className="text-md font-semibold text-gray-900"
              >
                Username
              </label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                <input
                  id="username"
                  type="text"
                  placeholder="Username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="h-14 rounded-2xl border-gray-200 bg-gray-50 pl-12 text-base placeholder:text-gray-400 w-full text-black"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label
                htmlFor="password"
                className="text-lg font-semibold text-gray-900"
              >
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-14 rounded-2xl border-gray-200 bg-gray-50 pl-12 pr-12 text-base w-full text-black"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <a
                href="#"
                className="text-sm font-normal text-gray-700 underline hover:text-gray-900"
              >
                Sign up
              </a>
            </div>

            <button
              type="submit"
              className="btn btn-secondary w-full"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <span className="loading loading-spinner loading-sm"></span>
                  Connexion...
                </>
              ) : (
                "Login"
              )}
            </button>
          </form>
        </div>
      </dialog>
    </>
  );
};

export default DialogLogin;
