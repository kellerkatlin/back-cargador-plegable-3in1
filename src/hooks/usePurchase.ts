import { useState } from "react";
import axios from "axios";

const API_URL = import.meta.env.VITE_STRAPI_URL;
const STRAPI_TOKEN = import.meta.env.VITE_STRAPI_TOKEN;

/* ----------------------- Types ----------------------- */

export interface CustomerPayload {
  nombre: string;
  apellido: string;
  celular: string;
  Direccion: string;
  Distrito?: string;
  Provincia?: string;
  Departamento?: string;
  Referencia?: string;
}

export interface SalePayload {
  quantity: number;
  color: string;
  unitPrice: number;
  totalAmount: number;
}

export interface PurchasePayload {
  customer: CustomerPayload;
  sale: SalePayload;
}

export interface StrapiEntity<T> {
  id: number;
  documentId: string;
  attributes: T & {
    createdAt: string;
    updatedAt: string;
    publishedAt?: string;
  };
}

export interface CustomerResponseData {
  nombre: string;
  apellido: string;
  celular: string;
  Direccion: string;
  Distrito?: string;
  Provincia?: string;
  Departamento?: string;
  Referencia?: string;
}

export interface OrderResponseData {
  orderCode?: string;
  color: string;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  state: string;
}

export interface PurchaseResponse {
  customer: StrapiEntity<CustomerResponseData>;
  sale: StrapiEntity<OrderResponseData>;
}

export interface PurchaseOptions {
  onSuccess?: (data: PurchaseResponse) => void;
  onError?: (error: unknown) => void;
}

/* ----------------------- Hook ----------------------- */

export const usePurchase = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mutate = async (
    payload: PurchasePayload,
    options?: PurchaseOptions
  ) => {
    setLoading(true);
    setError(null);

    try {
      /* ✅ 1. Crear Customer */
      const resCustomer = await axios.post(
        `${API_URL}/customers`,
        { data: payload.customer },
        { headers: { Authorization: `Bearer ${STRAPI_TOKEN}` } }
      );

      const customer = resCustomer.data
        .data as StrapiEntity<CustomerResponseData>;
      const customerDocumentId = customer.documentId;

      if (!customerDocumentId)
        throw new Error("No se generó documentId del cliente");

      /* ✅ 2. Crear Order (sin relación todavía) */
      const resOrder = await axios.post(
        `${API_URL}/orders`,
        {
          data: {
            ...payload.sale,
            state: "pending",
          },
        },
        { headers: { Authorization: `Bearer ${STRAPI_TOKEN}` } }
      );

      const sale = resOrder.data.data as StrapiEntity<OrderResponseData>;
      const saleDocumentId = sale.documentId;

      if (!saleDocumentId)
        throw new Error("No se generó documentId de la orden");

      /* ✅ 3. Asignar Order → Customer (Strapi 5 rules) */
      await axios.put(
        `${API_URL}/customers/${customerDocumentId}`,
        {
          data: {
            orders: [saleDocumentId],
          },
        },
        { headers: { Authorization: `Bearer ${STRAPI_TOKEN}` } }
      );

      await axios.put(
        `${API_URL}/orders/${saleDocumentId}`,
        { data: { customer: customerDocumentId } },
        { headers: { Authorization: `Bearer ${STRAPI_TOKEN}` } }
      );

      const result: PurchaseResponse = { customer, sale };
      options?.onSuccess?.(result);
      return result;
    } catch (err: any) {
      const msg =
        axios.isAxiosError(err) && err.response?.data?.error?.message
          ? err.response.data.error.message
          : "Error procesando compra";

      setError(msg);
      options?.onError?.(err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { mutate, loading, error };
};
