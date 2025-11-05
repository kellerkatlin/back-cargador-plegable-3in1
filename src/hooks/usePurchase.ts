import { useState } from "react";
import { supabase } from "@/lib/supabase";
import type { Customer } from "@/types/customer";
import type { Order, OrderItem } from "@/types/order";

interface PurchasePayload {
  customer: Omit<Customer, "id">;
  items: {
    color: string;
    cantidad: number;
    precio_unitario: number;
  }[];
}

interface PurchaseResponse {
  customer: Customer;
  order: Order;
  order_items: OrderItem[];
}

interface PurchaseOptions {
  onSuccess?: (data: PurchaseResponse) => void;
  onError?: (error: unknown) => void;
}

export const usePurchase = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mutate = async (
    payload: PurchasePayload,
    options?: PurchaseOptions
  ) => {
    setLoading(true);
    setError(null);

    const { customer, items } = payload;

    try {
      // ✅ 1. Crear CUSTOMER
      const { data: customerData, error: customerError } = await supabase
        .from("customers")
        .insert({
          nombre: customer.nombre,
          apellido: customer.apellido,
          numero: customer.numero,
          direccion: customer.direccion,
          referencia: customer.referencia,
          distrito: customer.distrito,
          provincia: customer.provincia,
          departamento: customer.departamento,
        })
        .select()
        .single();

      if (customerError) throw customerError;

      // ✅ 2. Calcular total
      const total = items.reduce(
        (acc, item) => acc + item.cantidad * item.precio_unitario,
        0
      );

      // ✅ 3. Crear ORDER (relacionada al cliente)
      const { data: orderData, error: orderError } = await supabase
        .from("orders")
        .insert({
          total,
          estado_pago: "pendiente",
          estado_envio: "pendiente",
          customer_id: customerData.id, // si en tu schema la FK es customer_id
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // ✅ 4. Crear ORDER_ITEMS
      const orderItems = items.map((item) => ({
        order_id: orderData.id,
        color: item.color,
        cantidad: item.cantidad,
        precio_unitario: item.precio_unitario,
      }));

      const { error: orderItemsError } = await supabase
        .from("order_items")
        .insert(orderItems);

      if (orderItemsError) throw orderItemsError;

      const result: PurchaseResponse = {
        customer: customerData,
        order: orderData,
        order_items: orderItems,
      };

      options?.onSuccess?.(result);
      return result;
    } catch (err: any) {
      console.error("Error registrando compra:", err);
      setError(err.message || "Error procesando la compra");
      options?.onError?.(err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { mutate, loading, error };
};
