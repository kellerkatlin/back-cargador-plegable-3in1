import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/data-table";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { CustomerModal } from "@/components/CustomerModal";
import { OrderModal } from "@/components/OrderModal";
import { LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";

import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import type { Order, ShippingStatus } from "@/types/order";
import type { Customer } from "@/types/customer";

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedUser, setSelectedUser] = useState<Customer | null>(null);
  const [openUserModal, setOpenUserModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [openOrderModal, setOpenOrderModal] = useState(false);
  const navigate = useNavigate();

  const formatDateShort = (dateString: string) => {
    // El formato que viene del backend es: 2025-11-05 23:25:47.881608
    // Lo convertimos a ISO format para que Date lo interprete correctamente
    const isoDate = dateString.replace(' ', 'T') + 'Z'; // Agregamos Z para indicar UTC
    
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
      const { data, error } = await supabase
        .from("orders")
        .select("*, customers(*), order_items(*)")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching orders:", error);
        return;
      }

      console.log("Fetched orders:", data);
      setOrders(data || []);
    };

    fetchOrders();
  }, []);

  const updateEnvio = async (id: string, estado: ShippingStatus) => {
    await supabase.from("orders").update({ estado_envio: estado }).eq("id", id);
    setOrders((prev) =>
      prev.map((o) => (o.id === id ? { ...o, estado_envio: estado } : o))
    );
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
                  #{order.id}
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
            header: "Color",
            accessorKey: "order_items",
            cell: ({ row }) => {
              const orderItems = row.original.order_items;
              if (!orderItems || orderItems.length === 0) return "—";
              if (orderItems.length === 1) return orderItems[0].color;
              return `${orderItems[0].color} +${orderItems.length - 1}`;
            },
          },
          {
            header: "Fecha",
            accessorKey: "created_at",
            cell: ({ row }) => {
              const createdAt = row.original.created_at;
              if (!createdAt) return "—";
              return (
                <span className="text-sm">
                  {formatDateShort(createdAt)}
                </span>
              );
            },
          },
          { header: "Total", accessorKey: "total" },
          {
            header: "Pago",
            accessorKey: "estado_pago",
            cell: ({ row }) => <Badge>{row.original.estado_pago}</Badge>,
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
                    updateEnvio(order.id!, val)
                  }
                >
                  <SelectTrigger className="w-[140px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pendiente">Pendiente</SelectItem>
                    <SelectItem value="preparado">Preparado</SelectItem>
                    <SelectItem value="en_ruta">En Ruta</SelectItem>
                    <SelectItem value="en_agencia">En Agencia</SelectItem>
                    <SelectItem value="entregado">Entregado</SelectItem>
                  </SelectContent>
                </Select>
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
    </div>
  );
}
