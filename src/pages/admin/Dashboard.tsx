import { DataTable } from "@/components/data-table";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CustomerModal } from "@/components/CustomerModal";
import { OrderModal } from "@/components/OrderModal";
import { PaymentModal } from "@/components/PaymentModal";
import { ShippingStatusModal } from "@/components/ShippingStatusModal";
import { LogOut, Printer } from "lucide-react";
import { useNavigate } from "react-router-dom";

import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import type { Order, ShippingStatus, PaymentStatus } from "@/types/order";
import type { Customer } from "@/types/customer";

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState<Customer | null>(null);
  const [openUserModal, setOpenUserModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [openOrderModal, setOpenOrderModal] = useState(false);
  const [openPaymentModal, setOpenPaymentModal] = useState(false);
  const [openShippingModal, setOpenShippingModal] = useState(false);
  const [pendingPaymentOrder, setPendingPaymentOrder] = useState<Order | null>(
    null
  );
  const [pendingPaymentType, setPendingPaymentType] = useState<
    "adelanto" | "pagado"
  >("adelanto");
  const [pendingShippingOrder, setPendingShippingOrder] =
    useState<Order | null>(null);
  const [pendingShippingStatus, setPendingShippingStatus] =
    useState<ShippingStatus>("preparado");
  const navigate = useNavigate();

  const getPaymentStatusColor = (status: PaymentStatus) => {
    const colors = {
      pendiente: "bg-yellow-100 text-yellow-800 border-yellow-300",
      adelanto: "bg-blue-100 text-blue-800 border-blue-300",
      pago_restante: "bg-orange-100 text-orange-800 border-orange-300",
      pagado: "bg-green-100 text-green-800 border-green-300",
    };
    return colors[status] || "bg-gray-100 text-gray-800 border-gray-300";
  };

  const getShippingStatusColor = (status: ShippingStatus) => {
    const colors = {
      pendiente: "bg-gray-100 text-gray-800 border-gray-300",
      preparado: "bg-blue-100 text-blue-800 border-blue-300",
      en_ruta: "bg-purple-100 text-purple-800 border-purple-300",
      en_agencia: "bg-indigo-100 text-indigo-800 border-indigo-300",
      entregado: "bg-green-100 text-green-800 border-green-300",
    };
    return colors[status] || "bg-gray-100 text-gray-800 border-gray-300";
  };

  const formatDateShort = (dateString: string) => {
    // El formato que viene del backend es: 2025-11-05 23:25:47.881608
    // Lo convertimos a ISO format para que Date lo interprete correctamente
    const isoDate = dateString.replace(" ", "T") + "Z"; // Agregamos Z para indicar UTC

    return new Date(isoDate).toLocaleDateString("es-PE", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "America/Lima",
    });
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/admin/login");
  };

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const term = searchTerm.trim();

        // Traer todas las órdenes primero
        const { data, error } = await supabase
          .from("orders")
          .select("*, customers(*), order_items(*)")
          .order("created_at", { ascending: false });

        if (error) {
          console.error("❌ Error fetching orders:", error);
          return;
        }

        let filteredData = data || [];

        // Si hay término de búsqueda, filtrar por nombre, apellido, número, ID o códigos
        if (term) {
          const searchLower = term.toLowerCase();
          filteredData = filteredData.filter((order) => {
            const customer = order.customers;

            // Buscar en campos de la orden
            const matchOrder =
              order.id?.toLowerCase().includes(searchLower) ||
              order.order_number?.toLowerCase().includes(searchLower) ||
              order.order_code?.toLowerCase().includes(searchLower);

            // Buscar en campos del cliente
            const matchCustomer = customer
              ? (customer.nombre?.toLowerCase() || "").includes(searchLower) ||
                (customer.apellido?.toLowerCase() || "").includes(
                  searchLower
                ) ||
                (customer.numero?.toLowerCase() || "").includes(searchLower)
              : false;

            return matchOrder || matchCustomer;
          });
        }

        console.log("✅ Fetched orders:", filteredData);
        setOrders(filteredData);
      } catch (err) {
        console.error("⚠️ Unexpected error:", err);
      }
    };

    // Agregamos un debounce de 300 ms para evitar múltiples llamadas
    const delayDebounce = setTimeout(() => {
      fetchOrders();
    }, 300);

    // Limpiar timeout si el usuario sigue escribiendo
    return () => clearTimeout(delayDebounce);
  }, [searchTerm]);

  const updateEnvio = async (order: Order, estado: ShippingStatus) => {
    // Estados que requieren modal: preparado, en_ruta, en_agencia, entregado
    const requiresModal = [
      "preparado",
      "en_ruta",
      "en_agencia",
      "entregado",
    ].includes(estado);

    if (requiresModal) {
      setPendingShippingOrder(order);
      setPendingShippingStatus(estado);
      setOpenShippingModal(true);
    } else {
      // Para "pendiente", actualizar directamente
      if (order.id) {
        await supabase
          .from("orders")
          .update({ estado_envio: estado })
          .eq("id", order.id);
        setOrders((prev) =>
          prev.map((o) =>
            o.id === order.id ? { ...o, estado_envio: estado } : o
          )
        );

        // Enviar webhook a N8N
        await sendWebhookToN8N(orders.find((o) => o.id === order.id) || order);
      }
    }
  };

  const updatePago = async (order: Order, estado: PaymentStatus) => {
    // Si cambia a "adelanto" o "pagado", mostrar modal de pago
    if (estado === "adelanto" || estado === "pagado") {
      setPendingPaymentOrder(order);
      setPendingPaymentType(estado);
      setOpenPaymentModal(true);
    } else {
      // Para "pendiente", actualizar directamente sin modal
      if (order.id) {
        await supabase
          .from("orders")
          .update({ estado_pago: estado })
          .eq("id", order.id);
        setOrders((prev) =>
          prev.map((o) =>
            o.id === order.id ? { ...o, estado_pago: estado } : o
          )
        );
      }
    }
  };

  const handlePaymentSubmit = async (amount: number, paymentCode: string) => {
    if (!pendingPaymentOrder?.id) return;

    try {
      // 1. Crear registro de pago
      const { error: paymentError } = await supabase
        .from("order_payments")
        .insert({
          order_id: pendingPaymentOrder.id,
          amount: amount,
          payment_code: paymentCode,
          payment_type: pendingPaymentType,
        });

      if (paymentError) throw paymentError;

      // 2. Calcular nuevos montos
      const newAmountPaid = pendingPaymentOrder.amount_paid + amount;
      const newAmountDue = pendingPaymentOrder.total - newAmountPaid;

      // 3. Determinar el nuevo estado de pago
      let newEstadoPago: PaymentStatus;
      if (newAmountDue <= 0) {
        newEstadoPago = "pagado";
      } else if (pendingPaymentType === "adelanto") {
        newEstadoPago = "adelanto";
      } else {
        newEstadoPago = pendingPaymentOrder.estado_pago;
      }

      // 4. Actualizar la orden
      const { error: updateError } = await supabase
        .from("orders")
        .update({
          estado_pago: newEstadoPago,
          amount_paid: newAmountPaid,
        })
        .eq("id", pendingPaymentOrder.id);

      if (updateError) throw updateError;

      // 5. Actualizar el estado local
      setOrders((prev) =>
        prev.map((o) =>
          o.id === pendingPaymentOrder.id
            ? {
                ...o,
                estado_pago: newEstadoPago,
                amount_paid: newAmountPaid,
              }
            : o
        )
      );

      // 6. Cerrar modal
      setOpenPaymentModal(false);
      setPendingPaymentOrder(null);
    } catch (error) {
      console.error("Error al registrar pago:", error);
      alert("Error al registrar el pago. Por favor intenta de nuevo.");
    }
  };

  const handleShippingConfirm = async (data: {
    shipping_address?: string;
    order_number?: string;
    order_code?: string;
    pickup_password?: string;
  }) => {
    if (!pendingShippingOrder?.id) return;

    try {
      const updateData: Partial<Order> = {
        estado_envio: pendingShippingStatus,
        ...data,
      };

      // Actualizar orden en Supabase
      const { error: updateError } = await supabase
        .from("orders")
        .update(updateData)
        .eq("id", pendingShippingOrder.id);

      if (updateError) throw updateError;

      // Actualizar estado local
      const updatedOrder = {
        ...pendingShippingOrder,
        ...updateData,
      };

      setOrders((prev) =>
        prev.map((o) => (o.id === pendingShippingOrder.id ? updatedOrder : o))
      );

      // Enviar webhook a N8N
      await sendWebhookToN8N(updatedOrder);

      // Cerrar modal
      setOpenShippingModal(false);
      setPendingShippingOrder(null);
    } catch (error) {
      console.error("Error al actualizar estado de envío:", error);
      alert("Error al actualizar el envío. Por favor intenta de nuevo.");
    }
  };

  const printShippingLabel = (order: Order) => {
    const customer = order.customers;
    if (!customer || !order.id) return;

    // Crear ventana de impresión
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    // Obtener resumen de productos

    // HTML de la etiqueta A7 (105mm x 74mm)
    const labelHTML = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <title>Etiqueta de Envío - Pedido #${order.id.substring(0, 8)}</title>
          <style>
            @page {
              size: A4;
              margin: 0;
            }
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            body {
              width: 210mm;
              height: 297mm;
              position: relative;
            }
            .label-container {
              position: absolute;
              bottom: 1;
              left: 0;
              width: 105mm;
              height: 74mm;
              padding: 8mm;
              font-family: Arial, sans-serif;
              font-size: 10pt;
              line-height: 1.3;
              border: 1px dashed #999;
            }
            .header {
              text-align: center;
              border-bottom: 2px solid #000;
              padding-bottom: 3mm;
              margin-bottom: 3mm;
            }
            .header h1 {
              font-size: 14pt;
              font-weight: bold;
            }
            .order-id {
              font-size: 9pt;
              color: #666;
              margin-top: 1mm;
            }
            .section {
              margin-bottom: 3mm;
            }
            .section-title {
              font-weight: bold;
              font-size: 9pt;
              text-transform: uppercase;
              color: #333;
              border-bottom: 1px solid #ccc;
              margin-bottom: 1mm;
            }
            .section-content {
              font-size: 10pt;
            }
            .items {
              font-size: 9pt;
              background: #f5f5f5;
              padding: 2mm;
              border-radius: 2mm;
            }
            .footer {
              position: absolute;
              bottom: 8mm;
              left: 8mm;
              right: 8mm;
              text-align: center;
              font-size: 8pt;
              color: #999;
              border-top: 1px solid #ccc;
              padding-top: 2mm;
            }
          </style>
        </head>
        <body>
          <div class="label-container">
            <div class="header">
              <h1>ETIQUETA DE ENVÍO</h1>
              <div class="order-id">Pedido: #${order.id
                .substring(0, 8)
                .toUpperCase()}</div>
            </div>

          <div class="section">
            <div class="section-title">Destinatario</div>
            <div class="section-content">
              <strong>${customer.nombre} ${customer.apellido}</strong><br>
              Tel: ${customer.numero}
            </div>
          </div>

          <div class="section">
            <div class="section-title">${
              order.envio_provincia ? "Ubicación" : "Dirección"
            }</div>
            <div class="section-content">
              ${
                order.envio_provincia
                  ? // PROVINCIA: Solo distrito, provincia y departamento
                    `
                ${customer.distrito ? `${customer.distrito}` : ""}${
                      customer.provincia ? `, ${customer.provincia}` : ""
                    }${
                      customer.departamento
                        ? `<br>${customer.departamento}`
                        : ""
                    }
              `
                  : // LIMA/CALLAO: Dirección completa + distrito + departamento
                    `
                ${
                  order.shipping_address ||
                  customer.direccion ||
                  "No especificada"
                }
                ${customer.distrito ? `<br>${customer.distrito}` : ""}${
                      customer.departamento ? `, ${customer.departamento}` : ""
                    }
              `
              }
            </div>
          </div>

          ${
            customer.referencia
              ? `
          <div class="section">
            <div class="section-title">Referencia</div>
            <div class="section-content">${customer.referencia}</div>
          </div>
          `
              : ""
          }

          ${
            order.pickup_password && order.envio_provincia
              ? `
          <div class="section">
            <div class="section-title">Contraseña de Recojo</div>
            <div class="section-content">
              <strong style="font-size: 12pt; color: #e74c3c;">${order.pickup_password}</strong>
            </div>
          </div>
          `
              : ""
          }

          ${
            order.order_number
              ? `
          <div class="footer">
            Código de tracking: <strong>${order.order_number}</strong>
          </div>
          `
              : ""
          }
          </div>
        </body>
      </html>
    `;

    printWindow.document.write(labelHTML);
    printWindow.document.close();

    // Esperar a que cargue y luego imprimir
    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.print();
      }, 250);
    };
  };

  const sendWebhookToN8N = async (order: Order) => {
    const N8N_WEBHOOK_URL = import.meta.env.VITE_N8N_WEBHOOK_STATUS as
      | string
      | undefined; // Reemplazar con URL real

    try {
      if (N8N_WEBHOOK_URL) {
        await fetch(N8N_WEBHOOK_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            order_id: order.id,
            customer: order.customers,
            order_items: order.order_items,
            estado_pago: order.estado_pago,
            estado_envio: order.estado_envio,
            envio_provincia: order.envio_provincia,
            total: order.total,
            amount_paid: order.amount_paid,
            amount_due: order.amount_due,
            shipping_address: order.shipping_address,
            order_number: order.order_number,
            order_code: order.order_code,
            pickup_password: order.pickup_password,
            created_at: order.created_at,
          }),
        });
      } else {
        console.warn("N8N webhook URL is not defined.");
      }
    } catch (error) {
      console.error("Error enviando webhook a N8N:", error);
      // No mostrar error al usuario, solo loguearlo
    }
  };

  const handleUserUpdate = (updatedUser: Customer) => {
    // Actualizar la orden con los nuevos datos del cliente
    setOrders((prev) =>
      prev.map((order) =>
        order.customers?.id === updatedUser.id
          ? { ...order, customers: updatedUser }
          : order
      )
    );
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Pedidos</h1>
        <Button
          variant="outline"
          onClick={handleLogout}
          className="flex items-center gap-2"
        >
          <LogOut className="w-4 h-4" />
          Cerrar Sesión
        </Button>
      </div>

      <div className="mb-4">
        <Input
          type="text"
          placeholder="Buscar por ID, nombre, apellido o teléfono..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-md"
        />
      </div>

      <DataTable
        columns={[
          {
            header: "Cliente",
            accessorKey: "customers.nombre",
            cell: ({ row }) => {
              const user = row.original.customers;
              if (!user)
                return (
                  <span className="text-muted-foreground">Sin usuario</span>
                );

              return (
                <Button
                  variant="link"
                  onClick={() => {
                    console.log("Selected user:", user);
                    setSelectedUser(user);
                    setOpenUserModal(true);
                  }}
                >
                  {user.nombre} {user.apellido}
                </Button>
              );
            },
          },
          {
            header: "Orden",
            accessorKey: "id",
            cell: ({ row }) => {
              const order = row.original;
              return (
                <Button
                  variant="link"
                  onClick={() => {
                    console.log("Selected order:", order);
                    setSelectedOrder(order);
                    setOpenOrderModal(true);
                  }}
                  className="font-mono"
                >
                  #{order.id?.substring(0, 8).toUpperCase()}
                </Button>
              );
            },
          },
          {
            header: "Cantidad",
            accessorKey: "order_items",
            cell: ({ row }) => {
              const orderItems = row.original.order_items;
              if (!orderItems || orderItems.length === 0) return "—";
              const totalQuantity = orderItems.reduce(
                (sum, item) => sum + (item.cantidad || 0),
                0
              );
              return totalQuantity;
            },
          },

          {
            header: "Fecha",
            accessorKey: "created_at",
            cell: ({ row }) => {
              const createdAt = row.original.created_at;
              if (!createdAt) return "—";
              return (
                <span className="text-sm">{formatDateShort(createdAt)}</span>
              );
            },
          },
          {
            header: "Pagado",
            accessorKey: "amount_paid",
            cell: ({ row }) => {
              const amount = row.original.amount_paid;
              return (
                <span className="text-sm font-medium text-green-600">
                  S/ {amount?.toFixed(2) || "0.00"}
                </span>
              );
            },
          },
          {
            header: "Por Pagar",
            accessorKey: "amount_due",
            cell: ({ row }) => {
              const amount = row.original.amount_due;
              return (
                <span className="text-sm font-medium text-orange-600">
                  S/ {amount?.toFixed(2) || "0.00"}
                </span>
              );
            },
          },
          {
            header: "Provincia",
            accessorKey: "envio_provincia",
            cell: ({ row }) => {
              const isProvincia = row.original.envio_provincia;
              return (
                <span
                  className={`text-xs font-semibold px-2 py-1 rounded ${
                    isProvincia
                      ? "bg-blue-100 text-blue-700"
                      : "bg-gray-100 text-gray-700"
                  }`}
                >
                  {isProvincia ? "Provincia" : "Lima"}
                </span>
              );
            },
          },
          {
            header: "Pago",
            accessorKey: "estado_pago",
            cell: ({ row }) => {
              const order = row.original;
              if (!order.id) return null;

              return (
                <Select
                  defaultValue={order.estado_pago}
                  onValueChange={(val: PaymentStatus) => updatePago(order, val)}
                >
                  <SelectTrigger
                    className={`w-[140px] border ${getPaymentStatusColor(
                      order.estado_pago
                    )}`}
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pendiente">
                      <span className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-yellow-500"></span>
                        Pendiente
                      </span>
                    </SelectItem>
                    {order.envio_provincia && (
                      <SelectItem value="adelanto">
                        <span className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                          Adelanto
                        </span>
                      </SelectItem>
                    )}
                    <SelectItem value="pagado">
                      <span className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-green-500"></span>
                        Pagado
                      </span>
                    </SelectItem>
                  </SelectContent>
                </Select>
              );
            },
          },
          {
            header: "Envío",
            accessorKey: "estado_envio",
            cell: ({ row }) => {
              const order = row.original;
              if (!order.id) return null;

              return (
                <Select
                  defaultValue={order.estado_envio}
                  onValueChange={(val: ShippingStatus) =>
                    updateEnvio(order, val)
                  }
                >
                  <SelectTrigger
                    className={`w-[140px] border ${getShippingStatusColor(
                      order.estado_envio
                    )}`}
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pendiente">
                      <span className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-gray-500"></span>
                        Pendiente
                      </span>
                    </SelectItem>
                    <SelectItem value="preparado">
                      <span className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                        Preparado
                      </span>
                    </SelectItem>
                    <SelectItem value="en_ruta">
                      <span className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                        En Ruta
                      </span>
                    </SelectItem>
                    {order.envio_provincia && (
                      <SelectItem value="en_agencia">
                        <span className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                          En Agencia
                        </span>
                      </SelectItem>
                    )}
                    <SelectItem value="entregado">
                      <span className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-green-500"></span>
                        Entregado
                      </span>
                    </SelectItem>
                  </SelectContent>
                </Select>
              );
            },
          },
          {
            header: "Etiqueta",
            accessorKey: "print",
            cell: ({ row }) => {
              const order = row.original;
              return (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => printShippingLabel(order)}
                  className="gap-2"
                >
                  <Printer className="h-4 w-4" />
                  Imprimir
                </Button>
              );
            },
          },
        ]}
        data={orders}
      />

      <CustomerModal
        open={openUserModal}
        onClose={() => setOpenUserModal(false)}
        user={selectedUser}
        onUpdate={handleUserUpdate}
      />

      <OrderModal
        open={openOrderModal}
        onClose={() => setOpenOrderModal(false)}
        order={selectedOrder}
      />

      <PaymentModal
        open={openPaymentModal}
        onClose={() => {
          setOpenPaymentModal(false);
          setPendingPaymentOrder(null);
        }}
        onSubmit={handlePaymentSubmit}
        paymentType={pendingPaymentType}
        amountDue={pendingPaymentOrder?.amount_due || 0}
        total={pendingPaymentOrder?.total || 0}
      />

      <ShippingStatusModal
        open={openShippingModal}
        onClose={() => {
          setOpenShippingModal(false);
          setPendingShippingOrder(null);
        }}
        onConfirm={handleShippingConfirm}
        status={pendingShippingStatus}
        isProvincia={pendingShippingOrder?.envio_provincia || false}
      />
    </div>
  );
}
