
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AppState } from './types';

import { createProductSlice } from './slices/productSlice';
import { createSaleSlice } from './slices/saleSlice';
import { createClientSlice } from './slices/clientSlice';
import { createPaymentSlice } from './slices/paymentSlice';
import { createUserSlice } from './slices/userSlice';

// Ensure we import React to fix the useSyncExternalStore issue
import React from 'react';

// Create a combined store with all slices
const useAppStore = create<AppState>()(
  persist(
    (...args) => {
      // Extract set and get from args
      const [set, get] = args;
      
      // Initialize user slice first (without the save function yet)
      let userSlice = createUserSlice(set, get, async () => {
        // This will be replaced with the real function
      });
      
      // Create individual slices with cross-slice access
      const productSlice = createProductSlice(set, get);
      
      const clientSlice = createClientSlice(set, get);
      
      const saleSlice = createSaleSlice(
        set, 
        get, 
        // Give sale slice access to products
        () => get().products,
        // Method to update a product from the sale slice
        (updatedProduct) => {
          set((state: AppState) => ({
            products: state.products.map(p => 
              p.product_id === updatedProduct.product_id ? updatedProduct : p
            )
          }));
        },
        // Method to update client purchase history
        (clientName, amount) => {
          clientSlice.updateClientPurchase(clientName, amount);
        }
      );
      
      const paymentSlice = createPaymentSlice(
        set, 
        get,
        // Give payment slice access to update client
        (clientName: string, amount: number) => {
          clientSlice.updateClientPurchase(clientName, amount);
        }
      );
      
      // Define the save method for syncing with Supabase
      const saveDataToSupabase = async () => {
        return await userSlice.saveDataToSupabase();
      };
      
      // Now re-create user slice with the proper save function
      userSlice = createUserSlice(set, get, saveDataToSupabase);
      
      // Add listeners to save data when it changes
      const originalSet = set;
      const setWithSave = (fn: any) => {
        originalSet(fn);
        // Debounce the save operation to avoid too many requests
        const state = get();
        if (state.currentUser) {
          // Use setTimeout to avoid blocking the UI
          setTimeout(() => {
            saveDataToSupabase().catch(error => {
              console.error("Error saving data after change:", error);
            });
          }, 100);
        }
      };
      
      // Combine all slices
      return {
        ...productSlice,
        ...saleSlice,
        ...clientSlice,
        ...paymentSlice,
        ...userSlice,
        
        // Override set method for specific actions to trigger Supabase sync
        setProducts: (products) => {
          setWithSave({ products });
        },
        setSales: (sales) => {
          setWithSave({ sales });
        },
        setClients: (clients) => {
          setWithSave({ clients });
        },
        setPayments: (payments) => {
          setWithSave({ payments });
        },
      };
    },
    {
      name: 'invex-store', // Name for the persisted storage
      partialize: (state) => {
        // We'll still persist some data locally for faster initial loads
        // but the authoritative data source is Supabase
        const { currentUser, ...rest } = state;
        return rest;
      },
    }
  )
);

export default useAppStore;
