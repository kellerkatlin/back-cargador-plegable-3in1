export interface CartItem {
  id: string;
  color: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface Cart {
  items: CartItem[];
  totalQuantity: number;
  totalAmount: number;
}
