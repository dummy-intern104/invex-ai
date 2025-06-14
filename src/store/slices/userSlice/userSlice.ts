
import { create } from 'zustand';
import { toast } from 'sonner';
import { User } from '@supabase/supabase-js';
import { UserState } from './types';
import { saveUserDataToSupabase, fetchUserDataFromSupabase, createEmptyUserData } from './dataSync';
import { isUserDataRow } from '../../types';

export const createUserSlice = (
  set: any,
  get: any,
  saveDataToSupabase: () => Promise<void>
) => ({
  currentUser: null,
  isSignedIn: false,
  isLoading: false,
  
  setCurrentUser: (user: User | null) => set({ currentUser: user, isSignedIn: !!user }),
  
  setIsSignedIn: (isSignedIn: boolean) => set({ isSignedIn }),
  
  setIsLoading: (isLoading: boolean) => set({ isLoading }),
  
  clearLocalData: () => {
    console.log("USER: Clearing local state and all user data");
    const { currentUser } = get();
    if (currentUser) {
      console.log("USER: Saving data before clearing local state");
      saveDataToSupabase()
        .then(() => {
          console.log("USER: Data saved successfully before clearing");
          // Clear all user data when logging out
          set({ 
            currentUser: null, 
            isSignedIn: false,
            products: [],
            sales: [],
            clients: [],
            payments: [],
            meetings: [],
            productExpiries: []
          });
        })
        .catch(error => {
          console.error("USER: Error saving data before clearing:", error);
          // Even if there's an error, still clear user information
          set({ 
            currentUser: null, 
            isSignedIn: false,
            products: [],
            sales: [],
            clients: [],
            payments: [],
            meetings: [],
            productExpiries: []
          });
        });
    } else {
      // No current user, just clear everything
      set({ 
        currentUser: null, 
        isSignedIn: false,
        products: [],
        sales: [],
        clients: [],
        payments: [],
        meetings: [],
        productExpiries: []
      });
    }
  },
  
  syncDataWithSupabase: async (options: { silent?: boolean } = {}) => {
    const { silent = false } = options;
    const { currentUser } = get();
    
    if (!currentUser) {
      console.log("USER: No current user, skipping data sync");
      return;
    }
    
    try {
      const userId = currentUser.id;
      console.log("USER: Syncing data for user:", userId);
      
      // Save current local data first to prevent data loss
      const currentState = get();
      if (currentState.products?.length > 0 || currentState.sales?.length > 0 || 
          currentState.clients?.length > 0 || currentState.payments?.length > 0) {
        console.log("USER: Saving local data before sync to prevent loss");
        await saveUserDataToSupabase(userId, currentState);
      }
      
      const userData = await fetchUserDataFromSupabase(userId, { skipConflictCheck: silent });
      
      if (!userData) {
        // If no data exists in Supabase, create empty record
        console.log('USER: No existing data found, creating empty record');
        await createEmptyUserData(userId);
        set({
          products: [],
          sales: [],
          clients: [],
          payments: [],
          meetings: [],
          productExpiries: []
        });
      } else {
        // If data exists in Supabase, use it to update local state
        try {
          // Safely parse and set products, sales, clients, payments, and productExpiries
          const products = Array.isArray(userData.products) ? userData.products : [];
          const sales = Array.isArray(userData.sales) ? userData.sales : [];
          const clients = Array.isArray(userData.clients) ? userData.clients : [];
          const payments = Array.isArray(userData.payments) ? userData.payments : [];
          const meetings = []; // Meetings are not stored in Supabase yet
          const productExpiries = Array.isArray(userData.productExpiries) ? userData.productExpiries : [];
          
          console.log("USER: Setting data from Supabase:", { 
            productsCount: products.length,
            salesCount: sales.length,
            clientsCount: clients.length,
            paymentsCount: payments.length,
            expiryCount: productExpiries.length,
            silent
          });
          
          // Update store with fetched data
          set({
            products,
            sales,
            clients,
            payments,
            meetings,
            productExpiries
          });
          
          if (!silent) {
            console.log("USER: Data loaded successfully from Supabase");
            toast.success("Data synchronized successfully");
          }
        } catch (parseError) {
          console.error('USER: Error parsing data from Supabase:', parseError);
          if (!silent) {
            toast.error("Error parsing your data");
          }
          throw parseError;
        }
      }
    } catch (error) {
      console.error('USER: Error syncing data with Supabase:', error);
      if (!silent) {
        toast.error("Error synchronizing your data");
      }
      throw error;
    }
  },
  
  saveDataToSupabase: async () => {
    const { currentUser } = get();
    if (!currentUser) {
      console.log("USER: No current user, skipping data save");
      return;
    }
    
    try {
      await saveUserDataToSupabase(currentUser.id, get());
    } catch (error) {
      console.error('USER: Error in saveDataToSupabase:', error);
      throw error;
    }
  },
  
  setupRealtimeUpdates: (): (() => void) => {
    // Implementation is in the main store to handle unsubscribe logic
    return () => {}; // Return empty function as fallback
  }
});

// Standalone store implementation
const useUserStore = create<UserState>((set, get) => 
  createUserSlice(set, get, async () => {})
);

export default useUserStore;
