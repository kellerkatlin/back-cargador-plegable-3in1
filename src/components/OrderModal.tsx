import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import type { Order } from "@/types/order";

type OrderModalProps = {
  open: boolean;
  onClose: () => void;
  order: Order | null;
};

export function OrderModal({ open, onClose, order }: OrderModalProps) {
  if (!order) return null;

  const formatDate = (dateString: string) => {
    // El formato que viene del backend es: 2025-11-05 23:25:47.881608
    // Lo convertimos a ISO format para que Date lo interprete correctamente
    const isoDate = dateString.replace(' ', 'T') + 'Z'; // Agregamos Z para indicar UTC
    
    return new Date(isoDate).toLocaleDateString("es-PE", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      timeZone: "America/Lima",
    });
  };

  const getStatusColor = (status: string) => {
    const colors = {
      pendiente: "bg-yellow-100 text-yellow-800",
      preparado: "bg-blue-100 text-blue-800",
      en_ruta: "bg-purple-100 text-purple-800",
      en_agencia: "bg-orange-100 text-orange-800",
      entregado: "bg-green-100 text-green-800",
      pagado: "bg-green-100 text-green-800",
      pendiente_pago: "bg-red-100 text-red-800",
    };
    return colors[status as keyof typeof colors] || "bg-gray-100 text-gray-800";
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="text-xl">
            Resumen de Orden #{order.id}
          </DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto pr-2 space-y-6">
          {/* Contenedor con scroll */}
          {/* Información básica de la orden */}
          <div className="bg-muted/30 rounded-lg p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Número de Orden
                </p>
                <p className="text-lg font-bold">#{order.id}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Fecha de Pedido
                </p>
                <p className="text-base">
                  {order.created_at ? formatDate(order.created_at) : "—"}
                </p>
              </div>
            </div>

            <Separator />

            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Estado de Pago
                </p>
                <Badge
                  className={getStatusColor(
                    order.estado_pago || "pendiente_pago"
                  )}
                >
                  {order.estado_pago || "Pendiente"}
                </Badge>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Estado de Envío
                </p>
                <Badge
                  className={getStatusColor(order.estado_envio || "pendiente")}
                >
                  {order.estado_envio || "Pendiente"}
                </Badge>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Total
                </p>
                <p className="text-lg font-bold text-primary">
                  S/ {order.total?.toFixed(2) || "0.00"}
                </p>
              </div>
            </div>
          </div>

          {/* Detalles del producto */}
          <div className="bg-muted/30 rounded-lg p-6 space-y-4">
            <h3 className="text-lg font-semibold">Detalles del Producto</h3>
            {order.order_items && order.order_items.length > 0 ? (
              order.order_items.map((item, index) => (
                <div
                  key={item.id || index}
                  className="border-l-4 border-primary pl-4 py-2"
                >
                  <div className="grid grid-cols-4 gap-4">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        Producto
                      </p>
                      <p className="text-base">Cargador 3 en 1</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        Color
                      </p>
                      <p className="text-base">{item.color || "—"}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        Cantidad
                      </p>
                      <p className="text-base">{item.cantidad || 1}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        Precio Unitario
                      </p>
                      <p className="text-base">
                        S/ {item.precio_unitario?.toFixed(2) || "0.00"}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-4 text-muted-foreground">
                No hay productos en esta orden
              </div>
            )}
          </div>

          {/* Información del cliente */}
          {order.customers && (
            <div className="bg-muted/30 rounded-lg p-6 space-y-4">
              <h3 className="text-lg font-semibold">Información del Cliente</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Nombre Completo
                  </p>
                  <p className="text-base">
                    {order.customers.nombre} {order.customers.apellido}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Teléfono
                  </p>
                  <p className="text-base">{order.customers.numero}</p>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Dirección Completa
                </p>
                <p className="text-base">
                  {order.customers.direccion}
                  {order.customers.referencia &&
                    ` Referencia: ${order.customers.referencia}`}
                </p>
                <p className="text-sm text-muted-foreground">
                  {order.customers.distrito}, {order.customers.provincia},{" "}
                  {order.customers.departamento}
                </p>
              </div>
            </div>
          )}
        </div>{" "}
        {/* Fin del contenedor con scroll */}
      </DialogContent>
    </Dialog>
  );
}
