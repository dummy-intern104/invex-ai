
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import AuthService from '@/services/authService';
import useAppStore from '@/store/appStore';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  authChecked: boolean;
  isLoading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function useAuthContext() {
  return useAuth();
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);
  const { 
    setupRealtimeUpdates, 
    syncDataWithSupabase, 
    setProducts, 
    setSales, 
    setClients, 
    setPayments, 
    setMeetings, 
    setProductExpiries,
    loadProductExpiries,
    setCurrentUser // Add this import from the store
  } = useAppStore();

  const clearUserData = () => {
    console.log('AUTH: Clearing all user data for user switch');
    setProducts([]);
    setSales([]);
    setClients([]);
    setPayments([]);
    setMeetings([]);
    setProductExpiries([]);
    setCurrentUser(null); // Clear current user in store
  };

  useEffect(() => {
    let isMounted = true;

    const initializeAuth = async () => {
      try {
        const { session: initialSession } = await AuthService.getSession();
        
        if (isMounted) {
          setSession(initialSession);
          setUser(initialSession?.user || null);
          
          // Update store's currentUser
          if (initialSession?.user) {
            console.log('AUTH: User authenticated, updating store currentUser');
            setCurrentUser(initialSession.user);
            clearUserData();
            
            // Force immediate sync with server data
            setTimeout(async () => {
              try {
                console.log('AUTH: Starting data sync for authenticated user');
                await syncDataWithSupabase({ silent: false });
                await loadProductExpiries();
                setupRealtimeUpdates(initialSession.user.id);
              } catch (error) {
                console.error('AUTH: Error syncing data on init:', error);
              }
            }, 100);
          } else {
            setCurrentUser(null);
          }
        }
      } catch (error) {
        console.error('AUTH: Error getting initial session:', error);
      } finally {
        if (isMounted) {
          setLoading(false);
          setAuthChecked(true);
        }
      }
    };

    initializeAuth();

    const subscription = AuthService.onAuthStateChange((user) => {
      console.log('AUTH: Auth state change:', user?.id);
      
      if (isMounted) {
        const previousUserId = session?.user?.id;
        const newUserId = user?.id;
        
        setUser(user);
        setSession(user ? { user } as Session : null);
        
        // Update store's currentUser
        setCurrentUser(user);
        console.log('AUTH: Updated store currentUser:', user?.id || 'null');
        
        if (user && newUserId !== previousUserId) {
          console.log('AUTH: New user signed in, clearing data and syncing');
          clearUserData();
          setCurrentUser(user); // Set again after clearing
          
          // Force immediate sync for new user
          setTimeout(async () => {
            try {
              console.log('AUTH: Starting data sync for new user');
              await syncDataWithSupabase({ silent: false });
              await loadProductExpiries();
              setupRealtimeUpdates(user.id);
            } catch (error) {
              console.error('AUTH: Error syncing data for new user:', error);
            }
          }, 100);
        } else if (!user) {
          console.log('AUTH: User signed out, clearing data');
          clearUserData();
        }
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [setupRealtimeUpdates, syncDataWithSupabase, setProducts, setSales, setClients, setPayments, setMeetings, setProductExpiries, loadProductExpiries, setCurrentUser, session?.user?.id]);

  const signOut = async () => {
    try {
      clearUserData();
      await AuthService.signOut();
      setUser(null);
      setSession(null);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const value = {
    user,
    session,
    loading,
    authChecked,
    isLoading: loading,
    signOut,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
