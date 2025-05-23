
import { toast } from "sonner";
import { AppState } from './types';

// Variable to store the timestamp of the last update from this device
let lastUpdateTimestamp = Date.now();

// Flag to control automatic syncing - Disabled by default
let autoSyncEnabled = false;

/**
 * Configures a store for auto-saving with Supabase
 */
export function configureAutoSave(
  set: any, 
  get: any, 
  saveDataToSupabase: () => Promise<void>
) {
  // Add auto-save functionality when data changes
  const setWithAutoSave = (fn: any) => {
    // Apply the state update
    set(fn);
    
    // Only schedule a save operation if auto-sync is enabled and the user is logged in
    if (autoSyncEnabled) {
      setTimeout(() => {
        const state = get();
        if (state.currentUser) {
          saveDataToSupabase().catch(error => {
            console.error("Error auto-saving data after state change:", error);
          });
        }
      }, 300); // Reduce debounce time for faster sync
    }
  };

  return setWithAutoSave;
}

/**
 * Processes real-time updates from Supabase
 */
export function processRealtimeUpdate(
  userData: any, 
  get: () => AppState, 
  set: (state: any) => void
): boolean {
  // If auto-sync is disabled, ignore updates
  if (!autoSyncEnabled) {
    console.log("Ignoring update: auto-sync is disabled");
    return false;
  }
  
  // Check if this is a recent update from this device
  const currentTime = Date.now();
  if (currentTime - lastUpdateTimestamp < 5000) {
    console.log("Ignoring recent update from this device");
    return false;
  }
  
  // Compare local data with received data to prevent unnecessary updates
  const products = Array.isArray(userData.products) ? userData.products : [];
  const sales = Array.isArray(userData.sales) ? userData.sales : [];
  const clients = Array.isArray(userData.clients) ? userData.clients : [];
  const payments = Array.isArray(userData.payments) ? userData.payments : [];
  
  const currentState = get();
  const hasDataChanged = 
    JSON.stringify(products) !== JSON.stringify(currentState.products) ||
    JSON.stringify(sales) !== JSON.stringify(currentState.sales) ||
    JSON.stringify(clients) !== JSON.stringify(currentState.clients) ||
    JSON.stringify(payments) !== JSON.stringify(currentState.payments);
    
  if (!hasDataChanged) {
    console.log("No changes detected in realtime data, ignoring update");
    return false;
  }
  
  // Always ask user permission before applying changes from another device
  if (confirm("Another device has updated your data. Would you like to sync these changes now?")) {
    console.log("Updating store with realtime data:", { 
      productsCount: products.length,
      salesCount: sales.length,
      clientsCount: clients.length,
      paymentsCount: payments.length
    });
    
    set({
      products,
      sales,
      clients,
      payments
    });
    
    toast.success("Data synchronized from another device", {
      id: "realtime-sync",
      duration: 2000
    });
    
    return true;
  } else {
    // User rejected the sync, so we'll keep their local data
    console.log("User rejected data sync from another device");
    return false;
  }
}

/**
 * Updates the last update timestamp to mark that we've made a local change
 */
export function updateLastTimestamp() {
  lastUpdateTimestamp = Date.now();
}

/**
 * Enable or disable automatic syncing
 */
export function setAutoSync(enabled: boolean) {
  autoSyncEnabled = enabled;
  console.log(`Auto-sync ${enabled ? 'enabled' : 'disabled'}`);
}

/**
 * Check if auto sync is enabled
 */
export function isAutoSyncEnabled() {
  return autoSyncEnabled;
}
