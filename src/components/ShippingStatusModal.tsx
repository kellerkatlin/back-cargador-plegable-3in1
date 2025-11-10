import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ShippingStatus } from "@/types/order";

interface ShippingStatusModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (data: {
    shipping_address?: string;
    order_number?: string;
    order_code?: string;
    pickup_password?: string;
  }) => void;
  status: ShippingStatus;
  isProvincia: boolean;
}

export const ShippingStatusModal = ({
  open,
  onClose,
  onConfirm,
  status,
  isProvincia,
}: ShippingStatusModalProps) => {
  const [shippingAddress, setShippingAddress] = useState("");
  const [orderNumber, setOrderNumber] = useState("");
  const [orderCode, setOrderCode] = useState("");
  const [pickupPassword, setPickupPassword] = useState("");

  useEffect(() => {
    if (open) {
      setShippingAddress("");
      setOrderNumber("");
      setOrderCode("");
      setPickupPassword("");
    }
  }, [open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const data: {
      shipping_address?: string;
      order_number?: string;
      order_code?: string;
      pickup_password?: string;
    } = {};

    if (status === "preparado" && isProvincia && shippingAddress.trim()) {
      data.shipping_address = shippingAddress.trim();
    }

    if (status === "en_ruta" && isProvincia) {
      if (orderNumber.trim()) data.order_number = orderNumber.trim();
      if (orderCode.trim()) data.order_code = orderCode.trim();
      if (pickupPassword.trim()) data.pickup_password = pickupPassword.trim();
    }

    onConfirm(data);
  };

  const getTitle = () => {
    switch (status) {
      case "preparado":
        return "Confirmar Pedido Preparado";
      case "en_ruta":
        return "Confirmar Pedido En Ruta";
      case "en_agencia":
        return "Confirmar Pedido En Agencia";
      case "entregado":
        return "Confirmar Entrega";
      default:
        return "Confirmar Cambio de Estado";
    }
  };

  const getDescription = () => {
    switch (status) {
      case "preparado":
        return isProvincia
          ? "El pedido está listo para enviar a provincia. Ingresa la dirección de envío."
          : "El pedido está listo para entrega en Lima.";
      case "en_ruta":
        return isProvincia
          ? "El pedido está en camino a provincia. Puedes agregar el número de orden de la agencia."
          : "El pedido está en camino.";
      case "en_agencia":
        return "¿Confirmas que el pedido llegó a la agencia?";
      case "entregado":
        return "¿Confirmas que el pedido fue entregado al cliente?";
      default:
        return "¿Deseas confirmar este cambio?";
    }
  };

  const needsShippingAddress = status === "preparado" && isProvincia;
  const canAddOrderInfo = status === "en_ruta" && isProvincia;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{getTitle()}</DialogTitle>
          <DialogDescription>{getDescription()}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {needsShippingAddress && (
            <div className="space-y-2">
              <Label htmlFor="shipping-address">
                Dirección de Envío
                <span className="text-red-500 ml-1">*</span>
              </Label>
              <Input
                id="shipping-address"
                type="text"
                placeholder="Ej: Agencia Shalom - Huancayo"
                value={shippingAddress}
                onChange={(e) => setShippingAddress(e.target.value)}
                required
              />
              <p className="text-xs text-muted-foreground">
                Dirección de la agencia o destino final
              </p>
            </div>
          )}

          {canAddOrderInfo && (
            <>
              <div className="space-y-2">
                <Label htmlFor="order-number">Número de Orden (Opcional)</Label>
                <Input
                  id="order-number"
                  type="text"
                  placeholder="Ej: ORD-123456"
                  value={orderNumber}
                  onChange={(e) => setOrderNumber(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Número de seguimiento de la agencia
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="order-code">Código de Orden (Opcional)</Label>
                <Input
                  id="order-code"
                  type="text"
                  placeholder="Ej: ABC-789"
                  value={orderCode}
                  onChange={(e) => setOrderCode(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Código alternativo de seguimiento
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="pickup-password">
                  Contraseña de Recojo (Opcional)
                </Label>
                <Input
                  id="pickup-password"
                  type="text"
                  placeholder="Ej: 1234"
                  value={pickupPassword}
                  onChange={(e) => setPickupPassword(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Código de seguridad para recoger el paquete
                </p>
              </div>
            </>
          )}

          <div className="flex gap-2 justify-end pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit">Confirmar</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
