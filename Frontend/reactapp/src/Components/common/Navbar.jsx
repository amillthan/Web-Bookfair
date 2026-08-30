import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuthContext } from "../../context/AuthContext";
import { ShieldAlert } from "lucide-react";

const Navbar = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();
  const { isAuthenticated, user, logout } = useAuthContext();

  const handleLogout = () => {
    if (window.confirm("Are you sure you want to logout from the stall reservation system?")) {
      logout();
    }
  };

  const menuVariants = {
    hidden: { x: "100%" },
    visible: {
      x: 0,
      transition: { type: "spring", stiffness: 300, damping: 30 },
    },
    exit: {
      x: "100%",
      transition: { type: "spring", stiffness: 300, damping: 30 },
    },
  };

  return (
    <>
      <nav className="bg-slate-900 shadow-md border-b border-slate-800 text-white">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <Link to="/" className="text-2xl font-bold tracking-wide flex items-center">
            BookFair<span className="text-blue-500">.</span>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-8 text-sm font-medium">
            <Link to="/" className="hover:text-blue-400 transition-colors">Home</Link>
            
            {isAuthenticated ? (
              <>
                {user?.role === "Organizer" ? (
                  <>
                    <Link to="/admin" className="hover:text-blue-400 transition-colors">Dashboard</Link>
                    <Link to="/admin/reservations" className="hover:text-blue-400 transition-colors">All Reservations</Link>
                  </>
                ) : (
                  <>
                    <Link to="/dashboard" className="hover:text-blue-400 transition-colors">Dashboard</Link>
                    <Link to="/reservations/my" className="hover:text-blue-400 transition-colors">My Reservations</Link>
                    <Link to="/reservations/create" className="hover:text-blue-400 transition-colors">Create Booking</Link>
                  </>
                )}
                
                <Link to="/profile" className="hover:text-blue-400 transition-colors font-semibold text-blue-200 bg-blue-900/40 px-3.5 py-1.5 rounded-xl border border-blue-800">
                  Profile ({user?.name})
                </Link>

                <button
                  onClick={handleLogout}
                  className="ml-4 px-4 py-2 border border-red-500/30 text-red-400 rounded-xl hover:bg-red-600 hover:text-white transition-colors cursor-pointer"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/sign-in"
                  className="px-4 py-2 bg-blue-700 hover:bg-blue-600 text-white rounded-xl transition-colors cursor-pointer"
                >
                  Sign In (SSO)
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden text-white text-2xl"
            onClick={() => setMenuOpen(true)}
          >
            ☰
          </button>
        </div>
      </nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            className="fixed top-0 right-0 h-full w-72 bg-slate-900 text-white z-50 shadow-2xl border-l border-slate-800"
            variants={menuVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <div className="flex justify-between items-center p-6 border-b border-slate-800">
              <span className="font-semibold text-lg">Menu</span>
              <button className="text-xl" onClick={() => setMenuOpen(false)}>
                ✕
              </button>
            </div>

            <div className="flex flex-col gap-6 p-6 text-sm">
              <Link to="/" onClick={() => setMenuOpen(false)} className="hover:text-blue-400 transition-colors">Home</Link>

              {isAuthenticated ? (
                <>
                  {user?.role === "Organizer" ? (
                    <>
                      <Link to="/admin" onClick={() => setMenuOpen(false)} className="hover:text-blue-400 transition-colors">Dashboard</Link>
                      <Link to="/admin/reservations" onClick={() => setMenuOpen(false)} className="hover:text-blue-400 transition-colors">All Reservations</Link>
                    </>
                  ) : (
                    <>
                      <Link to="/dashboard" onClick={() => setMenuOpen(false)} className="hover:text-blue-400 transition-colors">Dashboard</Link>
                      <Link to="/reservations/my" onClick={() => setMenuOpen(false)} className="hover:text-blue-400 transition-colors">My Reservations</Link>
                      <Link to="/reservations/create" onClick={() => setMenuOpen(false)} className="hover:text-blue-400 transition-colors">Create Booking</Link>
                    </>
                  )}
                  
                  <Link to="/profile" onClick={() => setMenuOpen(false)} className="text-blue-300">
                    Profile ({user?.name})
                  </Link>

                  <button
                    onClick={() => {
                      handleLogout();
                      setMenuOpen(false);
                    }}
                    className="mt-4 border border-red-500/40 text-red-400 py-2.5 rounded-xl hover:bg-red-600 hover:text-white transition-colors cursor-pointer"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link to="/sign-in" onClick={() => setMenuOpen(false)} className="bg-blue-700 hover:bg-blue-600 text-white py-2.5 rounded-xl text-center">
                    Sign In (SSO)
                  </Link>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Navbar;
