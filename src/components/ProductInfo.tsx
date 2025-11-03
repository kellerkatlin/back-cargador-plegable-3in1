import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Zap,
  Smartphone,
  Package,
  ShieldCheck,
  Info,
  CheckCircle2,
} from "lucide-react";
import { motion } from "framer-motion";
import { FaApple } from "react-icons/fa";
import { IoLogoAndroid } from "react-icons/io";
import { TbDeviceAirpods } from "react-icons/tb";

import { CgAppleWatch } from "react-icons/cg";
export const ProductInfo = () => {
  return (
    <section className="py-12 sm:py-20 px-0 bg-background">
      <div className="container mx-auto max-w-4xl px-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="text-center mb-8 sm:mb-12"
        >
          <h2 className="text-2xl sm:text-3xl font-bold mb-2">
            Información del Producto
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground">
            Todo lo que necesitas saber
          </p>
        </motion.div>

        {/* Accordion */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <Accordion type="single" collapsible className="w-full space-y-2">
            {/* Descripción del Producto */}
            <AccordionItem
              value="description"
              className="bg-card rounded-lg border px-4 sm:px-5"
            >
              <AccordionTrigger className="hover:no-underline py-4">
                <div className="flex items-center gap-3 text-left">
                  <Info className="w-5 h-5 text-muted-foreground" />
                  <h3 className="text-sm sm:text-base font-semibold">
                    Descripción del Producto
                  </h3>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pb-4 pt-1">
                <div className="space-y-3 text-sm sm:text-base">
                  <p className="text-muted-foreground leading-relaxed">
                    El{" "}
                    <strong>
                      Cargador Inalámbrico 3 en 1 Plegable y Magnético
                    </strong>{" "}
                    simplifica tu día cargando hasta tres dispositivos al mismo
                    tiempo. Es compatible con iPhone, Android con carga Qi/Qi2,
                    AirPods y Apple Watch.
                  </p>
                  <div className="bg-muted/50 rounded-lg p-3">
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      <strong>Importante:</strong> El sistema magnético requiere
                      un iPhone con MagSafe o un case compatible con carga
                      inalámbrica y magnética para que el equipo quede fijo en
                      la base.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-3">
                    <div className="flex items-center gap-1.5 text-xs sm:text-sm">
                      <Zap className="w-4 h-4 text-primary" />
                      <span>Carga rápida 15W</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs sm:text-sm">
                      <Package className="w-4 h-4 text-primary" />
                      <span>Plegable</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs sm:text-sm">
                      <CheckCircle2 className="w-4 h-4 text-primary" />
                      <span>Qi/Qi2</span>
                    </div>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Compatibilidad */}
            <AccordionItem
              value="compatibility"
              className="bg-card rounded-lg border px-4 sm:px-5"
            >
              <AccordionTrigger className="hover:no-underline py-4">
                <div className="flex items-center gap-3 text-left">
                  <Smartphone className="w-5 h-5 text-muted-foreground" />
                  <h3 className="text-sm sm:text-base font-semibold">
                    Compatibilidad
                  </h3>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pb-4 pt-1 pl-5">
                <div className="space-y-2.5">
                  <div className="flex items-center gap-2.5">
                    <FaApple className="size-5" />
                    <div>
                      <h4 className="font-medium text-sm">iPhone</h4>
                      <p className="text-xs text-muted-foreground">
                        Carga Qi/Qi2. Magnético con MagSafe
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <IoLogoAndroid className="size-5" />
                    <div>
                      <h4 className="font-medium text-sm">Android</h4>
                      <p className="text-xs text-muted-foreground">
                        Compatible con Qi/Qi2
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <TbDeviceAirpods className="size-5" />
                    <div>
                      <h4 className="font-medium text-sm">AirPods</h4>
                      <p className="text-xs text-muted-foreground">
                        Con carga inalámbrica
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <CgAppleWatch className="size-5" />
                    <div>
                      <h4 className="font-medium text-sm">Apple Watch</h4>
                      <p className="text-xs text-muted-foreground">
                        Desde 2da generación
                      </p>
                    </div>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Envíos */}
            <AccordionItem
              value="shipping"
              className="bg-card rounded-lg border px-4 sm:px-5"
            >
              <AccordionTrigger className="hover:no-underline py-4">
                <div className="flex items-center gap-3 text-left">
                  <Package className="w-5 h-5 text-muted-foreground" />
                  <h3 className="text-sm sm:text-base font-semibold">
                    Envíos y Entregas
                  </h3>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pb-4 pt-1">
                <div className="space-y-2.5 text-sm">
                  <p className="text-muted-foreground">Envíos a todo el Perú</p>

                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary"></div>
                      <span className="font-medium text-sm">Lima:</span>
                      <span className="text-xs text-muted-foreground">
                        desde 1 día hábil
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary"></div>
                      <span className="font-medium text-sm">Provincias:</span>
                      <span className="text-xs text-muted-foreground">
                        desde 3 días hábiles
                      </span>
                      Pago contraentrega
                    </div>
                  </div>

                  <p className="text-xs text-muted-foreground mt-2">
                    🚚 Envío gratis
                  </p>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Garantía y Devoluciones */}
            <AccordionItem
              value="warranty"
              className="bg-card rounded-lg border px-4 sm:px-5"
            >
              <AccordionTrigger className="hover:no-underline py-4">
                <div className="flex items-center gap-3 text-left">
                  <ShieldCheck className="w-5 h-5 text-muted-foreground" />
                  <h3 className="text-sm sm:text-base font-semibold">
                    Garantía y Devoluciones
                  </h3>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pb-4 pt-1">
                <div className="space-y-3 text-sm">
                  <p className="text-muted-foreground">
                    Tienes <strong className="text-foreground">30 días</strong>{" "}
                    para solicitar cambio o devolución.
                  </p>

                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Contacto:</p>
                    <div className="flex gap-5">
                      <a
                        href="mailto:kellerkatlin.k@gmail.com"
                        className="inline-flex items-center text-sm font-medium text-primary hover:underline"
                      >
                        kellerkatlin.k@gmail.com
                      </a>
                      <a
                        target="_blank"
                        href="https://wa.me/51932567344"
                        className="inline-flex items-center text-sm font-medium text-primary hover:underline"
                      >
                        WhatsApp: +51 932 567 344
                      </a>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Responderemos en menos de 24 horas (días laborables).
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      ¡Gracias por tu paciencia!
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Nuestro equipo de soporte está aquí para ayudarte con
                      cualquier duda o inconveniente.
                    </p>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </motion.div>
      </div>
    </section>
  );
};
