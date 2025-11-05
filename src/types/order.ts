import type { Customer } from "./customer";

export interface Order {
  id?: string;
  userId: string;
  total: number;
  estado_pago: PaymentStatus;
  estado_envio: ShippingStatus;
  created_at?: string;
  updated_at?: string;
  customers?: Customer;
  order_items?: OrderItem[];
}

export interface OrderItem {
  id?: string;
  order_id?: string;
  color: string;
  cantidad: number;
  precio_unitario: number;
  created_at?: string;
  updated_at?: string;
}

export type PaymentStatus =
  | "pendiente"
  | "adelantado"
  | "pago_restante"
  | "pagado";

export type ShippingStatus =
  | "pendiente"
  | "preparado"
  | "en_ruta"
  | "en_agencia"
  | "entregado";
