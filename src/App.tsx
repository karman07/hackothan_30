import React from "react";
import { BrowserRouter as Router, useRoutes, useLocation } from "react-router-dom";
import { routes } from "./routes";
import Sidebar from "./components/layout/Sidebar";

const AppRoutes: React.FC = () => {
  const element = useRoutes(routes);
  return element;
};

const Layout: React.FC = () => {
  const location = useLocation();
  const isAuthRoute = location.pathname === "/login" || location.pathname === "/";

  return (
    <div className="flex h-screen w-screen overflow-hidden">
      {/* Sidebar should not show on login/public routes */}
      {!isAuthRoute && <Sidebar />}
      <div className="flex-1 bg-gray-100 overflow-auto">
        <AppRoutes />
      </div>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <Router>
      <Layout />
    </Router>
  );
};

export default App;
