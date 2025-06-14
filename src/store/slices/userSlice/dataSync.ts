
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

// Track active subscriptions to prevent duplicates
let activeSubscriptions = new Set<string>();

// Enhanced conflict detection and resolution
interface DataConflict {
  local: any;
  remote: any;
  field: string;
}

/**
 * Detect conflicts between local and remote data
 */
const detectConflicts = (localData: any, remoteData: any): DataConflict[] => {
  const conflicts: DataConflict[] = [];
  
  if (!localData || !remoteData) {
    return conflicts;
  }
  
  // Compare each data type
  ['products', 'sales', 'clients', 'payments'].forEach(field => {
    const localArray = localData[field] || [];
    const remoteArray = remoteData[field] || [];
    
    if (JSON.stringify(localArray) !== JSON.stringify(remoteArray)) {
      conflicts.push({
        local: localArray,
        remote: remoteArray,
        field
      });
    }
  });
  
  return conflicts;
};

/**
 * Resolve conflicts with user preference for remote data (server data wins)
 */
const resolveConflicts = (conflicts: DataConflict[]): any => {
  const resolved: any = {};
  
  conflicts.forEach(conflict => {
    // For cross-device sync, prefer remote data (server data wins)
    resolved[conflict.field] = conflict.remote;
    console.log(`DATASYNC: Resolved conflict for ${conflict.field} - using server data`);
  });
  
  return resolved;
};

export async function saveUserDataToSupabase(userId: string, state: any) {
  console.log("DATASYNC: Saving data to Supabase for user:", userId);
  
  // Check if user is authenticated
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.id !== userId) {
    console.error("DATASYNC: User not authenticated or ID mismatch");
    toast.error("Authentication required to save data");
    throw new Error("Authentication required");
  }
  
  try {
    // Get current data to save
    const userData = {
      user_id: userId,
      products: state.products || [],
      sales: state.sales || [],
      clients: state.clients || [],
      payments: state.payments || [],
      updated_at: new Date().toISOString()
    };
    
    console.log("DATASYNC: Saving data:", {
      productsCount: userData.products.length,
      salesCount: userData.sales.length,
      clientsCount: userData.clients.length,
      paymentsCount: userData.payments.length
    });
    
    const { error } = await supabase
      .from('user_data')
      .upsert(userData as any, { 
        onConflict: 'user_id',
        ignoreDuplicates: false
      });
    
    if (error) {
      console.error('DATASYNC: Error saving data to Supabase:', error);
      toast.error("Failed to save your changes");
      throw error;
    } else {
      console.log("DATASYNC: Data successfully saved to Supabase");
    }
  } catch (error) {
    console.error('DATASYNC: Error saving to Supabase:', error);
    toast.error("Error saving your changes");
    throw error;
  }
}

export async function fetchUserDataFromSupabase(userId: string, options: { skipConflictCheck?: boolean } = {}) {
  console.log("DATASYNC: Starting data sync for user:", userId);
  
  // Check if user is authenticated
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.id !== userId) {
    console.error("DATASYNC: User not authenticated or ID mismatch");
    if (!options.skipConflictCheck) {
      toast.error("Authentication required to load data");
    }
    throw new Error("Authentication required");
  }
  
  try {
    // Fetch user data from the user_data table
    const { data: userData, error: userDataError } = await supabase
      .from('user_data')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    // Fetch product expiry data from the product_expiry table
    const { data: expiryData, error: expiryError } = await supabase
      .from('product_expiry')
      .select('*')
      .eq('user_id', userId)
      .order('expiry_date', { ascending: true });
    
    if (userDataError && userDataError.code !== 'PGRST116') {
      console.error('DATASYNC: Error fetching user data:', userDataError);
      if (!options.skipConflictCheck) {
        toast.error("Failed to load your data");
      }
      throw userDataError;
    }
    
    if (expiryError) {
      console.error('DATASYNC: Error fetching expiry data:', expiryError);
      // Don't throw on expiry error, just log and continue with empty array
    }
    
    const productExpiries = expiryData || [];
    console.log("DATASYNC: Fetched expiry data:", productExpiries.length, "records");
    
    if (!userData) {
      console.log("DATASYNC: No existing user data found - this might be a new device or first login");
      return {
        products: [],
        sales: [],
        clients: [],
        payments: [],
        productExpiries
      };
    } 
    
    console.log('DATASYNC: Found existing data for user:', {
      productsCount: Array.isArray(userData.products) ? userData.products.length : 0,
      salesCount: Array.isArray(userData.sales) ? userData.sales.length : 0,
      clientsCount: Array.isArray(userData.clients) ? userData.clients.length : 0,
      paymentsCount: Array.isArray(userData.payments) ? userData.payments.length : 0,
      expiryCount: productExpiries.length,
      lastUpdated: userData.updated_at
    });
    
    return {
      products: userData.products || [],
      sales: userData.sales || [],
      clients: userData.clients || [],
      payments: userData.payments || [],
      productExpiries
    };
  } catch (error) {
    console.error('DATASYNC: Error fetching data from Supabase:', error);
    if (!options.skipConflictCheck) {
      toast.error("Error loading your data");
    }
    throw error;
  }
}

