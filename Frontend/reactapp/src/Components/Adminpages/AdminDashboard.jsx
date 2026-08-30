import React, { useEffect, useMemo, useState } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Store,
  Ticket,
  Users,
  IndianRupee,
  Bell,
  LogOut,
  ChevronDown,
  Menu,
  X,
  Map,
  Building2,
  ClipboardList,
  BarChart3,
  Settings,
  Shield,
  Activity,
  Home,
  TrendingUp,
  QrCode,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Authentication from "../../services/Authentication";
import Admin from "../../services/Admin";

/* ----------------------------
   ICON MAP (backend can send iconKey)
   Example backend item: { text:"Users", to:"/admin/users", iconKey:"Users" }
---------------------------- */
const ICONS = {
  LayoutDashboard: <LayoutDashboard size={18} />,
  Store: <Store size={18} />,
  Ticket: <Ticket size={18} />,
  Users: <Users size={18} />,
  IndianRupee: <IndianRupee size={18} />,
  Bell: <Bell size={18} />,
  Map: <Map size={18} />,
  Building2: <Building2 size={18} />,
  ClipboardList: <ClipboardList size={18} />,
  LogOut: <LogOut size={18} />,
  BarChart3: <BarChart3 size={18} />,
  Settings: <Settings size={18} />,
  Shield: <Shield size={18} />,
  Activity: <Activity size={18} />,
  Home: <Home size={18} />,
  TrendingUp: <TrendingUp size={18} />,
  QrCode: <QrCode size={18} />,
};

