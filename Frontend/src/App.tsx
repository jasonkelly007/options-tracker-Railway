import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Positions from './pages/Positions';
import AddPosition from './pages/AddPosition';
import Options from './pages/Options';
import AddCoveredCall from './pages/AddCoveredCall';
import AddCashSecuredPut from './pages/AddCashSecuredPut';
import Import from './pages/Import';
import Login from './components/Login';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(!!localStorage.getItem('app_password'));

  const handleLogin = (password: string) => {
    localStorage.setItem('app_password', password);
    setIsAuthenticated(true);
  };

  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />;
  }
  return (
    <Router>
      <div className="min-h-screen bg-gray-100">
        {/* Navigation */}
        <nav className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex">
                <Link to="/" className="flex items-center px-2 text-xl font-bold text-gray-900">
                  Options Tracker
                </Link>
                <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                  <NavLink to="/">Dashboard</NavLink>
                  <NavLink to="/positions">Positions</NavLink>
                  <NavLink to="/options">Options</NavLink>
                  <NavLink to="/import">Import</NavLink>
                </div>
              </div>
              <div className="flex items-center">
                <button
                  onClick={() => {
                    localStorage.removeItem('app_password');
                    window.location.reload();
                  }}
                  className="ml-4 px-3 py-1 border border-transparent text-sm font-medium rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/positions" element={<Positions />} />
            <Route path="/positions/new" element={<AddPosition />} />
            <Route path="/options" element={<Options />} />
            <Route path="/covered-calls/new" element={<AddCoveredCall />} />
            <Route path="/cash-secured-puts/new" element={<AddCashSecuredPut />} />
            <Route path="/import" element={<Import />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

interface NavLinkProps {
  to: string;
  children: React.ReactNode;
}

function NavLink({ to, children }: NavLinkProps) {
  return (
    <Link
      to={to}
      className="inline-flex items-center px-1 pt-1 border-b-2 border-transparent text-sm font-medium text-gray-500 hover:border-gray-300 hover:text-gray-700"
    >
      {children}
    </Link>
  );
}

export default App;
