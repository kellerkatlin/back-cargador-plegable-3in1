import { useEffect, useMemo, useState, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Lock, Plus, Minus, CheckCircle, MessageCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ColorSelector } from "./ColorSelector";
import { usePurchase } from "@/hooks/usePurchase";
import { trackPixel, track } from "@/lib/pixel";
import type { CartItem } from "@/types/cart";
import rawUbigeo from "@/data/ubigeo.json";
import type { Order, OrderItem } from "@/types/order";
import type { Customer } from "@/types/customer";
import { useProduct } from "@/hooks/useProduct";
import type { ProductVariant } from "@/types/product";
import { toast } from "sonner";

const PRODUCT_ID = "e63b582a-d138-46dc-9a7f-55ef3c84a538";
// BLACK FRIDAY PRICES (20-30 Nov) - Antes: 159.9 / 149.9
const BASE_PRICE = 149.9;
const TIER_PRICE_2PLUS = 139.9;
const DISCOUNT_PERCENTAGE = 8; // Porcentaje de descuento especial

// Mapeo de colores UI a nombres de variantes en DB
const colorNameMap: Record<string, string> = {
  Black: "Negro",
  White: "Blanco",
  Gray: "Gris",
  Silvery: "Plateado",
};

const colorMap: Record<string, string> = {
  Black: "Negro",
  White: "Blanco",
  Gray: "Gris",
  Silvery: "Plateado",
};

type DistrictInfo = { ubigeo: string; id: number; inei?: string };
type UbigeoTree = Record<string, Record<string, Record<string, DistrictInfo>>>;