const AdminDashboard = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [pendingReservations, setPendingReservations] = useState([]);

  const navigate = useNavigate();

  // Check authentication and admin role
  useEffect(() => {
    if (!Authentication.isAuthenticated()) {
      navigate("/sign-in");
      return;
    }
    if (!Authentication.isAdmin()) {
      navigate("/");
      return;
    }
  }, [navigate]);

  // backend menu
  const [sidebarSections, setSidebarSections] = useState([
    {
      title: "Dashboard",
      items: [
        { text: "Dashboard", to: "/admin", iconKey: "BarChart3" },
      ],
    },
    {
      title: "User Management",
      items: [{ text: "Users", to: "/admin/users", iconKey: "Users" }],
    },

    {
      title: "Event & Venue",
      items: [
        { text: "Events", to: "/admin/events", iconKey: "Ticket" },
        // { text: "Venues", to: "/admin/venues", iconKey: "Building2" },
        { text: "Venue Maps", to: "/admin/maps", iconKey: "Map" },
      ],
    },
    {
      title: "Stall Management",
      items: [
        {
          key: "fallback-stalls",
          text: "Manage Stalls",
          iconKey: "Store",
          children: [
            { text: "All Stalls", to: "/admin/stalls", iconKey: "Store" },
            { text: "Pricing", to: "/admin/stallPricing", iconKey: "IndianRupee" },
            {
              text: "Reservations",
              to: "/admin/reservations",
              iconKey: "Ticket",
              badge: pendingReservations.length,
            },
          ],
        },
      ],
    },
    {
      title: "QR Pass Management",
      items: [
        { text: "QR Passes", to: "/admin/qrpasses", iconKey: "QrCode" },
      ],
    },
    {
      title: "Payments",
      items: [
        { text: "Payment Logs", to: "/admin/payments", iconKey: "IndianRupee" },
        { text: "Transactions", to: "/admin/transactions", iconKey: "CreditCard" },
      ],
    },

    {
      title: "Settings",
      items: [
        { text: "Notifications", to: "/admin/notifications", iconKey: "Bell" },
        { text: "Security", to: "/admin/security", iconKey: "Shield" },
        { text: "System Settings", to: "/admin/settings", iconKey: "Settings" },
        { text: "Logout", action: "logout", iconKey: "LogOut", danger: true },
      ],
    },
  ]);

  // dropdown state keyed by "sectionIndex-itemIndex"
  const [openDropdowns, setOpenDropdowns] = useState({});

  const location = useLocation();

  const closeMobile = () => setMobileOpen(false);

  /* ----------------------------
     AUTH + DATA
  ---------------------------- */
  useEffect(() => {
    // Admin.getPendingReservations()
    //   .then((res) => {
    //     if (res?.statusCode === 200 || res?.status === 200) {
    //       setPendingReservations(
    //         res?.reservations || res?.data?.reservations || []
    //       );
    //     }
    //   })
    //   .catch((err) => {
    //     if (err.response?.status === 401) {
    //       Authentication.logout();
    //       navigate("/sign-in");
    //     }
    //   });
  }, [navigate]);

  // Set sidebar sections to fallback since backend doesn't have getSidebar
  // Removed useEffect as sidebarSections is initialized with the array

  /* ----------------------------
     AUTO OPEN dropdown for known routes
  ---------------------------- */
  useEffect(() => {
    const stallRoutes = ["/admin/stalls", "/admin/stallPricing", "/admin/reservations"];
    const insideStalls = stallRoutes.some((p) => location.pathname.startsWith(p));
    if (insideStalls) {
      // if using fallback menu dropdown key "fallback-stalls"
      setOpenDropdowns((p) => ({ ...p, ["fallback-stalls"]: true }));
    }
  }, [location.pathname]);

  const handleLogout = () => {
    Authentication.logout();
    navigate("/");
  };

  /* ----------------------------
     FALLBACK MENU (if backend not available)
  ---------------------------- */
  const fallbackSections = useMemo(() => {
    return [
      {
        title: "Dashboard",
        items: [
          { text: "Home", to: "/admin", iconKey: "Home" },
          { text: "Statistics", to: "/admin/statistics", iconKey: "BarChart3" },
        ],
      },
      {
        title: "User Management",
        items: [{ text: "Users", to: "/admin/users", iconKey: "Users" }],
      },
      {
        title: "Business Management",
        items: [
          { text: "Businesses", to: "/admin/businesses", iconKey: "Store" },
          { text: "Publishers / Vendors", to: "/admin/vendors", iconKey: "Users" },
        ],
      },
      {
        title: "Event & Venue",
        items: [
          { text: "Events", to: "/admin/events", iconKey: "Ticket" },
          { text: "Venues", to: "/admin/venues", iconKey: "Building2" },
          { text: "Venue Maps", to: "/admin/venue-maps", iconKey: "Map" },
        ],
      },
      {
        title: "Stall Management",
        items: [
          {
            key: "fallback-stalls",
            text: "Manage Stalls",
            iconKey: "Store",
            children: [
              { text: "All Stalls", to: "/admin/stalls", iconKey: "Store" },
              { text: "Pricing", to: "/admin/stallPricing", iconKey: "IndianRupee" },
              {
                text: "Reservations",
                to: "/admin/reservations",
                iconKey: "Ticket",
                badge: pendingReservations.length,
              },
            ],
          },
        ],
      },
      {
        title: "Operations",
        items: [
          { text: "Email Logs", to: "/admin/emails", iconKey: "Bell" },
          { text: "Audit Logs", to: "/admin/audit-logs", iconKey: "ClipboardList" },
          { text: "Activity Monitor", to: "/admin/activity", iconKey: "Activity" },
        ],
      },
      {
        title: "Settings",
        items: [
          { text: "Notifications", to: "/admin/notifications", iconKey: "Bell" },
          { text: "Security", to: "/admin/security", iconKey: "Shield" },
          { text: "System Settings", to: "/admin/settings", iconKey: "Settings" },
          { text: "Logout", action: "logout", iconKey: "LogOut", danger: true },
        ],
      },
    ];
  }, [pendingReservations.length]);

  const effectiveSections = sidebarSections || [];

  /* ----------------------------
     HELPERS
  ---------------------------- */
  const isPathActive = (to) => {
    if (!to) return false;
    return location.pathname === to || location.pathname.startsWith(to + "/");
  };

  const toggleDropdown = (key) =>
    setOpenDropdowns((p) => ({ ...p, [key]: !p[key] }));

  const resolveIcon = (item) => {
    // backend can send iconKey or you can inject icon already
    if (item?.icon) return item.icon;
    if (item?.iconKey && ICONS[item.iconKey]) return ICONS[item.iconKey];
    return null;
  };

  /* ----------------------------
     SIDEBAR COMPONENT
  ---------------------------- */
  const Sidebar = ({ isMobile = false }) => (
    <motion.aside
      key={isMobile ? "mobileSidebar" : "desktopSidebar"}
      initial={{ x: -260 }}
      animate={{ x: 0 }}
      exit={{ x: -260 }}
      transition={{ type: "spring", stiffness: 260, damping: 28 }}
      className="fixed md:static z-40 h-screen w-72
                 bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950
                 text-neutral-200 border-r border-slate-800/50
                 backdrop-blur-xl shadow-2xl"
    >
      <div className="h-full flex flex-col">
        {/* header */}
        <div className="px-6 py-5 border-b border-slate-800/50 bg-slate-900/50 backdrop-blur-sm">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl shadow-lg">
              <BarChart3 size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">BookFair Admin</h1>
              <p className="text-xs text-slate-400 mt-0.5">Management Portal</p>
            </div>
          </div>

          {isMobile && (
            <button
              onClick={closeMobile}
              className="absolute top-4 right-4 p-2 rounded-lg hover:bg-slate-800/70 transition-colors"
              type="button"
              aria-label="Close sidebar"
            >
              <X size={20} className="text-slate-400" />
            </button>
          )}
        </div>

        {/* nav */}
        <div className="px-4 py-6 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
          <nav className="space-y-8 text-sm">
            {effectiveSections.map((sec, sIdx) => (
              <Section key={sIdx} title={sec.title || ""}>
                {(sec.items || []).map((item, iIdx) => {
                  const key =
                    item.key || `${sIdx}-${iIdx}`; // stable key if backend sends item.key

                  // dropdown
                  if (item.children && item.children.length) {
                    const open = !!openDropdowns[key];

                    // auto-open if any child active
                    const hasActiveChild = item.children.some((c) => isPathActive(c.to));
                    const reallyOpen = open || hasActiveChild;

                    return (
                      <div key={key} className="space-y-1">
                        <button
                          onClick={() => toggleDropdown(key)}
                          className="menu-btn w-full justify-between group"
                          type="button"
                        >
                          <span className="flex items-center gap-3">
                            <div className="p-1.5 rounded-lg bg-slate-800/50 group-hover:bg-slate-700/50 transition-colors">
                              {resolveIcon(item)}
                            </div>
                            <span className="font-medium">{item.text}</span>
                          </span>
                          <ChevronDown
                            size={16}
                            className={`transition-transform duration-200 ${reallyOpen ? "rotate-180" : ""}`}
                          />
                        </button>

                        <AnimatePresence initial={false}>
                          {reallyOpen && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="pl-6 overflow-hidden"
                            >
                              <div className="mt-2 space-y-1 border-l-2 border-slate-700/50 pl-4">
                                {item.children.map((child, cIdx) => (
                                  <NavItem
                                    key={cIdx}
                                    to={child.to}
                                    text={child.text}
                                    icon={resolveIcon(child)}
                                    badge={child.badge}
                                    active={isPathActive(child.to)}
                                    onClick={isMobile ? closeMobile : undefined}
                                  />
                                ))}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  }

                  // action item (logout, etc.)
                  if (item.action === "logout") {
                    return (
                      <button
                        key={key}
                        onClick={() => {
                          handleLogout();
                          if (isMobile) closeMobile();
                        }}
                        className={`menu-btn w-full justify-between group ${item.danger ? "text-red-300 hover:bg-red-500/10 border border-red-500/20" : ""
                          }`}
                        type="button"
                      >
                        <span className="flex items-center gap-3">
                          <div className={`p-1.5 rounded-lg ${item.danger ? 'bg-red-500/20' : 'bg-slate-800/50 group-hover:bg-slate-700/50'} transition-colors`}>
                            {resolveIcon(item)}
                          </div>
                          <span className="font-medium">{item.text}</span>
                        </span>
                      </button>
                    );
                  }

                  // normal link
                  return (
                    <NavItem
                      key={key}
                      to={item.to}
                      text={item.text}
                      icon={resolveIcon(item)}
                      badge={item.badge}
                      active={isPathActive(item.to)}
                      onClick={isMobile ? closeMobile : undefined}
                    />
                  );
                })}
              </Section>
            ))}
          </nav>
        </div>

        {/* footer */}
        <div className="px-4 py-4 border-t border-slate-800/50 bg-slate-900/30">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>v2.1.0</span>
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span>Online</span>
            </div>
          </div>
        </div>
      </div>
    </motion.aside>
  );

  return (
    <div className="flex bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 h-screen overflow-hidden">
      {/* mobile open button */}
      <button
        onClick={() => setMobileOpen(true)}
        className="md:hidden fixed top-4 left-4 z-50 bg-slate-900/90 backdrop-blur-sm p-3 rounded-xl border border-slate-800/50 shadow-2xl hover:bg-slate-800/90 transition-all duration-200"
        type="button"
        aria-label="Open sidebar"
      >
        <Menu size={20} className="text-slate-300" />
      </button>

      {/* mobile sidebar */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <Sidebar isMobile />
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeMobile}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30"
            />
          </>
        )}
      </AnimatePresence>

      {/* desktop sidebar */}
      <div className="hidden md:block">
        <Sidebar />
      </div>

      {/* content */}
      <main className="flex-1 md:ml-0 p-0 overflow-hidden">
        <div className="h-full overflow-y-auto bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
          <div className="min-h-full">
            <Outlet />
          </div>
        </div>
      </main>

      {/* shared styles */}
      <style>{`
        .menu-btn {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.75rem 0.875rem;
          border-radius: 0.75rem;
          width: 100%;
          color: inherit;
          transition: all .2s ease;
          font-weight: 500;
        }
        .menu-btn:hover {
          background: rgba(148,163,184,.08);
          transform: translateX(2px);
        }

        .scrollbar-thin {
          scrollbar-width: thin;
        }
        .scrollbar-thin::-webkit-scrollbar {
          width: 6px;
        }
        .scrollbar-thin::-webkit-scrollbar-track {
          background: transparent;
        }
        .scrollbar-thin::-webkit-scrollbar-thumb {
          background: rgba(148,163,184,.3);
          border-radius: 3px;
        }
        .scrollbar-thin::-webkit-scrollbar-thumb:hover {
          background: rgba(148,163,184,.5);
        }
      `}</style>
    </div>
  );
};

