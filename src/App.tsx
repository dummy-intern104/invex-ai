
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useState, useEffect } from "react";
import { supabase } from "./integrations/supabase/client";
import MainLayout from "./components/layout/MainLayout";
import Dashboard from "./pages/Dashboard";
import Products from "./pages/Products";
import Sales from "./pages/Sales";
import History from "./pages/History";
import Payments from "./pages/Payments";
import Clients from "./pages/Clients";
import ClientDetail from "./pages/ClientDetail";
import NotFound from "./pages/NotFound";
import Auth from "./pages/Auth";
import useAppStore from "./store/appStore";
import { toast } from "sonner";
import { Skeleton } from "./components/ui/skeleton";

const queryClient = new QueryClient();

const App = () => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const setCurrentUser = useAppStore(state => state.setCurrentUser);
  const syncDataWithSupabase = useAppStore(state => state.syncDataWithSupabase);
  const clearLocalData = useAppStore(state => state.clearLocalData);

  useEffect(() => {
    console.log("Setting up auth state listeners...");
    
    // Set up auth state listener first
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log("Auth state changed:", event);
        const currentUser = session?.user ?? null;
        setUser(currentUser);
        setCurrentUser(currentUser);
        
        if (currentUser) {
          // When user logs in, sync their data from Supabase to local state
          try {
            console.log("User authenticated, syncing data...");
            await syncDataWithSupabase();
            console.log("Data synced successfully after auth change");
            toast.success("Your data has been loaded");
          } catch (error) {
            console.error("Error syncing data after auth change:", error);
            toast.error("Failed to load your data. Please refresh and try again.");
          } finally {
            setLoading(false);
          }
        } else if (event === 'SIGNED_OUT') {
          // When user logs out, clear local data
          console.log("User signed out, clearing local data");
          clearLocalData();
          setLoading(false);
        }
      }
    );

    // Check for existing session
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const currentUser = session?.user ?? null;
        console.log("Initial session check:", currentUser ? "User is logged in" : "No user session");
        
        setUser(currentUser);
        setCurrentUser(currentUser);
        
        if (currentUser) {
          // If user is already logged in, sync their data
          try {
            console.log("User already authenticated, syncing data on initial load...");
            await syncDataWithSupabase();
            console.log("Data synced successfully on initial load");
          } catch (error) {
            console.error("Error syncing data on initial load:", error);
            toast.error("Failed to load your data. Please refresh the page.");
          }
        }
      } catch (error) {
        console.error("Error checking session:", error);
      } finally {
        // Always set loading to false after checking session
        setLoading(false);
      }
    };

    checkSession();

    return () => subscription.unsubscribe();
  }, [setCurrentUser, syncDataWithSupabase, clearLocalData]);

  // Loading component
  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background p-4">
        <div className="w-full max-w-md space-y-4">
          <div className="text-center">
            <h1 className="text-2xl font-bold">Loading your data...</h1>
            <p className="text-muted-foreground mt-2">Please wait a moment</p>
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        </div>
      </div>
    );
  }

  // Protected route component
  const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
    if (!user) {
      return <Navigate to="/auth" />;
    }
    
    return <>{children}</>;
  };

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/auth" element={user ? <Navigate to="/" /> : <Auth />} />
            
            <Route path="/" element={
              <ProtectedRoute>
                <MainLayout>
                  <Dashboard />
                </MainLayout>
              </ProtectedRoute>
            } />
            
            <Route path="/products" element={
              <ProtectedRoute>
                <MainLayout>
                  <Products />
                </MainLayout>
              </ProtectedRoute>
            } />
            
            <Route path="/sales" element={
              <ProtectedRoute>
                <MainLayout>
                  <Sales />
                </MainLayout>
              </ProtectedRoute>
            } />
            
            <Route path="/history" element={
              <ProtectedRoute>
                <MainLayout>
                  <History />
                </MainLayout>
              </ProtectedRoute>
            } />
            
            <Route path="/payments" element={
              <ProtectedRoute>
                <MainLayout>
                  <Payments />
                </MainLayout>
              </ProtectedRoute>
            } />
            
            <Route path="/clients" element={
              <ProtectedRoute>
                <MainLayout>
                  <Clients />
                </MainLayout>
              </ProtectedRoute>
            } />
            
            <Route path="/clients/:clientId" element={
              <ProtectedRoute>
                <MainLayout>
                  <ClientDetail />
                </MainLayout>
              </ProtectedRoute>
            } />
            
            <Route path="/products/low-stock" element={
              <ProtectedRoute>
                <MainLayout>
                  <Products filterType="low-stock" />
                </MainLayout>
              </ProtectedRoute>
            } />
            
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
