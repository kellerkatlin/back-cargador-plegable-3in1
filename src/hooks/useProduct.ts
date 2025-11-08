import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import type { Product, ProductVariant } from "@/types/product";

interface UseProductOptions {
  productId?: string;
  sku?: string;
}

export const useProduct = (options?: UseProductOptions) => {
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProduct = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      let query = supabase.from("products").select("*, product_variants(*)");

      // Filtrar por ID o SKU si se proporciona
      if (options?.productId) {
        query = query.eq("id", options.productId);
      } else if (options?.sku) {
        query = query.eq("sku", options.sku);
      }

      const { data, error: fetchError } = await query.single();

      if (fetchError) {
        throw fetchError;
      }

      // Filtrar solo variantes activas
      if (data && data.product_variants) {
        data.product_variants = data.product_variants.filter(
          (variant: ProductVariant) => variant.activo
        );
      }

      setProduct(data);
    } catch (err: unknown) {
      console.error("Error fetching product:", err);
      setError(err instanceof Error ? err.message : "Error al cargar el producto");
      setProduct(null);
    } finally {
      setLoading(false);
    }
  }, [options?.productId, options?.sku]);

  useEffect(() => {
    fetchProduct();
  }, [fetchProduct]);

  // Función para obtener el stock disponible por color
  const getStockByColor = useCallback(
    (color: string): number => {
      if (!product?.product_variants) return 0;

      const variant = product.product_variants.find(
        (v) => v.color === color && v.activo
      );

      return variant?.stock || 0;
    },
    [product]
  );

  // Función para verificar si un color tiene stock disponible
  const hasStock = useCallback(
    (color: string): boolean => {
      return getStockByColor(color) > 0;
    },
    [getStockByColor]
  );

  // Función para refrescar el producto (después de una compra)
  const refresh = useCallback(() => {
    fetchProduct();
  }, [fetchProduct]);

  return { product, loading, error, getStockByColor, hasStock, refresh };
};
