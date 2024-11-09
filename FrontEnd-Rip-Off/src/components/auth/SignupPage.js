import { useState } from 'react';
import { useNavigate } from 'react-router-dom'; // Para redirigir
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Label } from '../ui/Label';
import { RadioGroup, RadioGroupItem } from '../ui/RadioGroup';
import { Link } from 'react-router-dom'; // Asegúrate de importar esto

export default function SignupPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [gender, setGender] = useState('Femenino'); // Establecer el valor inicial en "Femenino"
  const navigate = useNavigate(); // Para redirigir al login tras el registro

  const handleSignup = async (e) => {
    e.preventDefault();
    const data = {
      correo: email,
      password: password,
      nombreDePerfil: username,
      genero: gender, // Enviando el valor del género seleccionado
    };

    try {
      const response = await fetch('http://localhost:8080/api/users/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        // Redirige al login tras un registro exitoso
        navigate('/login');
      } else {
        console.log('Error al registrarse');
      }
    } catch (error) {
      console.log('Error:', error);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-black to-[#ED1C24] p-4">
      <div className="w-full max-w-[450px] p-10 bg-black bg-opacity-85 rounded-lg">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-white">Regístrate gratis</h1>
        </div>

        <form className="space-y-6" onSubmit={handleSignup}>
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium text-gray-200">
              Correo electrónico
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="Ingresa tu correo electrónico"
              className="w-full bg-gray-800 border-gray-700 text-white placeholder-gray-400"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-sm font-medium text-gray-200">
              Crear contraseña
            </Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Crea tu contraseña"
                className="w-full bg-gray-800 border-gray-700 text-white placeholder-gray-400"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm text-gray-400 hover:text-white"
              >
                {showPassword ? 'Ocultar' : 'Mostrar'}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="username" className="text-sm font-medium text-gray-200">
              Nombre de perfil
            </Label>
            <Input
              id="username"
              placeholder="Ingresa un nombre de perfil"
              className="w-full bg-gray-800 border-gray-700 text-white placeholder-gray-400"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-200">Género</Label>
            <RadioGroup value={gender} onValueChange={setGender}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="Femenino" id="female" />
                <Label htmlFor="female" className="text-gray-200">Femenino</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="Masculino" id="male" />
                <Label htmlFor="male" className="text-gray-200">Masculino</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="No binario" id="non-binary" />
                <Label htmlFor="non-binary" className="text-gray-200">No binario</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="Otro" id="other" />
                <Label htmlFor="other" className="text-gray-200">Otro</Label>
              </div>
            </RadioGroup>
          </div>

          <Button type="submit" className="w-full bg-[#ED1C24] hover:bg-[#FF5733] text-black font-bold py-3 rounded-full transition duration-300 uppercase">
            Registrarte
          </Button>
        </form>

        <div className="mt-8 pt-8 border-t border-gray-700 text-center">
          <p className="text-gray-400">¿Ya tienes cuenta?</p>
          <Link to="/login" className="text-white hover:text-[#ED1C24] font-medium">
            Inicia sesión
          </Link>
        </div>
      </div>
    </div>
  );
}