const formSchema = z.object({
  nombre: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  apellido: z.string().min(2, "El apellido debe tener al menos 2 caracteres"),
  numero: z
    .string()
    .min(9, "El número debe tener al menos 9 dígitos")
    .regex(/^[0-9]+$/, "Solo se permiten números"),

  direccion: z.string().min(5, "Ingresa una dirección completa"),
  distrito: z.string().min(1, "Selecciona un distrito"),
  departamento: z.string().min(1, "Selecciona una región"),
  provincia: z.string().min(1, "Selecciona una provincia"),
  // district is conditionally required: we validate manually on submit when districts are available
  referencia: z.string().optional(),
  dni: z.string().optional(), // DNI es opcional, validación condicional en submit
  cantidad: z.number().min(1),
  envio_provincia: z.boolean().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface PurchaseModalProps {
  isOpen: boolean;
  initialQuantity?: number;
  selectedColor?: string;
  orderItems?: CartItem[];
  onUpdateOrderItems?: (items: CartItem[]) => void;
  onQuantityChange?: (quantity: number) => void;
  onColorChange?: (color: string) => void;
  onClose: () => void;
}

export const PurchaseModal = ({
  isOpen,
  onClose,
  initialQuantity,
  selectedColor = "Silvery",
  orderItems = [],
  onUpdateOrderItems,
  onQuantityChange,
  onColorChange,
}: PurchaseModalProps) => {
  const [successData, setSuccessData] = useState<null | {
    order: Order;
    customer: Customer;
  }>(null);
  const [ubigeo, setUbigeo] = useState<UbigeoTree | null>(null);
  const [selectedRegion, setSelectedRegion] = useState<string>("");
  const [selectedProvince, setSelectedProvince] = useState<string>("");
  const [currentColor, setCurrentColor] = useState<string>(selectedColor);
  const [localOrderItems, setLocalOrderItems] =
    useState<CartItem[]>(orderItems);
  const [showDiscountAlert, setShowDiscountAlert] = useState(false);
  const [discountApplied, setDiscountApplied] = useState(false);
  const [purchaseError, setPurchaseError] = useState<string | null>(null);

  // Obtener información de producto y variantes desde Supabase
  const { product } = useProduct({ productId: PRODUCT_ID });

  // Función para obtener el stock de un color específico
  const getColorStock = useCallback(
    (colorKey: string): number => {
      const normalizedColor = colorNameMap[colorKey] || colorKey;
      const variant = product?.product_variants?.find(
        (v: ProductVariant) =>
          v.color.toLowerCase() === normalizedColor.toLowerCase() && v.activo
      );
      return variant ? variant.stock : 0;
    },
    [product]
  );

  // Obtener colores disponibles con stock
  const availableColors = useMemo(() => {
    if (!product?.product_variants) return [];
    return Object.keys(colorNameMap).filter((colorKey) => {
      const normalizedColor = colorNameMap[colorKey];
      const variant = product.product_variants?.find(
        (v: ProductVariant) =>
          v.color.toLowerCase() === normalizedColor.toLowerCase() && v.activo
      );
      return variant && variant.stock > 0;
    });
  }, [product]);

  // Calcular stock total disponible
  const totalAvailableStock = useMemo(() => {
    if (!product?.product_variants) return 0;
    return product.product_variants
      .filter((v: ProductVariant) => v.activo && v.stock > 0)
      .reduce((sum: number, v: ProductVariant) => sum + v.stock, 0);
  }, [product]);

  // Validar que los items no excedan el stock disponible
  const validateItemsStock = useCallback((): boolean => {
    const colorCounts: Record<string, number> = {};

    // Contar cuántas unidades de cada color hay
    localOrderItems.forEach((item) => {
      colorCounts[item.color] = (colorCounts[item.color] || 0) + 1;
    });

    // Verificar que ningún color exceda su stock
    for (const [color, count] of Object.entries(colorCounts)) {
      const stock = getColorStock(color);
      if (count > stock) {
        setPurchaseError(
          `Stock insuficiente para el color ${color}. Disponible: ${stock}, Seleccionado: ${count}`
        );
        return false;
      }
    }

    setPurchaseError(null);
    return true;
  }, [localOrderItems, getColorStock]);

  useEffect(() => {
    setUbigeo(rawUbigeo as UbigeoTree);
  }, []);

  useEffect(() => {
    setCurrentColor(selectedColor);
  }, [selectedColor]);

  // Sincronizar localOrderItems cuando cambien los orderItems del padre
  useEffect(() => {
    setLocalOrderItems(orderItems);
  }, [orderItems]);

  // Resetear errores al abrir el modal
  useEffect(() => {
    if (isOpen) {
      setPurchaseError(null);
    }
  }, [isOpen]);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    mode: "onBlur", // muestra errores al salir del campo
    reValidateMode: "onChange", // y se revalida al escribir
    defaultValues: {
      nombre: "",
      apellido: "",
      numero: "",
      direccion: "",
      distrito: "",
      provincia: "",
      departamento: "",
      referencia: "",
      dni: "",
      cantidad: initialQuantity ?? 1,
    },
  });

  const availableDepartamentos = useMemo(() => {
    if (!ubigeo) return [];
    return Object.keys(ubigeo).sort();
  }, [ubigeo]);

  const availableProvincias = useMemo(() => {
    if (!ubigeo || !selectedRegion) return [];
    return Object.keys(ubigeo[selectedRegion] || {}).sort();
  }, [ubigeo, selectedRegion]);

  const availableDistricts = useMemo(() => {
    if (!ubigeo || !selectedRegion || !selectedProvince) return [];
    return Object.keys(ubigeo[selectedRegion]?.[selectedProvince] || {}).sort();
  }, [ubigeo, selectedRegion, selectedProvince]);

  // Determinar si se debe mostrar el campo DNI
  const shouldShowDNI = useMemo(() => {
    // No mostrar DNI si es Lima (departamento) y Lima (provincia), o si es Callao (departamento)
    if (selectedRegion === "CALLAO") return false;
    if (selectedRegion === "LIMA" && selectedProvince === "LIMA") return false;
    // Mostrar DNI para cualquier otro caso donde haya departamento y provincia seleccionados
    return selectedRegion && selectedProvince;
  }, [selectedRegion, selectedProvince]);

  const qty = form.watch("cantidad");
  const unitPrice = useMemo(
    () => (qty >= 2 ? TIER_PRICE_2PLUS : BASE_PRICE),
    [qty]
  );
  const subtotal = useMemo(() => BASE_PRICE * qty, [qty]);
  const baseTotal = useMemo(() => {
    // Precio base sin descuento adicional
    return unitPrice * qty;
  }, [unitPrice, qty]);
  const total = useMemo(() => {
    // Aplicar descuento del porcentaje definido si fue aceptado
    if (discountApplied) {
      return baseTotal * (1 - DISCOUNT_PERCENTAGE / 100);
    }
    return baseTotal;
  }, [baseTotal, discountApplied]);
  const savingsPerUnit = useMemo(
    () => Math.max(0, BASE_PRICE - unitPrice),
    [unitPrice]
  );
  const totalSavings = useMemo(() => {
    // Ahorro base por cantidad (diferencia entre precio base y precio con descuento por cantidad)
    const quantitySavings = savingsPerUnit * qty;

    // Ahorro adicional por descuento especial (sobre el total ya con descuento por cantidad)
    const specialDiscountSavings = discountApplied
      ? baseTotal * (DISCOUNT_PERCENTAGE / 100)
      : 0;

    return quantitySavings + specialDiscountSavings;
  }, [savingsPerUnit, qty, discountApplied, baseTotal]);

  useEffect(() => {
    form.setValue("cantidad", initialQuantity ?? 1);
  }, [initialQuantity, form]);

  // Resetear descuento cuando se abre el modal
  useEffect(() => {
    if (isOpen) {
      setDiscountApplied(false);
      setShowDiscountAlert(false);
      setPurchaseError(null); // Resetear errores al abrir
    }
  }, [isOpen]);

  // Ajustar localOrderItems cuando cambia la cantidad dentro del modal
  useEffect(() => {
    // qty viene del formulario; asegurarse que localOrderItems tenga exactamente qty entries
    setLocalOrderItems((prev) => {
      const cur = [...prev];
      if (qty <= 0) return cur;
      if (cur.length === qty) return cur;

      // Si se necesita aumentar
      if (cur.length < qty) {
        const toAdd = qty - cur.length;

        // Función para obtener el siguiente color disponible
        const getNextAvailableColor = (): string => {
          // Obtener colores disponibles en este momento
          const currentAvailableColors = Object.keys(colorNameMap).filter(
            (colorKey) => {
              const normalizedColor = colorNameMap[colorKey] || colorKey;
              const variant = product?.product_variants?.find(
                (v: ProductVariant) =>
                  v.color.toLowerCase() === normalizedColor.toLowerCase() &&
                  v.activo
              );
              return variant && variant.stock > 0;
            }
          );

          // Contar colores ya seleccionados
          const colorCounts: Record<string, number> = {};
          for (const item of cur) {
            colorCounts[item.color] = (colorCounts[item.color] || 0) + 1;
          }

          // Buscar un color disponible con stock suficiente
          for (const colorKey of currentAvailableColors) {
            const normalizedColor = colorNameMap[colorKey] || colorKey;
            const variant = product?.product_variants?.find(
              (v: ProductVariant) =>
                v.color.toLowerCase() === normalizedColor.toLowerCase() &&
                v.activo
            );
            const stock = variant ? variant.stock : 0;
            const currentCount = colorCounts[colorKey] || 0;

            if (currentCount < stock) {
              return colorKey; // Este color tiene stock disponible
            }
          }

          // Si no hay colores disponibles, retornar el primer color disponible o currentColor
          return (
            currentAvailableColors[0] ||
            currentColor ||
            selectedColor ||
            "Silvery"
          );
        };

        const itemsToAdd: CartItem[] = new Array(toAdd)
          .fill(0)
          .map((_, idx) => {
            // Para cada nuevo item, obtener el siguiente color disponible
            const colorToUse = getNextAvailableColor();

            return {
              id: `${cur.length + idx + 1}`,
              color: colorToUse,
              quantity: 1,
              unitPrice: unitPrice,
              subtotal: unitPrice,
            };
          });
        const next = [...cur, ...itemsToAdd];
        if (onUpdateOrderItems) {
          // Ejecutar después del render para evitar el error
          setTimeout(() => onUpdateOrderItems(next), 0);
        }
        return next;
      }

      // Si se necesita reducir
      if (cur.length > qty) {
        const next = cur.slice(0, qty).map((it, i) => ({
          ...it,
          id: `${i + 1}`,
        }));
        if (onUpdateOrderItems) {
          // Ejecutar después del render para evitar el error
          setTimeout(() => onUpdateOrderItems(next), 0);
        }
        return next;
      }
      return cur;
    });
  }, [
    qty,
    currentColor,
    selectedColor,
    unitPrice,
    onUpdateOrderItems,
    product,
  ]);

  // Actualizar color de un item local y validar stock
  const updateItemColor = (index: number, newColor: string) => {
    // Validar stock antes de cambiar el color
    const colorCounts: Record<string, number> = {};

    // Contar colores actuales, considerando el cambio
    localOrderItems.forEach((item, i) => {
      const itemColor = i === index ? newColor : item.color;
      colorCounts[itemColor] = (colorCounts[itemColor] || 0) + 1;
    });

    // Verificar que el nuevo color tenga stock suficiente
    const newColorStock = getColorStock(newColor);
    const newColorCount = colorCounts[newColor] || 0;

    if (newColorCount > newColorStock) {
      toast.error(
        `Stock insuficiente para ${newColor}. Disponible: ${newColorStock}`
      );
      return;
    }

    setLocalOrderItems((prev) => {
      const next = prev.map((it, i) =>
        i === index ? { ...it, color: newColor } : it
      );
      if (onUpdateOrderItems) onUpdateOrderItems(next);
      return next;
    });
    // si es el primer item, mantener currentColor sincronizado para el submit single
    if (index === 0) {
      setCurrentColor(newColor);
      // Sincronizar con el componente padre
      if (onColorChange) {
        onColorChange(newColor);
      }
    }
  };

  const purchase = usePurchase();

  const onSubmit = (data: FormData) => {
    // Validar stock antes de procesar la compra
    if (!validateItemsStock()) {
      toast.error(
        "Por favor verifica la disponibilidad de stock de los colores seleccionados"
      );
      return;
    }

    // Si hay distritos disponibles para la provincia seleccionada, el distrito es obligatorio
    if (availableDistricts.length > 0 && !data.distrito) {
      form.setError("distrito", {
        type: "required",
        message: "Selecciona un distrito",
      });
      return;
    }

    // Validar DNI si debe mostrarse (envíos fuera de Lima Metropolitana y Callao)
    if (shouldShowDNI && (!data.dni || data.dni.trim().length !== 8)) {
      form.setError("dni", {
        type: "required",
        message: "El DNI debe tener 8 dígitos",
      });

      // Hacer scroll al campo DNI para que sea visible
      setTimeout(() => {
        const dniField = document.querySelector('input[name="dni"]');
        if (dniField) {
          dniField.scrollIntoView({
            behavior: "smooth",
            block: "center",
          });
          // Enfocar el campo para mejor UX
          (dniField as HTMLInputElement).focus();
        }
      }, 100);

      return;
    }

    // Pixel: valor real con descuento
    trackPixel("InitiateCheckout", {
      value: total,
      currency: "PEN",
      contents: [{ id: PRODUCT_ID, quantity: data.cantidad }],
      content_type: "product",
      num_items: data.cantidad,
    });

    purchase.mutate(
      {
        customer: {
          nombre: data.nombre,
          apellido: data.apellido,
          numero: data.numero,
          direccion: data.direccion,
          referencia: data.referencia ?? "",
          distrito: data.distrito,
          provincia: data.provincia,
          departamento: data.departamento,
          dni: shouldShowDNI ? data.dni : "", // Enviar DNI solo si debe mostrarse
        },
        items: localOrderItems.map((item) => ({
          color: colorMap[item.color] || item.color, // Convertir a español
          cantidad: item.quantity,
          precio_unitario: discountApplied
            ? item.unitPrice * (1 - DISCOUNT_PERCENTAGE / 100)
            : item.unitPrice,
        })),
        productId: product?.id, // Pasar el product ID para validar y decrementar stock
        envio_provincia: shouldShowDNI ? true : false, // true si requiere DNI (provincia), false si es Lima/Callao
      },
      {
        onSuccess: ({ order, customer, order_items }) => {
          trackPixel("AddPaymentInfo", {
            value: total,
            currency: "PEN",
            contents: [
              { id: PRODUCT_ID, quantity: form.getValues("cantidad") },
            ],
            content_type: "product",
          });
          const N8N_WEBHOOK = import.meta.env.VITE_N8N_WEBHOOK as
            | string
            | undefined;

          // Pago contraentrega: enviar webhook a n8n y mostrar confirmación en modal
          (async () => {
            try {
              if (N8N_WEBHOOK) {
                await fetch(N8N_WEBHOOK, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    event: "order.created",
                    order,
                    customer,
                    order_items: order_items
                      ? order_items.map((item: OrderItem) => ({
                          ...item,
                          color: colorMap[item.color] || item.color, // Traducir color del backend
                        }))
                      : localOrderItems.map((item) => ({
                          color: colorMap[item.color] || item.color, // Traducir color local
                          cantidad: item.quantity,
                          precio_unitario: discountApplied
                            ? item.unitPrice * (1 - DISCOUNT_PERCENTAGE / 100)
                            : item.unitPrice,
                        })),
                  }),
                });
              } else {
                console.warn("VITE_N8N_WEBHOOK not set; skipping webhook POST");
              }
            } catch (err) {
              console.error("Failed sending n8n webhook", err);
            } finally {
              // Disparar pixel de Purchase (COD) con eventID para CAPI
              try {
                track(
                  "Purchase",
                  {
                    value: Number(total.toFixed(2)),
                    currency: "PEN",
                    contents: [
                      {
                        id: PRODUCT_ID,
                        quantity: form.getValues("cantidad"),
                      },
                    ],
                    content_type: "product",
                  },
                  { eventID: `order_${order.id}` }
                );

                // ✅ Disparar Pixel TikTok (Purchase)
                if (typeof window !== "undefined" && window.ttq) {
                  window.ttq.track("Purchase", {
                    value: Number(total.toFixed(2)),
                    currency: "PEN",
                    contents: [
                      {
                        content_id: PRODUCT_ID, // ✅ explícito
                        quantity: form.getValues("cantidad"),
                        price: Number(unitPrice.toFixed(2)),
                      },
                    ],
                    content_type: "product",
                  });
                }
              } catch (err) {
                console.warn("Failed to fire Purchase pixels", err);
              }

              // Guardar datos de éxito en estado (mostrar mensaje final)
              setSuccessData({ order, customer });
            }
          })();
        },
        //onError: (err: unknown) => {},
      }
    );
  };

  const handleQuantityChange = (increment: boolean) => {
    const currentQuantity = form.getValues("cantidad");
    const newQuantity = increment
      ? Math.min(currentQuantity + 1, totalAvailableStock)
      : Math.max(currentQuantity - 1, 1);
    form.setValue("cantidad", newQuantity, { shouldValidate: true });

    // Sincronizar con el componente padre
    if (onQuantityChange) {
      onQuantityChange(newQuantity);
    }
  };

  const handleDepartamentoChange = (value: string) => {
    setSelectedRegion(value);
    setSelectedProvince("");
    form.setValue("departamento", value, {
      shouldValidate: true,
      shouldTouch: true,
      shouldDirty: true,
    });
    form.setValue("provincia", "", {
      shouldValidate: true,
      shouldTouch: true,
      shouldDirty: true,
    });
    form.setValue("distrito", "", {
      shouldValidate: true,
      shouldTouch: true,
      shouldDirty: true,
    });
  };

  const handleProvinciaChange = (value: string) => {
    setSelectedProvince(value);
    form.setValue("provincia", value, {
      shouldValidate: true,
      shouldTouch: true,
      shouldDirty: true,
    });
    form.setValue("distrito", "", {
      shouldValidate: true,
      shouldTouch: true,
      shouldDirty: true,
    });
  };

  // Función para manejar el cierre del modal con descuento
  const handleModalClose = () => {
    // Solo mostrar descuento si no se ha aplicado ya y no es la vista de éxito
    if (!discountApplied && !successData) {
      setShowDiscountAlert(true);
    } else {
      onClose();
    }
  };

  // Función para aceptar el descuento
  const handleAcceptDiscount = () => {
    setDiscountApplied(true);
    setShowDiscountAlert(false);
  };

  // Función para rechazar el descuento
  const handleRejectDiscount = () => {
    setShowDiscountAlert(false);
    onClose();
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={handleModalClose}>
        <DialogContent className="max-w-lg w-[95vw] sm:w-full mx-auto p-6 sm:p-8 max-h-[90vh] overflow-y-auto bg-background border-none rounded-2xl shadow-xl">
          {successData ? (
            <div className="p-8 md:p-12 text-center space-y-6">
              <div className="flex justify-center">
                <div className="rounded-full bg-green-100 p-4">
                  <CheckCircle className="w-16 h-16 text-green-600" />
                </div>
              </div>

              <div>
                <h2 className="text-3xl font-bold text-foreground">
                  ¡Pedido Confirmado!
                </h2>
                <p className="text-muted-foreground mt-3 text-base">
                  Gracias por tu compra. En breve nos comunicaremos contigo para
                  coordinar la entrega.
                </p>
              </div>

              <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-lg p-6 border-2 border-primary/20">
                <p className="text-sm text-muted-foreground mb-2">
                  Número de Orden
                </p>
                <p className="text-4xl font-bold text-primary font-mono">
                  #
                  {successData.order?.id?.substring(0, 8).toUpperCase() ||
                    "N/A"}
                </p>
                <div className="mt-4 pt-4 border-t border-primary/20 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Cliente:</span>
                    <span className="font-semibold">
                      {successData.customer?.nombre}{" "}
                      {successData.customer?.apellido}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Cantidad:</span>
                    <span className="font-semibold">
                      {initialQuantity || 1} unidad(es)
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Total:</span>
                    <span className="font-semibold">S/ {total.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <a
                  href={`https://wa.me/51932567344?text=${encodeURIComponent(
                    `Hola! Tengo una consulta sobre mi pedido #${
                      successData.order?.id?.substring(0, 8).toUpperCase() || ""
                    }`
                  )}`}
                  target="_blank"
                  rel="noreferrer"
                  className="block"
                >
                  <Button className="w-full gap-2 bg-green-600 hover:bg-green-700 text-white py-6 text-base">
                    <MessageCircle className="w-5 h-5" />
                    Contactar por WhatsApp
                  </Button>
                </a>

                <Button
                  variant="outline"
                  onClick={() => {
                    setSuccessData(null);
                    onClose();
                  }}
                  className="w-full"
                >
                  Cerrar
                </Button>
              </div>
            </div>
          ) : (
            <>
              <DialogHeader className="text-center pb-4">
                <DialogTitle className="text-2xl font-semibold text-foreground">
                  Completa tu compra contraentrega
                </DialogTitle>

                <div className="mt-2">
                  <p className="text-xs text-destructive font-semibold mt-2">
                    Complete sus datos solo si está completamente seguro de
                    realizar la compra.
                  </p>
                </div>
              </DialogHeader>

              {/* Resumen del producto seleccionado */}
              <div className="bg-muted border rounded-lg p-4 mb-4 space-y-3">
                <div>
                  <h3 className="text-sm font-semibold mb-3">Tu pedido:</h3>
                  <div className="flex items-center justify-between">
                    <div className="text-sm">
                      <p className="font-medium">Cargador 3 en 1</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Cantidad: {qty}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-4"
                >
                  <div className="grid grid-cols-2 gap-3">
                    <FormField
                      control={form.control}
                      name="nombre"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium text-foreground">
                            Nombre *
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Ariana"
                              className="h-12 rounded-ios border-input focus:border-foreground"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage className="text-xs" />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="apellido"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium text-foreground">
                            Apellido *
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Gómez"
                              className="h-12 rounded-ios border-input focus:border-foreground"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage className="text-xs" />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="numero"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-foreground">
                          Celular / WhatsApp *
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="tel"
                            placeholder="987654321"
                            className="h-12 rounded-ios border-input focus:border-foreground"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage className="text-xs" />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="direccion"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-foreground">
                          Dirección *
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Av. Arequipa 123, depto. 402"
                            className="h-12 rounded-ios border-input focus:border-foreground"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage className="text-xs" />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 gap-3">
                    <FormField
                      control={form.control}
                      name="departamento"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium text-foreground">
                            Departamento *
                          </FormLabel>
                          <Select
                            onValueChange={handleDepartamentoChange}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger className="h-9 rounded-ios border-input focus:border-foreground">
                                <SelectValue placeholder="Selecciona tu departamento" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="bg-background border border-border rounded-ios shadow-float">
                              {availableDepartamentos.map((departamento) => (
                                <SelectItem
                                  key={departamento}
                                  value={departamento}
                                  className="rounded-ios"
                                >
                                  {departamento}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage className="text-xs" />
                        </FormItem>
                      )}
                    />

                    {availableProvincias.length > 0 && (
                      <FormField
                        control={form.control}
                        name="provincia"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-medium text-foreground">
                              Provincia *
                            </FormLabel>
                            <Select
                              onValueChange={handleProvinciaChange}
                              value={field.value}
                            >
                              <FormControl>
                                <SelectTrigger className="h-12 rounded-ios border-input focus:border-foreground">
                                  <SelectValue placeholder="Selecciona tu provincia" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent className="bg-background border border-border rounded-ios shadow-float text-sm max-h-48 overflow-y-auto">
                                {availableProvincias.map((provincia) => (
                                  <SelectItem
                                    key={provincia}
                                    value={provincia}
                                    className="text-sm py-1.5"
                                  >
                                    {provincia}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage className="text-xs" />
                          </FormItem>
                        )}
                      />
                    )}

                    {availableDistricts.length > 0 && (
                      <FormField
                        control={form.control}
                        name="distrito"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-medium text-foreground">
                              Distrito *
                            </FormLabel>
                            <Select
                              onValueChange={(value) => {
                                field.onChange(value);
                                form.setValue("distrito", value, {
                                  shouldValidate: true,
                                  shouldTouch: true,
                                  shouldDirty: true,
                                });
                              }}
                              value={field.value}
                            >
                              <FormControl>
                                <SelectTrigger className="h-12 rounded-ios border-input focus:border-foreground">
                                  <SelectValue placeholder="Selecciona tu distrito" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent className="bg-background border border-border rounded-ios shadow-float">
                                {availableDistricts.map((district) => (
                                  <SelectItem
                                    key={district}
                                    value={district}
                                    className="rounded-ios"
                                  >
                                    {district}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage className="text-xs" />
                          </FormItem>
                        )}
                      />
                    )}

                    {/* Campo DNI - Solo para envíos fuera de Lima Metropolitana y Callao */}
                    {shouldShowDNI && (
                      <FormField
                        control={form.control}
                        name="dni"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-medium text-foreground">
                              DNI *
                            </FormLabel>
                            <FormControl>
                              <Input
                                type="text"
                                placeholder="12345678"
                                maxLength={8}
                                className="h-12 rounded-ios border-input focus:border-foreground"
                                {...field}
                                onChange={(e) => {
                                  // Solo permitir números y máximo 8 caracteres
                                  const value = e.target.value
                                    .replace(/\D/g, "")
                                    .slice(0, 8);
                                  field.onChange(value);
                                }}
                              />
                            </FormControl>
                            <FormMessage className="text-xs" />
                            <p className="text-xs text-muted-foreground mt-1">
                              El DNI es necesario para registrar tu pedido por
                              Shalom
                            </p>
                          </FormItem>
                        )}
                      />
                    )}
                  </div>

                  <FormField
                    control={form.control}
                    name="referencia"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-foreground">
                          Referencia
                        </FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Frente al parque / Portón negro"
                            className="min-h-[80px] rounded-ios border-input focus:border-foreground resize-none"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage className="text-xs" />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="cantidad"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-foreground">
                          Cantidad *
                        </FormLabel>
                        <FormControl>
                          <div className="flex items-center gap-3">
                            <button
                              type="button"
                              onClick={() => handleQuantityChange(false)}
                              className="w-12 h-12 rounded-full border border-input bg-background hover:bg-muted/50 flex items-center justify-center transition-colors"
                              disabled={qty <= 1}
                            >
                              <Minus className="w-4 h-4 text-foreground" />
                            </button>
                            <div className="flex-1 text-center">
                              <Input
                                type="number"
                                min="1"
                                max={totalAvailableStock}
                                className="h-12 text-center rounded-ios border-input focus:border-foreground"
                                {...field}
                                value={qty}
                                onChange={(e) => {
                                  const newQty = Math.max(
                                    1,
                                    Math.min(
                                      totalAvailableStock,
                                      Number.parseInt(e.target.value) || 1
                                    )
                                  );
                                  field.onChange(newQty);
                                  // Sincronizar con el componente padre
                                  if (onQuantityChange) {
                                    onQuantityChange(newQty);
                                  }
                                }}
                              />
                            </div>
                            <button
                              type="button"
                              onClick={() => handleQuantityChange(true)}
                              className="w-12 h-12 rounded-full border border-input bg-background hover:bg-muted/50 flex items-center justify-center transition-colors"
                              disabled={qty >= totalAvailableStock}
                            >
                              <Plus className="w-4 h-4 text-foreground" />
                            </button>
                          </div>
                        </FormControl>
                        <FormMessage className="text-xs" />
                      </FormItem>
                    )}
                  />

                  {/* Selector de color - aparece después de la cantidad */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-medium text-foreground">
                      Selección de colores
                    </h4>

                    {/* Alerta de error de stock */}
                    {purchaseError && (
                      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                        {purchaseError}
                      </div>
                    )}

                    {qty === 1 ? (
                      <div>
                        <ColorSelector
                          selectedColor={currentColor}
                          availableColors={availableColors}
                          getColorStock={getColorStock}
                          onColorChange={(c) => {
                            setCurrentColor(c);
                            // Sincronizar con el componente padre
                            if (onColorChange) {
                              onColorChange(c);
                            }
                            // Actualizar localOrderItems si existe
                            if (localOrderItems.length > 0) {
                              const updatedItems = [
                                { ...localOrderItems[0], color: c },
                              ];
                              setLocalOrderItems(updatedItems);
                              if (onUpdateOrderItems)
                                onUpdateOrderItems(updatedItems);
                            }
                          }}
                        />
                      </div>
                    ) : (
                      <div className="max-h-80 overflow-y-auto space-y-2 border rounded-lg">
                        {localOrderItems.map((item, index) => (
                          <div
                            key={item.id}
                            className="flex items-center justify-between py-2 px-3 bg-muted/20 rounded-lg"
                          >
                            <span className="text-sm font-medium text-foreground">
                              Unidad #{index + 1}
                            </span>
                            <div className="scale-75">
                              <ColorSelector
                                selectedColor={item.color}
                                availableColors={availableColors}
                                getColorStock={getColorStock}
                                onColorChange={(c) => updateItemColor(index, c)}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Resumen con descuento */}
                  <div className="bg-muted/30 rounded-ios p-4 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">
                        Precio unitario
                      </span>
                      <span className="text-sm font-medium">
                        {qty >= 2 ? (
                          <>
                            <span className="line-through mr-2">
                              S/ {BASE_PRICE.toFixed(2)}
                            </span>
                            <span className="text-success font-semibold">
                              S/ {unitPrice.toFixed(2)}
                            </span>
                          </>
                        ) : (
                          <>S/ {unitPrice.toFixed(2)}</>
                        )}
                      </span>
                    </div>
                    {qty >= 2 && (
                      <>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">
                            Ahorro por unidad
                          </span>
                          <span className="text-sm text-success">
                            - S/ {savingsPerUnit.toFixed(2)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">
                            Subtotal (sin descuento)
                          </span>
                          <span className="text-sm line-through">
                            S/ {subtotal.toFixed(2)}
                          </span>
                        </div>
                      </>
                    )}
                    {discountApplied && (
                      <div className="flex justify-between items-center bg-primary/10 px-2 py-1 rounded">
                        <span className="text-sm font-medium text-primary">
                          Descuento especial ({DISCOUNT_PERCENTAGE}%)
                        </span>
                        <span className="text-sm font-semibold text-primary">
                          - S/{" "}
                          {(baseTotal * (DISCOUNT_PERCENTAGE / 100)).toFixed(2)}
                        </span>
                      </div>
                    )}{" "}
                    <div className="flex justify-between items-center border-t border-border pt-2">
                      <span className="text-lg font-semibold text-foreground">
                        Total
                      </span>
                      <span className="text-xl font-bold text-foreground">
                        S/ {total.toFixed(2)}
                      </span>
                    </div>
                    {(qty >= 2 || discountApplied) && totalSavings > 0 && (
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-muted-foreground">
                          Ahorro total
                        </span>
                        <span className="text-xs text-success">
                          - S/ {totalSavings.toFixed(2)}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-3 pt-2">
                    <Button
                      type="submit"
                      variant="default"
                      size="lg"
                      className="w-full h-12 bg-foreground text-background hover:bg-foreground/90 rounded-full font-medium"
                      disabled={purchase.loading}
                    >
                      {purchase.loading ? "Procesando…" : "Realizar pedido"}
                    </Button>

                    <p className="text-xs font-semibold text-destructive mt-2">
                      Para envíos contraentrega a provincia: adelanto de S/ 15
                      para recojos por Shalom.
                    </p>

                    <Button
                      type="button"
                      variant="outline"
                      size="lg"
                      className="w-full h-12 rounded-full font-medium"
                      onClick={() => {
                        const message = encodeURIComponent(
                          `Hola, tengo algunas dudas sobre el cargador plegable 3 en 1 antes de realizar mi compra.`
                        );
                        window.open(
                          `https://wa.me/51932567344?text=${message}`,
                          "_blank"
                        );
                      }}
                      disabled={purchase.loading}
                    >
                      Tengo dudas
                    </Button>
                  </div>

                  <div className="flex items-center justify-center gap-2 pt-2">
                    <Lock className="w-4 h-4 text-muted-foreground" />
                    <p className="text-xs text-muted-foreground text-center">
                      Pago 100% seguro. Tus datos solo se usan para coordinar la
                      entrega.
                    </p>
                  </div>
                </form>
              </Form>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal de Descuento */}
      <Dialog open={showDiscountAlert} onOpenChange={handleRejectDiscount}>
        <DialogContent className="max-w-md w-[90vw] mx-auto p-6 bg-background border border-border rounded-2xl shadow-xl">
          <DialogHeader className="text-center pb-4">
            <DialogTitle className="text-2xl font-bold text-foreground">
              🎉 ¡Oferta Especial!
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6 text-center">
            <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-lg p-6 border border-primary/20">
              <h3 className="text-xl font-bold text-primary mb-2">
                ¡{DISCOUNT_PERCENTAGE}% de Descuento Adicional!
              </h3>
              <p className="text-muted-foreground">
                Aprovecha esta oferta limitada y ahorra aún más en tu compra
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center text-sm">
                <span>Precio actual:</span>
                <span className="line-through">S/ {baseTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center text-lg font-bold">
                <span>Con descuento {DISCOUNT_PERCENTAGE}%:</span>
                <span className="text-primary">
                  S/ {(baseTotal * (1 - DISCOUNT_PERCENTAGE / 100)).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm text-green-600">
                <span>Ahorras:</span>
                <span className="font-semibold">
                  S/ {(baseTotal * (DISCOUNT_PERCENTAGE / 100)).toFixed(2)}
                </span>
              </div>
            </div>

            <div className="space-y-3">
              <Button
                onClick={handleAcceptDiscount}
                className="w-full bg-primary hover:bg-primary/90 text-white py-3 text-lg"
              >
                ¡Sí, aplicar descuento!
              </Button>

              <Button
                variant="outline"
                onClick={handleRejectDiscount}
                className="w-full py-3"
              >
                No gracias, aún no quiero
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
