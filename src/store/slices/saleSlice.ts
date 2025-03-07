
import { create } from 'zustand';
import { Sale, Product } from '@/types';
import { toast } from 'sonner';

export interface SaleState {
  sales: Sale[];
  recordSale: (sale: Omit<Sale, 'sale_id' | 'sale_date'>) => void;
  deleteSale: (saleId: number) => void;
  // For store combination
  setSales: (sales: Sale[]) => void;
}

export const createSaleSlice = (
  set: any, 
  get: any, 
  getProducts: () => Product[], 
  updateProduct: (updatedProduct: Product) => void
) => ({
  sales: [],
  
  setSales: (sales: Sale[]) => set({ sales }),
  
  recordSale: (saleData) => {
    const products = getProducts();
    // Find the product
    const product = products.find(p => p.product_id === saleData.product_id);
    
    if (!product) {
      toast.error("Product not found");
      return;
    }
    
    // Create new sale
    set((state: SaleState) => {
      const newSale: Sale = {
        sale_id: state.sales.length > 0 ? Math.max(...state.sales.map(s => s.sale_id)) + 1 : 1,
        product_id: saleData.product_id,
        quantity_sold: saleData.quantity_sold,
        selling_price: saleData.selling_price,
        sale_date: new Date().toISOString(),
        product
      };
      
      toast.success(`Sale recorded successfully: ${saleData.quantity_sold} ${product.product_name}(s)`);
      
      return { 
        sales: [newSale, ...state.sales]
      };
    });
    
    // Update product stock in the product store
    const currentUnits = parseInt(product.units as string);
    const newUnits = Math.max(0, currentUnits - saleData.quantity_sold);
    const updatedProduct = { 
      ...product, 
      units: newUnits.toString() 
    };
    
    updateProduct(updatedProduct);
  },
  
  deleteSale: (saleId) => {
    const state = get();
    // Find the sale to be deleted
    const saleToDelete = state.sales.find((sale: Sale) => sale.sale_id === saleId);
    
    if (!saleToDelete) {
      toast.error("Sale not found");
      return;
    }
    
    // Update product stock in the product store
    const products = getProducts();
    const product = products.find(p => p.product_id === saleToDelete.product_id);
    
    if (product) {
      const currentUnits = parseInt(product.units as string);
      const newUnits = currentUnits + saleToDelete.quantity_sold;
      const updatedProduct = { 
        ...product, 
        units: newUnits.toString() 
      };
      
      updateProduct(updatedProduct);
    }
    
    // Remove the sale
    set((state: SaleState) => {
      toast.success("Sale deleted successfully");
      return { 
        sales: state.sales.filter(sale => sale.sale_id !== saleId)
      };
    });
  }
});

// This is just a placeholder since the standalone store needs the product store
// The actual implementation will be in the root store
const useStandaloneSaleStore = create<SaleState>((set, get) => 
  createSaleSlice(set, get, () => [], () => {})
);

export default useStandaloneSaleStore;
