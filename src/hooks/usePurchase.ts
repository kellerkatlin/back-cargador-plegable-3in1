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
  productId?: string;
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

    const { customer, items, productId } = payload;

    try {
      // ✅ 1. Validar stock disponible antes de procesar la compra
      // if (productId) {
      //   for (const item of items) {
      //     const { data: variant, error: variantError } = await supabase
      //       .from("product_variants")
      //       .select("stock, color")
      //       .eq("product_id", productId)
      //       .eq("color", item.color)
      //       .maybeSingle();

      //     if (variantError) {
      //       throw new Error(
      //         `No se encontró la variante de color ${item.color}`
      //       );
      //     }

      //     if (!variant || variant.stock < item.cantidad) {
      //       throw new Error(
      //         `Stock insuficiente para el color ${item.color}. Disponible: ${
      //           variant?.stock || 0
      //         }, Solicitado: ${item.cantidad}`
      //       );
      //     }
      //   }
      // }

      // ✅ 2. Crear CUSTOMER
      const { data: customerData, error: customerError } = await supabase
        .from("customers")
        .insert({
          nombre: customer.nombre,
          apellido: customer.apellido,
          numero: customer.numero,
          dni: customer.dni ?? null,
          direccion: customer.direccion,
          referencia: customer.referencia,
          distrito: customer.distrito,
          provincia: customer.provincia,
          departamento: customer.departamento,
          store_id: "0b22b271-7011-47b2-8dc6-0269784ccb38",
        })
        .select()
        .single();

      if (customerError) throw customerError;

      // ✅ 3. Calcular total
      const total = items.reduce(
        (acc, item) => acc + item.cantidad * item.precio_unitario,
        0
      );

      // ✅ 4. Crear ORDER (relacionada al cliente)
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

      // ✅ 5. Crear ORDER_ITEMS
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

      // ✅ 6. Actualizar stock de las variantes
      if (productId) {
        for (const item of items) {
          // Obtener la variante actual
          const { data: variant } = await supabase
            .from("product_variants")
            .select("id, stock")
            .eq("product_id", productId)
            .eq("color", item.color)
            .maybeSingle();

          if (variant) {
            // Decrementar el stock
            const newStock = Math.max(0, variant.stock - item.cantidad);

            const { error: updateError } = await supabase
              .from("product_variants")
              .update({ stock: newStock })
              .eq("id", variant.id);

            if (updateError) {
              console.error(
                `Error actualizando stock para color ${item.color}:`,
                updateError
              );
            }
          }
        }
      }

      const result: PurchaseResponse = {
        customer: customerData,
        order: orderData,
        order_items: orderItems,
      };

      options?.onSuccess?.(result);
      return result;
    } catch (err: unknown) {
      console.error("Error registrando compra:", err);
      setError(
        err instanceof Error ? err.message : "Error procesando la compra"
      );
      options?.onError?.(err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { mutate, loading, error };
};
