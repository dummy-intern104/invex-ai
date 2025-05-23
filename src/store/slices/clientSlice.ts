
import { create } from 'zustand';
import { Client } from '@/types';
import { toast } from 'sonner';
import { ClientState } from '../types';

export const createClientSlice = (set: any, get: any) => ({
  clients: [],
  
  setClients: (clients: Client[]) => set({ clients }),
  
  addClient: (clientData) => set((state: ClientState) => {
    const newClient: Client = {
      id: state.clients.length > 0 ? Math.max(...state.clients.map(c => c.id)) + 1 : 1,
      name: clientData.name,
      email: clientData.email,
      phone: clientData.phone,
      totalPurchases: 0,
      totalSpent: 0,
      lastPurchase: new Date().toISOString(),
      joinDate: clientData.joinDate || new Date().toISOString(),
      openInvoices: clientData.openInvoices || 0,
    };
    
    toast.success("Client added successfully");
    return { clients: [...state.clients, newClient] };
  }),
  
  deleteClient: (clientId) => set((state: ClientState) => {
    toast.success("Client deleted successfully");
    return { clients: state.clients.filter(client => client.id !== clientId) };
  }),
  
  removeClient: (clientId) => set((state: ClientState) => {
    toast.success("Client deleted successfully");
    return { clients: state.clients.filter(client => client.id !== clientId) };
  }),
  
  // Fix the duplicate purchase counting issue
  updateClientPurchase: (clientName, amount) => set((state: ClientState) => {
    // Only update if there is an actual client name - prevent empty client updates
    if (!clientName) return { clients: state.clients };
    
    // Check if the client already exists
    const clientExists = state.clients.some(client => client.name === clientName);
    
    // If client doesn't exist, we don't update anything
    if (!clientExists) return { clients: state.clients };
    
    // Update client if exists
    const updatedClients = state.clients.map(client => {
      if (client.name === clientName) {
        return {
          ...client,
          totalPurchases: client.totalPurchases + 1,
          totalSpent: client.totalSpent + amount,
          lastPurchase: new Date().toISOString(),
        };
      }
      return client;
    });
    
    return { clients: updatedClients };
  })
});

export const useClientStore = create<ClientState>((set, get) => 
  createClientSlice(set, get)
);

export default useClientStore;
