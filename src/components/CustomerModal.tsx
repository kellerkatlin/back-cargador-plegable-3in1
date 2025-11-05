import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Edit, Save, X } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import type { Customer } from "@/types/customer";

type CustomerModalProps = {
  open: boolean;
  onClose: () => void;
  user: Customer | null;
  onUpdate?: (updatedUser: Customer) => void;
};

export function CustomerModal({
  open,
  onClose,
  user,
  onUpdate,
}: CustomerModalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [editedUser, setEditedUser] = useState<Customer | null>(null);
  const [currentDisplayUser, setCurrentDisplayUser] = useState<Customer | null>(
    null
  );

  // Sincronizar currentDisplayUser con user cuando cambie
  useEffect(() => {
    if (user) {
      setCurrentDisplayUser(user);
    }
  }, [user]);

  if (!user) return null;

  const handleEdit = () => {
    setEditedUser({ ...(currentDisplayUser || user) });
    setIsEditing(true);
  };

  const handleCancel = () => {
    setEditedUser(null);
    setIsEditing(false);
  };

  const handleSave = async () => {
    if (!editedUser) return;

    console.log("Saving user with ID:", user.id);
    console.log("Edited User:", editedUser);

    if (!user.id) {
      toast.error("Error: ID del cliente no encontrado");
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("customers")
        .update({
          nombre: editedUser.nombre,
          apellido: editedUser.apellido,
          numero: editedUser.numero,
          direccion: editedUser.direccion,
          referencia: editedUser.referencia,
          distrito: editedUser.distrito,
          provincia: editedUser.provincia,
          departamento: editedUser.departamento,
        })
        .eq("id", user.id)
        .select();

      if (error) {
        console.error("Supabase error:", error);
        throw error;
      }

      console.log("Update successful:", data);
      toast.success("Cliente actualizado correctamente");

      // Actualizar el usuario mostrado en el modal con los datos editados
      setCurrentDisplayUser(editedUser);
      onUpdate?.(editedUser);
      setIsEditing(false);
      setEditedUser(null);
    } catch (error) {
      console.error("Error updating customer:", error);
      toast.error("Error al actualizar el cliente");
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: keyof Customer, value: string) => {
    if (!editedUser) return;
    setEditedUser({ ...editedUser, [field]: value });
  };

  const currentUser = editedUser || currentDisplayUser || user;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>Datos del Cliente</DialogTitle>
            {!isEditing && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleEdit}
                className="gap-2"
              >
                <Edit className="w-4 h-4" />
                Editar
              </Button>
            )}
          </div>
        </DialogHeader>

        <div className="space-y-8">
          {!isEditing ? (
            // VISTA SOLO LECTURA
            <div className="bg-muted/30 rounded-lg border p-6 space-y-4 text-base leading-relaxed">
              <div className="grid grid-cols-2 gap-y-3 gap-x-6">
                <p>
                  <span className="font-medium text-muted-foreground">
                    Nombre:
                  </span>
                  <br /> {currentUser.nombre}
                </p>
                <p>
                  <span className="font-medium text-muted-foreground">
                    Apellido:
                  </span>
                  <br /> {currentUser.apellido}
                </p>
                <p>
                  <span className="font-medium text-muted-foreground">
                    Número:
                  </span>
                  <br /> {currentUser.numero}
                </p>

                <p className="col-span-2">
                  <span className="font-medium text-muted-foreground">
                    Dirección:
                  </span>
                  <br /> {currentUser.direccion}
                </p>

                <p className="col-span-2">
                  <span className="font-medium text-muted-foreground">
                    Referencia:
                  </span>
                  <br /> {currentUser.referencia ?? "—"}
                </p>

                <p>
                  <span className="font-medium text-muted-foreground">
                    Distrito:
                  </span>
                  <br /> {currentUser.distrito}
                </p>
                <p>
                  <span className="font-medium text-muted-foreground">
                    Provincia:
                  </span>
                  <br /> {currentUser.provincia}
                </p>
                <p>
                  <span className="font-medium text-muted-foreground">
                    Departamento:
                  </span>
                  <br /> {currentUser.departamento}
                </p>
              </div>
            </div>
          ) : (
            // VISTA EDICIÓN
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="nombre">Nombre</Label>
                  <Input
                    id="nombre"
                    value={currentUser.nombre}
                    onChange={(e) =>
                      handleInputChange("nombre", e.target.value)
                    }
                    className="mt-2 h-11 text-base"
                  />
                </div>
                <div>
                  <Label htmlFor="apellido">Apellido</Label>
                  <Input
                    id="apellido"
                    value={currentUser.apellido}
                    onChange={(e) =>
                      handleInputChange("apellido", e.target.value)
                    }
                    className="mt-2 h-11 text-base"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="numero">Número</Label>
                <Input
                  id="numero"
                  value={currentUser.numero}
                  onChange={(e) => handleInputChange("numero", e.target.value)}
                  className="mt-2 h-11 text-base"
                />
              </div>

              <div>
                <Label htmlFor="direccion">Dirección</Label>
                <Input
                  id="direccion"
                  value={currentUser.direccion}
                  onChange={(e) =>
                    handleInputChange("direccion", e.target.value)
                  }
                  className="mt-2 h-11 text-base"
                />
              </div>

              <div>
                <Label htmlFor="referencia">Referencia</Label>
                <Input
                  id="referencia"
                  value={currentUser.referencia ?? ""}
                  onChange={(e) =>
                    handleInputChange("referencia", e.target.value)
                  }
                  className="mt-2 h-11 text-base"
                />
              </div>

              <div className="grid grid-cols-3 gap-6">
                <div>
                  <Label htmlFor="distrito">Distrito</Label>
                  <Input
                    id="distrito"
                    value={currentUser.distrito}
                    onChange={(e) =>
                      handleInputChange("distrito", e.target.value)
                    }
                    className="mt-2 h-11 text-base"
                  />
                </div>
                <div>
                  <Label htmlFor="provincia">Provincia</Label>
                  <Input
                    id="provincia"
                    value={currentUser.provincia}
                    onChange={(e) =>
                      handleInputChange("provincia", e.target.value)
                    }
                    className="mt-2 h-11 text-base"
                  />
                </div>
                <div>
                  <Label htmlFor="departamento">Departamento</Label>
                  <Input
                    id="departamento"
                    value={currentUser.departamento}
                    onChange={(e) =>
                      handleInputChange("departamento", e.target.value)
                    }
                    className="mt-2 h-11 text-base"
                  />
                </div>
              </div>

              {/* BOTONES */}
              <div className="flex justify-end gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={handleCancel}
                  disabled={isLoading}
                  className="h-10 px-4"
                >
                  <X className="w-4 h-4 mr-2" /> Cancelar
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={isLoading}
                  className="h-10 px-5"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {isLoading ? "Guardando..." : "Guardar"}
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
