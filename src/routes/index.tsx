import { RouteObject } from "react-router-dom";
import LoginPage from "../pages/LoginPage";
import DashboardPage from "../pages/DashboardPage";
import ProtectedRoute from "../components/ProtectedRoute";
import CertificatesDashboard from "@/pages/CertificatesDashboard";

export const publicRoutes: RouteObject[] = [
  {
    path: "/login",
    element: <LoginPage />,
  },
  {
    path: "/",
    element: <LoginPage />,
  },
];

export const protectedRoutes: RouteObject[] = [
  {
    path: "/dashboard",
    element: (
      <ProtectedRoute>
        <DashboardPage />
      </ProtectedRoute>
    ),
  },
  {
    path: "/certificates",
    element: (
      <ProtectedRoute>
        <CertificatesDashboard />
      </ProtectedRoute>
    ),
  },
];

export const routes: RouteObject[] = [...publicRoutes, ...protectedRoutes];
