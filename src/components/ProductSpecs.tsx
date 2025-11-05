import { Badge } from "@/components/ui/badge";
import { Smartphone, Watch, Package, Award, Asterisk } from "lucide-react";
import { motion } from "framer-motion";

import Cargador from "@/assets/cargador.avif";
import Cable from "@/assets/cable.avif";
import { TbDeviceAirpods } from "react-icons/tb";

export const ProductSpecs = () => {
  const specifications = [
    {
      label: "Compatible con iPhones",
      value: ["Serie iPhone 17, 16, 15, 14, 13, 12", "Excluye iPhone 16e"],
    },
    {
      label: "Compatible con Apple Watch",
      value: [
        "Series 2-11",
        "Ultra / Ultra 2 / Ultra 3",
        "SE (todas las generaciones)",
      ],
    },
    {
      label: "Compatible con Auriculares",
      value: [
        "AirPods Pro 3 / AirPods Pro 2 / AirPods Pro (con Cancelación Activa de Ruido)",
        "AirPods 4 (con Cancelación Activa de Ruido)",
        "AirPods 3 (con estuche de carga MagSafe)",
        "AirPods 2 (con estuche de carga inalámbrica)",
        "Otros auriculares inalámbricos compatibles con Qi",
      ],
    },
    {
      label: "Potencia de salida",
      value: "15W/10W/7.5W/5W",
    },
    {
      label: "Voltaje / Corriente de entrada",
      value: "9V/2.2A, 12V/1.5A",
    },
    {
      label: "Salida inalámbrica para reloj",
      value: "5W",
    },
    {
      label: "Salida inalámbrica para teléfono",
      value: "25W/15W/10W/7.5W/5W",
    },
    {
      label: "Salida inalámbrica para auriculares",
      value: "5W",
    },
    {
      label: "Dimensiones",
      value: "64mm x 64mm x 23mm / 2.52in x 2.52in x 0.91in",
    },

    {
      label: "Certificación del Producto",
      value: "Qi2.2 CE FCC",
    },
  ];

  const includes = [
    {
      img: Cargador,
      label: "Wireless Charger",
      description: "Cargador principal",
    },
    { img: Cable, label: "Cable de carga", description: "USB-C a USB-C" },
  ];

  return (
    <section className="py-12 sm:py-20 px-0 bg-muted/20">
      <div className="container mx-auto max-w-6xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="text-center mb-8 sm:mb-12"
        >
          <Badge
            variant="outline"
            className="bg-primary/10 text-primary border-primary/20 text-xs sm:text-sm mb-4"
          >
            Especificaciones Técnicas
          </Badge>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
            Detalles del Producto
          </h2>
          <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
            Toda la información técnica que necesitas conocer
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Left Column - Specifications */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="lg:col-span-2 space-y-4"
          >
            {/* Specifications Card */}
            <div className="bg-background rounded-2xl border border-border shadow-sm overflow-hidden">
              {/* Header */}
              <div className="bg-muted/50 px-4 sm:px-6 py-4 border-b border-border">
                <h3 className="text-lg sm:text-xl font-bold flex items-center gap-2">
                  <Award className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                  Especificaciones del Producto
                </h3>
              </div>

              {/* Specifications List */}
              <div className="divide-y divide-border">
                {specifications.map((spec, index) => (
                  <div
                    key={index}
                    className="px-4 sm:px-6 py-4 sm:py-5 hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-4">
                      <div className="font-semibold text-sm sm:text-base text-foreground min-w-[140px] sm:min-w-[200px]">
                        {spec.label}
                      </div>
                      <div className="flex-1">
                        {Array.isArray(spec.value) ? (
                          <ul className="space-y-1.5">
                            {spec.value.map((item, idx) => (
                              <li
                                key={idx}
                                className="text-xs sm:text-sm text-muted-foreground flex items-start gap-2"
                              >
                                <Asterisk className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                                <span>{item}</span>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-xs sm:text-sm text-muted-foreground">
                            {spec.value}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Compatibility Icons */}
            <div className="grid grid-cols-3 gap-3 sm:gap-4 mt-6">
              <div className="bg-background rounded-xl p-4 border border-border text-center hover:border-primary/50 transition-colors">
                <Smartphone className="w-8 h-8 sm:w-10 sm:h-10 mx-auto mb-2 text-primary" />
                <p className="text-xs sm:text-sm font-medium">iPhone</p>
                <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">
                  Series 12-17
                </p>
              </div>
              <div className="bg-background rounded-xl p-4 border border-border text-center hover:border-primary/50 transition-colors">
                <Watch className="w-8 h-8 sm:w-10 sm:h-10 mx-auto mb-2 text-primary" />
                <p className="text-xs sm:text-sm font-medium">Apple Watch</p>
                <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">
                  Series 2+
                </p>
              </div>
              <div className="bg-background rounded-xl p-4 border border-border text-center hover:border-primary/50 transition-colors">
                <TbDeviceAirpods className="w-8 h-8 sm:w-10 sm:h-10 mx-auto mb-2 text-primary" />
                <p className="text-xs sm:text-sm font-medium">AirPods</p>
                <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">
                  Carga Qi
                </p>
              </div>
            </div>
          </motion.div>

          {/* Right Column - What's Included */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="space-y-4"
          >
            <div className="bg-background rounded-2xl border border-border shadow-sm overflow-hidden">
              {/* Header */}
              <div className="bg-muted/50 px-4 sm:px-6 py-4 border-b border-border">
                <h3 className="text-lg sm:text-xl font-bold flex items-center gap-2">
                  <Package className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                  Incluido en la Caja
                </h3>
              </div>

              {/* Includes List */}
              <div className="p-4 sm:p-6 space-y-4">
                {includes.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/30 transition-colors"
                  >
                    <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-lg bg-muted p-2 flex items-center justify-center flex-shrink-0 text-2xl">
                      {item.img && (
                        <img
                          src={item.img}
                          alt={item.label}
                          className="w-full h-full object-contain"
                        />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm sm:text-base text-foreground">
                        {item.label}
                      </p>
                      <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                        {item.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Power Badge */}

            {/* Certification Badge */}
            <div className="bg-background rounded-xl p-4 border border-border text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Award className="w-5 h-5 text-primary" />
                <p className="font-bold text-sm sm:text-base">
                  Certificaciones
                </p>
              </div>
              <div className="flex items-center justify-center gap-3 flex-wrap">
                <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-xs sm:text-sm font-semibold">
                  Qi2.2
                </span>
                <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-xs sm:text-sm font-semibold">
                  CE
                </span>
                <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-xs sm:text-sm font-semibold">
                  FCC
                </span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
