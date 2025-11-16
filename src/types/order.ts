import type { Customer } from "./customer";

export interface Order {
  id?: string;
  userId: string;
  total: number;
  estado_pago: PaymentStatus;
  estado_envio: ShippingStatus;
  created_at?: string;
  updated_at?: string;
  store_id?: string;
  customers?: Customer;
  envio_provincia: boolean;
  order_items?: OrderItem[];
  order_payments?: OrderPayments[];
  amount_paid: number;
  amount_due: number;
  order_number?: string;
  order_code?: string;
  shipping_address?: string;
  pickup_password?: string;
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

export interface OrderPayments {
  id?: string;
  order_id: string;
  amount: number;
  payment_code?: string;
  payment_type?: string;
  created_at?: string;
}

export type PaymentStatus =
  | "pendiente"
  | "adelanto"
  | "pago_restante"
  | "pagado";

export type ShippingStatus =
  | "pendiente"
  | "preparado"
  | "en_ruta"
  | "en_agencia"
  | "entregado"
  | "cancelado";
