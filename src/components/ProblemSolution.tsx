import { Badge } from "@/components/ui/badge";
import { X, Check } from "lucide-react";
import problemImage from "@/assets/problema.webp";
import { useState } from "react";
import solutionImage from "@/assets/solucion.jpg";
import { motion } from "framer-motion";

export const ProblemSolution = () => {
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);

  const handleMove = (
    e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>
  ) => {
    if (!isDragging && e.type !== "click") return;

    const container = e.currentTarget;
    const rect = container.getBoundingClientRect();
    const x = "touches" in e ? e.touches[0].clientX : e.clientX;
    const position = ((x - rect.left) / rect.width) * 100;

    setSliderPosition(Math.min(Math.max(position, 0), 100));
  };

  const handleMouseDown = () => setIsDragging(true);
  const handleMouseUp = () => setIsDragging(false);
  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => handleMove(e);
  return (
    <section className="py-12 sm:py-20 px-0 bg-background">
      <div className="container mx-auto ">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12 sm:mb-16 space-y-3 sm:space-y-4"
        >
          <Badge className="bg-primary/10 text-primary border-primary/20 text-xs sm:text-sm">
            ¿Por qué nosotros?
          </Badge>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold">
            De la Frustración a la Libertad
          </h2>
          <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
            Así es como transformamos tu experiencia de carga
          </p>
        </motion.div>

        {/* Problem vs Solution Grid */}
        <div className="grid md:grid-cols-2 gap-6 lg:gap-8 mb-12 sm:mb-16">
          {/* PROBLEMA */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            className="relative group"
          >
            <div className="absolute -inset-1 bg-gradient-to-br from-destructive/20 to-destructive/5 rounded-3xl blur-xl opacity-50 group-hover:opacity-75 transition-opacity duration-500"></div>

            <div className="relative bg-muted/30 rounded-2xl sm:rounded-3xl overflow-hidden border-2 border-destructive/20 hover:border-destructive/40 transition-all duration-300">
              {/* Badge */}

              {/* Image */}
              <div className="relative aspect-[4/3] bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center">
                <img
                  src={problemImage}
                  alt="Problema de carga"
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Content */}
              <div className="p-6 sm:p-8 space-y-4">
                <h3 className="text-xl sm:text-2xl font-bold text-foreground">
                  Múltiples Cables, Cero Organización
                </h3>

                <ul className="space-y-3">
                  {[
                    "Cables enredados por todas partes",
                    "Batería agotada en el momento menos esperado",
                    "Cargadores incompatibles entre dispositivos",
                    "Peso excesivo al viajar con varios cargadores",
                  ].map((item) => (
                    <li
                      key={item}
                      className="flex items-start gap-3 text-sm sm:text-base text-muted-foreground"
                    >
                      <X className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </motion.div>

          {/* SOLUCIÓN */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative group"
          >
            <div className="absolute -inset-1 bg-gradient-to-br from-primary/20 to-primary/5 rounded-3xl blur-xl opacity-50 group-hover:opacity-75 transition-opacity duration-500"></div>

            <div className="relative bg-muted/30 rounded-2xl sm:rounded-3xl overflow-hidden border-2 border-primary/20 hover:border-primary/40 transition-all duration-300">
              {/* Badge */}

              {/* Image placeholder */}
              <div className="relative aspect-[4/3] bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center">
                <img
                  src={solutionImage}
                  alt="Solución con PowerBank 3 en 1"
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Content */}
              <div className="p-6 sm:p-8 space-y-4">
                <h3 className="text-xl sm:text-2xl font-bold text-foreground">
                  Un Solo Dispositivo, Todo Organizado
                </h3>

                <ul className="space-y-3">
                  {[
                    "Carga 3 dispositivos simultáneamente sin cables",
                    "10,000 mAh para días completos sin preocupaciones",
                    "Compatible con iPhone, Android, Watch y AirPods",
                    "Diseño compacto y portátil perfecto para viajar",
                  ].map((item) => (
                    <li
                      key={item}
                      className="flex items-start gap-3 text-sm sm:text-base text-foreground"
                    >
                      <Check className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Interactive Before/After Slider */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="max-w-4xl mx-auto mb-12 sm:mb-16"
        >
          <div className="text-center mb-6 sm:mb-8">
            <h3 className="text-2xl sm:text-3xl font-bold mb-2">
              Desliza para Ver la Transformación
            </h3>
            <p className="text-sm sm:text-base text-muted-foreground">
              Arrastra el control para comparar antes y después
            </p>
          </div>

          <div
            className="relative aspect-video rounded-2xl overflow-hidden shadow-2xl cursor-ew-resize select-none"
            onMouseMove={handleMove}
            onTouchMove={handleMove}
            onMouseDown={handleMouseDown}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onClick={handleClick}
            role="slider"
            aria-label="Comparar antes y después"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={sliderPosition}
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "ArrowLeft")
                setSliderPosition(Math.max(0, sliderPosition - 5));
              if (e.key === "ArrowRight")
                setSliderPosition(Math.min(100, sliderPosition + 5));
            }}
          >
            {/* After Image (Solution) - Full width */}
            <div className="absolute inset-0">
              <img
                src={solutionImage}
                alt="Con Power Bank 3 en 1"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent"></div>
            </div>

            {/* Before Image (Problem) - Clipped by slider */}
            <div
              className="absolute inset-0"
              style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
            >
              <img
                src={problemImage}
                alt="Sin Power Bank"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent"></div>
            </div>

            {/* Slider Line and Handle */}
            <div
              className="absolute top-0 bottom-0 w-1 bg-white shadow-2xl"
              style={{ left: `${sliderPosition}%` }}
            >
              {/* Handle */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 bg-white rounded-full shadow-2xl flex items-center justify-center cursor-ew-resize hover:scale-110 transition-transform">
                <div className="flex gap-1">
                  <div className="w-0.5 h-6 bg-gray-400"></div>
                  <div className="w-0.5 h-6 bg-gray-400"></div>
                </div>
              </div>

              {/* Top Label */}
              <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-white px-3 py-1 rounded-full shadow-lg">
                <p className="text-xs font-semibold text-gray-700">
                  {sliderPosition < 50 ? "DESPUÉS →" : "← ANTES"}
                </p>
              </div>
            </div>

            {/* Corner Labels */}
            <div className="absolute top-4 left-4 bg-destructive/90 backdrop-blur-sm px-3 py-1.5 rounded-full">
              <p className="text-xs font-bold text-destructive-foreground">
                ANTES
              </p>
            </div>
            <div className="absolute top-4 right-4 bg-primary/90 backdrop-blur-sm px-3 py-1.5 rounded-full">
              <p className="text-xs font-bold text-primary-foreground">
                DESPUÉS
              </p>
            </div>
          </div>

          <p className="text-center text-xs sm:text-sm text-muted-foreground mt-4">
            💡 Tip: Haz clic o arrastra para comparar
          </p>
        </motion.div>

        {/* Bottom CTA */}
        <div className="text-center mt-12 sm:mt-16">
          <p className="text-lg sm:text-xl font-semibold text-foreground mb-2">
            ¿Listo para simplificar tu vida?
          </p>
          <p className="text-sm sm:text-base text-muted-foreground">
            Miles de clientes satisfechos ya disfrutan de la libertad sin cables
          </p>
        </div>
      </div>
    </section>
  );
};
