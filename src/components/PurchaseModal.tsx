import { useEffect, useMemo, useState } from "react";
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
import rawUbigeo from "@/data/ubigeo.json";

const PRODUCT_ID = "charger_typec_lightning";
const BASE_PRICE = 159.9;
const TIER_PRICE_2PLUS = 149.9;

type DistrictInfo = { ubigeo: string; id: number; inei?: string };
type UbigeoTree = Record<string, Record<string, Record<string, DistrictInfo>>>;

const formSchema = z.object({
  nombre: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  apellido: z.string().min(2, "El apellido debe tener al menos 2 caracteres"),
  celular: z
    .string()
    .min(9, "El número debe tener al menos 9 dígitos")
    .regex(/^[0-9]+$/, "Solo se permiten números"),

  Direccion: z.string().min(5, "Ingresa una dirección completa"),
  Distrito: z.string().min(1, "Selecciona un distrito"),
  Departamento: z.string().min(1, "Selecciona una región"),
  Provincia: z.string().min(1, "Selecciona una provincia"),
  // district is conditionally required: we validate manually on submit when districts are available
  Referencia: z.string().optional(),
  quantity: z.number().min(1),
});

type FormData = z.infer<typeof formSchema>;

interface PurchaseModalProps {
  isOpen: boolean;
  initialQuantity?: number;
  selectedColor?: string;

  onClose: () => void;
}

