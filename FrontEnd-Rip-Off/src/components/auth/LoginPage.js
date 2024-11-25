import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { Checkbox } from "../ui/Checkbox";
import { Label } from "../ui/Label";

export default function LoginPage() {
  const [correo, setCorreo] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(null);

    try {
      const response = await fetch("http://localhost:8080/api/authenticate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ correo, password }),
      });

      if (response.ok) {
        const data = await response.json();
        const token = data.token;
        const userId = data.userId; // Asegúrate de que esto coincide con la respuesta del backend

        // Almacenar el token y el userId en localStorage
        localStorage.setItem("token", `Bearer ${token}`);
        localStorage.setItem("userId", data.userId); // Guarda el userId

        // Redirigir a la página de música si el login es exitoso
        navigate("/music");
      } else if (response.status === 401) {
        setError("Credenciales incorrectas");
      } else {
        setError("Error al iniciar sesión, intenta nuevamente.");
      }
    } catch (error) {
      console.log("Error:", error);
      setError("Error de conexión, por favor verifica tu red.");
    }
  };
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-black to-[#ED1C24] p-4">
      <div className="w-full max-w-[450px] p-10 bg-black bg-opacity-85 rounded-lg">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-white">Iniciar sesión</h1>
        </div>

        {error && <div className="mb-4 text-red-500 text-center">{error}</div>}

        <form className="space-y-6" onSubmit={handleLogin}>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label
                htmlFor="correo"
                className="text-sm font-medium text-gray-200"
              >
                Correo electrónico o nombre de usuario
              </Label>
              <Input
                id="correo"
                placeholder="Correo electrónico o nombre de usuario"
                className="w-full bg-gray-800 border-gray-700 text-white placeholder-gray-400"
                value={correo}
                onChange={(e) => setCorreo(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="password"
                className="text-sm font-medium text-gray-200"
              >
                Contraseña
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Contraseña"
                  className="w-full bg-gray-800 border-gray-700 text-white placeholder-gray-400"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm text-gray-400 hover:text-white"
                >
                  {showPassword ? "Ocultar" : "Mostrar"}
                </button>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox id="remember" />
              <Label htmlFor="remember" className="text-sm text-gray-200">
                Recordarme
              </Label>
            </div>
          </div>

          <Button
            type="submit"
            className="w-full bg-[#ED1C24] hover:bg-[#FF5733] text-black font-bold py-3 rounded-full transition duration-300"
          >
            Iniciar sesión
          </Button>
        </form>

        <div className="mt-8 pt-8 border-t border-gray-700 text-center">
          <p className="text-gray-400">¿No tienes cuenta?</p>
          <Link
            to="/signup"
            className="text-white hover:text-[#ED1C24] font-medium"
          >
            Regístrate
          </Link>
        </div>
      </div>
    </div>
  );
}
