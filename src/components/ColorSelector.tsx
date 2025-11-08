import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface Color {
  name: string;
  value: string;
  hex: string;
}

interface ColorSelectorProps {
  selectedColor: string;
  onColorChange: (color: string) => void;
  availableColors?: string[]; // Opcional: lista de colores con stock disponible
  getColorStock?: (color: string) => number; // Opcional: función para obtener stock
}

const colors: Color[] = [
  { name: "Blanco", value: "White", hex: "#FFFFFF" },
  { name: "Gris", value: "Gray", hex: "#6B7280" },
  { name: "Negro", value: "Black", hex: "#1a1a1a" },
  { name: "Plateado", value: "Silvery", hex: "#C0C0C0" },
];

export const ColorSelector = ({
  selectedColor,
  onColorChange,
  availableColors,
  getColorStock,
}: ColorSelectorProps) => {
  return (
    <div className="space-y-4">
      <label className="text-sm font-semibold text-foreground">
        Color Disponible
      </label>
      <div className="flex gap-3">
        {colors.map((color) => {
          const isAvailable = availableColors
            ? availableColors.includes(color.value)
            : true;
          const stock = getColorStock ? getColorStock(color.value) : null;
          const hasStock = stock === null || stock > 0;
          const isDisabled = !isAvailable || !hasStock;

          return (
            <button
              key={color.value}
              type="button"
              onClick={() => !isDisabled && onColorChange(color.value)}
              disabled={isDisabled}
              className={cn(
                "relative w-12 h-12 rounded-full border-2 transition-all duration-200",
                !isDisabled && "hover:scale-105",
                selectedColor === color.value
                  ? "border-primary shadow-md ring-2 ring-primary/30"
                  : "border-border hover:border-primary/50",
                color.value === "White" && "border-gray-300",
                isDisabled &&
                  "opacity-40 cursor-not-allowed grayscale hover:scale-100"
              )}
              style={{ backgroundColor: color.hex }}
              title={
                isDisabled
                  ? `${color.name} - Sin stock`
                  : stock !== null
                  ? `${color.name} - Stock: ${stock}`
                  : color.name
              }
            >
              {selectedColor === color.value && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Check
                    className={cn(
                      "w-6 h-6 drop-shadow-md",
                      color.value === "White" || color.value === "Silvery"
                        ? "text-gray-700"
                        : "text-white"
                    )}
                    strokeWidth={3}
                  />
                </div>
              )}
              {isDisabled && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-0.5 h-full bg-red-500 rotate-45" />
                </div>
              )}
            </button>
          );
        })}
      </div>
      <p className="text-sm text-muted-foreground">
        Color seleccionado:{" "}
        <span className="font-medium text-foreground">
          {colors.find((c) => c.value === selectedColor)?.name}
        </span>
      </p>
    </div>
  );
};
