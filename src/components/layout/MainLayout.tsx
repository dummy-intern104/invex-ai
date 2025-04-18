
import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { 
  Calendar, 
  Package, 
  History, 
  Users, 
  LayoutDashboard, 
  ShoppingCart, 
  CreditCard,
  Warehouse,
  LogOut
} from "lucide-react";
import DesktopSidebar from "./DesktopSidebar";
import MobileNavigation from "./MobileNavigation";
import { SidebarItemType } from "./types";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import useAppStore from "@/store/appStore";

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout = ({ children }: MainLayoutProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const currentPath = location.pathname;
  const [theme, setTheme] = useState<'light' | 'dark'>(
    localStorage.getItem('theme') as 'light' | 'dark' || 'light'
  );
  const clearLocalData = useAppStore(state => state.clearLocalData);

  useEffect(() => {
    // Update the data-theme attribute on the document element when the theme changes
    const html = document.documentElement;
    html.classList.remove('light', 'dark');
    html.classList.add(theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  const handleLogout = async () => {
    try {
      console.log("Logout initiated");
      
      // Clear local data first
      clearLocalData();
      
      // Sign out from Supabase
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        throw error;
      }
      
      // Show success message and force navigate to auth page
      toast.success("Logged out successfully");
      console.log("Navigation to /auth");
      
      // Use replace instead of navigate to ensure we can't go back
      navigate("/auth", { replace: true });
    } catch (error: any) {
      console.error("Logout error:", error);
      toast.error(error.message || "Error logging out");
    }
  };

  const sidebarItems: SidebarItemType[] = [
    {
      icon: <LayoutDashboard className="w-5 h-5" />,
      label: "Dashboard",
      href: "/",
    },
    {
      icon: <Package className="w-5 h-5" />,
      label: "Products",
      href: "/products",
    },
    {
      icon: <ShoppingCart className="w-5 h-5" />,
      label: "Sales",
      href: "/sales",
    },
    {
      icon: <History className="w-5 h-5" />,
      label: "History",
      href: "/history",
    },
    {
      icon: <CreditCard className="w-5 h-5" />,
      label: "Payments",
      href: "/payments",
    },
    {
      icon: <Users className="w-5 h-5" />,
      label: "Clients",
      href: "/clients",
    },
    {
      icon: <Warehouse className="w-5 h-5" />,
      label: "Stock",
      href: "/stock",
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Main content */}
      <main className="flex-1 flex flex-col h-screen overflow-auto pt-16 md:pt-0 md:pl-64">
        <div className="p-4 md:p-6">{children}</div>
      </main>

      {/* Desktop Sidebar - now positioned on the left */}
      <DesktopSidebar 
        sidebarItems={sidebarItems} 
        currentPath={currentPath} 
        theme={theme} 
        toggleTheme={toggleTheme}
        onLogout={handleLogout}
      />

      {/* Mobile Navigation */}
      <MobileNavigation 
        sidebarItems={sidebarItems} 
        currentPath={currentPath} 
        theme={theme} 
        toggleTheme={toggleTheme}
        onLogout={handleLogout}
      />
    </div>
  );
};

export default MainLayout;