/* ----------------------------
   SMALL UI PARTS
---------------------------- */
const Section = ({ title, children }) => (
  <div className="space-y-3">
    <div className="flex items-center space-x-2">
      <div className="h-px bg-gradient-to-r from-transparent via-slate-700 to-transparent flex-1"></div>
      <p className="px-3 text-[10px] uppercase tracking-widest text-slate-500 font-semibold bg-slate-900/50 rounded-full py-1">
        {title}
      </p>
      <div className="h-px bg-gradient-to-r from-transparent via-slate-700 to-transparent flex-1"></div>
    </div>
    <div className="space-y-1 pl-1">{children}</div>
  </div>
);

const NavItem = ({ to, icon, text, badge = 0, active = false, onClick }) => {
  return (
    <Link
      to={to || "#"}
      onClick={onClick}
      className={`menu-btn justify-between group relative ${active
        ? "bg-gradient-to-r from-blue-600/20 to-purple-600/20 text-white border-l-2 border-blue-500 shadow-lg"
        : "hover:bg-slate-800/40"
        }`}
    >
      <span className="flex items-center gap-3">
        <div className={`p-1.5 rounded-lg transition-colors ${active
          ? 'bg-blue-500/20'
          : 'bg-slate-800/50 group-hover:bg-slate-700/50'
          }`}>
          {icon}
        </div>
        <span className={`font-medium ${active ? 'text-white' : 'text-slate-300'}`}>{text}</span>
      </span>

      {badge > 0 && (
        <span className="text-xs px-2 py-1 rounded-full bg-red-600 text-white font-semibold shadow-lg animate-pulse">
          {badge}
        </span>
      )}

      {active && (
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 to-purple-600/5 rounded-lg pointer-events-none"></div>
      )}
    </Link>
  );
};

export default AdminDashboard;
