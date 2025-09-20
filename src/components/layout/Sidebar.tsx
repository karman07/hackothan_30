import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { File, LayoutDashboard, LogOut, Menu, X } from "lucide-react";

const Sidebar: React.FC = () => {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(true);

  const menuItems = [
    { name: "Dashboard", path: "/dashboard", icon: <LayoutDashboard size={20} /> },
    { name: "Certificates", path: "/certificates", icon: <File size={20} /> },
  ];

  return (
    <div className="flex">
      {/* Sidebar */}
      <motion.div
        animate={{ width: isOpen ? 240 : 64 }}
        className="h-screen bg-gray-900 text-white flex flex-col shadow-xl transition-all duration-300
                   min-w-[64px] max-w-[240px] overflow-hidden"
      >
        {/* Logo + Toggle */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          {isOpen && <h1 className="text-lg font-bold tracking-wide">Hackathon</h1>}
          <button
            className="text-gray-400 hover:text-white"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* Menu Links */}
        <nav className="flex-1 mt-4">
          {menuItems.map((item) => {
            const isActive = location.pathname.startsWith(item.path);
            return (
              <Link key={item.path} to={item.path}>
                <motion.div
                  whileHover={{ x: 6 }} // ✅ hover animation restored
                  className={`flex items-center gap-3 px-4 py-3 mx-2 rounded-xl transition-colors whitespace-nowrap ${
                    isActive
                      ? "bg-indigo-600 text-white"
                      : "text-gray-400 hover:bg-gray-800 hover:text-white"
                  }`}
                >
                  {item.icon}
                  {isOpen && <span>{item.name}</span>}
                </motion.div>
              </Link>
            );
          })}
        </nav>

        {/* Bottom Actions */}
        <div className="p-4 border-t border-gray-700">
          <button className="flex items-center gap-2 text-gray-400 hover:text-red-400 w-full whitespace-nowrap">
            <LogOut size={20} />
            {isOpen && <span>Logout</span>}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default Sidebar;