export const PurchaseModal = ({
  isOpen,
  onClose,
  initialQuantity,
  selectedColor = "Silvery",
}: PurchaseModalProps) => {
  const [successData, setSuccessData] = useState<null | {
    sale: any;
    customer: any;
  }>(null);
  const [ubigeo, setUbigeo] = useState<UbigeoTree | null>(null);
  const [selectedRegion, setSelectedRegion] = useState<string>("");
  const [selectedProvince, setSelectedProvince] = useState<string>("");
  const [currentColor, setCurrentColor] = useState<string>(selectedColor);

  useEffect(() => {
    setUbigeo(rawUbigeo as UbigeoTree);
  }, []);

  useEffect(() => {
    setCurrentColor(selectedColor);
  }, [selectedColor]);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    mode: "onBlur", // muestra errores al salir del campo
    reValidateMode: "onChange", // y se revalida al escribir
    defaultValues: {
      nombre: "",
      apellido: "",
      celular: "",
      Direccion: "",
      Distrito: "",
      Provincia: "",
      Departamento: "",
      Referencia: "",
      quantity: initialQuantity ?? 1,
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

  const qty = form.watch("quantity");
  const unitPrice = useMemo(
    () => (qty >= 2 ? TIER_PRICE_2PLUS : BASE_PRICE),
    [qty]
  );
  const subtotal = useMemo(() => BASE_PRICE * qty, [qty]);
  const total = useMemo(() => unitPrice * qty, [unitPrice, qty]);
  const savingsPerUnit = useMemo(
    () => Math.max(0, BASE_PRICE - unitPrice),
    [unitPrice]
  );
  const totalSavings = useMemo(
    () => savingsPerUnit * qty,
    [savingsPerUnit, qty]
  );

  useEffect(() => {
    form.setValue("quantity", initialQuantity ?? 1);
  }, [initialQuantity, form]);

  const purchase = usePurchase();

  const onSubmit = (data: FormData) => {
    // Si hay distritos disponibles para la provincia seleccionada, el distrito es obligatorio
    if (availableDistricts.length > 0 && !data.Distrito) {
      form.setError("Distrito", {
        type: "required",
        message: "Selecciona un distrito",
      });
      return;
    }
    // Pixel: valor real con descuento
    trackPixel("InitiateCheckout", {
      value: total,
      currency: "PEN",
      contents: [{ id: PRODUCT_ID, quantity: data.quantity }],
      content_type: "product",
      num_items: data.quantity,
    });

    purchase.mutate(
      {
        customer: {
          nombre: data.nombre,
          apellido: data.apellido,
          celular: data.celular,
          Direccion: data.Direccion,
          Distrito: data.Distrito,
          Provincia: data.Provincia,
          Departamento: data.Departamento,
          Referencia: data.Referencia,
        },
        sale: {
          color: currentColor,
          quantity: data.quantity,
          unitPrice: Number(unitPrice.toFixed(2)), // manda el unitario con descuento si aplica
          totalAmount: Number(total.toFixed(2)), // total final aplicado
          // Si tu backend lo acepta, puedes enviar estos campos extra:
          // discountPerUnit: Number(savingsPerUnit.toFixed(2)),
          // totalDiscount: Number(totalSavings.toFixed(2)),
          // productId: PRODUCT_ID,
        },
      },
      {
        onSuccess: ({ sale, customer }) => {
          trackPixel("AddPaymentInfo", {
            value: total,
            currency: "PEN",
            contents: [
              { id: PRODUCT_ID, quantity: form.getValues("quantity") },
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
                    event: "sale.created",
                    sale,
                    customer,
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
                        quantity: form.getValues("quantity"),
                      },
                    ],
                    content_type: "product",
                  },
                  { eventID: `sale_${sale.id}` }
                );

                // ✅ Disparar Pixel TikTok (Purchase)
                if (typeof window !== "undefined" && window.ttq) {
                  window.ttq.track("Purchase", {
                    value: Number(total.toFixed(2)),
                    currency: "PEN",
                    contents: [
                      {
                        content_id: PRODUCT_ID, // ✅ explícito
                        quantity: form.getValues("quantity"),
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
              setSuccessData({ sale, customer });
            }
          })();
        },
        //onError: (err: unknown) => {},
      }
    );
  };

  const handleQuantityChange = (increment: boolean) => {
    const currentQuantity = form.getValues("quantity");
    const newQuantity = increment
      ? Math.min(currentQuantity + 1, 5)
      : Math.max(currentQuantity - 1, 1);
    form.setValue("quantity", newQuantity, { shouldValidate: true });
  };

  const handleDepartamentoChange = (value: string) => {
    setSelectedRegion(value);
    setSelectedProvince("");
    form.setValue("Departamento", value, {
      shouldValidate: true,
      shouldTouch: true,
      shouldDirty: true,
    });
    form.setValue("Provincia", "", {
      shouldValidate: true,
      shouldTouch: true,
      shouldDirty: true,
    });
    form.setValue("Distrito", "", {
      shouldValidate: true,
      shouldTouch: true,
      shouldDirty: true,
    });
  };

  const handleProvinciaChange = (value: string) => {
    setSelectedProvince(value);
    form.setValue("Provincia", value, {
      shouldValidate: true,
      shouldTouch: true,
      shouldDirty: true,
    });
    form.setValue("Distrito", "", {
      shouldValidate: true,
      shouldTouch: true,
      shouldDirty: true,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md w-[90vw] sm:w-auto mx-auto px-4 sm:px-0 max-h-[90vh] overflow-y-auto bg-card border border-border rounded-ios shadow-float">
        {successData ? (
          <div className="p-6 text-center space-y-6">
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
                #{successData.sale?.id || "N/A"}
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
              </div>
            </div>

            <div className="space-y-3">
              <a
                href={`https://wa.me/51932567344?text=${encodeURIComponent(
                  `Hola! Tengo una consulta sobre mi pedido #${
                    successData.sale?.id || ""
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
                  Completa sus datos solo si está completamente seguro de
                  realizar la compra.
                </p>
              </div>
            </DialogHeader>

            {/* Resumen del producto seleccionado con selector de color */}
            <div className="bg-muted/30 rounded-lg p-4 mb-4 space-y-3">
              <div>
                <h3 className="text-sm font-semibold mb-3">Tu pedido:</h3>
                <div className="flex items-center justify-between">
                  <div className="text-sm">
                    <p className="font-medium">Cargador 3 en 1</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Cantidad: {initialQuantity || 1}
                    </p>
                  </div>
                </div>
              </div>

              {/* Selector de color */}
              <div>
                <ColorSelector
                  selectedColor={currentColor}
                  onColorChange={setCurrentColor}
                />
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
                  name="celular"
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
                  name="Direccion"
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
                    name="Departamento"
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
                      name="Provincia"
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
                      name="Distrito"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium text-foreground">
                            Distrito *
                          </FormLabel>
                          <Select
                            onValueChange={field.onChange}
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
                </div>

                <FormField
                  control={form.control}
                  name="Referencia"
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
                  name="quantity"
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
                              max="5"
                              className="h-12 text-center rounded-ios border-input focus:border-foreground"
                              {...field}
                              value={qty}
                              onChange={(e) =>
                                field.onChange(
                                  Math.max(
                                    1,
                                    Math.min(5, parseInt(e.target.value) || 1)
                                  )
                                )
                              }
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => handleQuantityChange(true)}
                            className="w-12 h-12 rounded-full border border-input bg-background hover:bg-muted/50 flex items-center justify-center transition-colors"
                            disabled={qty >= 5}
                          >
                            <Plus className="w-4 h-4 text-foreground" />
                          </button>
                        </div>
                      </FormControl>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />

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

                  <div className="flex justify-between items-center border-t border-border pt-2">
                    <span className="text-lg font-semibold text-foreground">
                      Total
                    </span>
                    <span className="text-xl font-bold text-foreground">
                      S/ {total.toFixed(2)}
                    </span>
                  </div>

                  {qty >= 2 && (
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
                    Para envíos contraentrega a provincia: adelanto de S/ 10
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
  );
};
