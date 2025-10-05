import React, { useState, useEffect } from 'react';
import './App.css';
import Register from './components/Register';
import Login from './components/Login';
import Dashboard from './components/Dashboard'; // Importa el nuevo componente

function App() {
  // Estado para saber si el usuario está autenticado
  const [isAuthenticated, setIsAuthenticated] = useState(false);
 useEffect(() => {
    // Verificar si hay un token en localStorage al cargar la página
    const token = localStorage.getItem('token');
    if (token) {
      setIsAuthenticated(true);
    }
  }, []);

  const handleLogin = (token) => {
    localStorage.setItem('token', token);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsAuthenticated(false);
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>Administrador de Gastos</h1>
        {isAuthenticated && <button onClick={handleLogout}>Cerrar Sesión</button>}
      </header>
      <main>
        {/* Renderiza condicionalmente los componentes */}
        {isAuthenticated ? (
          <Dashboard />
        ) : (
          <div>
            <Register />
            <Login onLogin={handleLogin} /> {/* Pasa la función como prop */}
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