export async function createEmptyUserData(userId: string) {
  console.log("DATASYNC: Creating empty user data record for user:", userId);
  
  // Check if user is authenticated
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.id !== userId) {
    console.error("DATASYNC: User not authenticated or ID mismatch");
    toast.error("Authentication required to initialize data");
    throw new Error("Authentication required");
  }
  
  try {
    const userData = {
      user_id: userId,
      products: [],
      sales: [],
      clients: [],
      payments: []
    };
    
    const { error } = await supabase
      .from('user_data')
      .insert(userData as any);
      
    if (error) {
      console.error('DATASYNC: Error inserting empty data to Supabase:', error);
      toast.error("Failed to initialize your data");
      throw error;
    } else {
      console.log("DATASYNC: Successfully created empty data record in Supabase");
      return {
        products: [],
        sales: [],
        clients: [],
        payments: [],
        productExpiries: []
      };
    }
  } catch (error) {
    console.error('DATASYNC: Error creating empty user data:', error);
    toast.error("Failed to initialize your data");
    throw error;
  }
}

export function setupRealtimeSubscription(userId: string, dataUpdateCallback: (data: any) => void) {
  const subscriptionKey = `user_data_${userId}`;
  
  // Check if subscription already exists
  if (activeSubscriptions.has(subscriptionKey)) {
    console.log("DATASYNC: Subscription already exists for user:", userId);
    return () => {
      console.log("DATASYNC: Cleanup called for existing subscription");
      activeSubscriptions.delete(subscriptionKey);
      supabase.removeAllChannels();
    };
  }
  
  console.log("DATASYNC: Setting up NEW realtime subscription for user:", userId);
  
  // Clean up any existing channels to prevent duplicate subscriptions
  try {
    supabase.removeAllChannels();
    activeSubscriptions.clear(); // Clear tracking as well
    console.log("DATASYNC: Removed all existing channels before setting up new subscription");
  } catch (e) {
    console.error("DATASYNC: Error removing existing channels:", e);
  }
  
  // Mark this subscription as active
  activeSubscriptions.add(subscriptionKey);
  
  // Set up realtime subscription for user_data table
  const userDataChannel = supabase
    .channel(`user_data_changes_${userId}`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'user_data',
        filter: `user_id=eq.${userId}`
      },
      (payload) => {
        console.log("DATASYNC: Received user_data realtime update:", {
          userId,
          updateTime: payload.new?.updated_at,
          hasNewData: !!payload.new
        });
        
        if (payload.new) {
          const updateTime = new Date(payload.new.updated_at).getTime();
          const now = Date.now();
          const isRecentUpdate = (now - updateTime) < 60000; // Within last 1 minute
          
          if (isRecentUpdate) {
            console.log("DATASYNC: Processing user_data update from another device");
            dataUpdateCallback(payload.new);
          }
        }
      }
    )
    .subscribe((status) => {
      console.log("DATASYNC: User data subscription status:", status, "for user:", userId);
    });

  // Set up realtime subscription for product_expiry table
  const expiryChannel = supabase
    .channel(`expiry_changes_${userId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'product_expiry',
        filter: `user_id=eq.${userId}`
      },
      (payload) => {
        console.log("DATASYNC: Received expiry realtime update:", {
          event: payload.eventType,
          userId,
          hasNewData: !!payload.new
        });
        
        // Trigger a refresh of expiry data
        if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE' || payload.eventType === 'DELETE') {
          console.log("DATASYNC: Expiry data changed, triggering refresh");
          // The callback will handle refreshing expiry data
          dataUpdateCallback({ refreshExpiry: true });
        }
      }
    )
    .subscribe((status) => {
      console.log("DATASYNC: Expiry subscription status:", status, "for user:", userId);
    });
  
  // Return enhanced cleanup function
  return () => {
    console.log("DATASYNC: Removing realtime subscriptions for user:", userId);
    activeSubscriptions.delete(subscriptionKey);
    supabase.removeChannel(userDataChannel);
    supabase.removeChannel(expiryChannel);
  };
}
