import { motion } from "framer-motion";
import { useState, useEffect, useRef } from "react";

interface TopBarProps {
  /** Si quieres fijarla arriba de todo */
  fixed?: boolean;
}

interface Message {
  id: string;
  icon: string;
  text: string;
}

const messages: Message[] = [
  {
    id: "envio-gratis",
    icon: "🚚",
    text: "Envío gratis a todo el Perú",
  },
  {
    id: "pago-contraentrega",
    icon: "💳",
    text: "Pago contraentrega ",
  },
  {
    id: "entrega-rapida",
    icon: "⚡",
    text: "Entrega rápida en 12-36 horas",
  },
  {
    id: "envio-seguro",
    icon: "📦",
    text: "Envío seguro y protegido",
  },
];

export const TopBar = ({ fixed = true }: TopBarProps) => {
  // refs para el carrusel
  const trackRef = useRef<HTMLDivElement | null>(null);
  const [trackWidth, setTrackWidth] = useState(0);

  // controlamos cuántas repeticiones hay para llenar toda la pantalla
  const [copies, setCopies] = useState(2);
  const [loopItems, setLoopItems] = useState<Message[]>(() => {
    return Array.from({ length: 2 }).flatMap(() => messages);
  });

  useEffect(() => {
    const measure = () => {
      const el = trackRef.current;
      if (!el) return;

      // ancho total del contenido actual (todas las copias)
      const totalWidth = el.scrollWidth;
      // ancho de una sola secuencia original (messages)
      const singleWidth = totalWidth / copies || totalWidth;

      // calcular cuántas copias hacen falta para cubrir viewport + una secuencia extra
      const viewport =
        window.innerWidth || document.documentElement.clientWidth || 1024;
      const needed = Math.max(
        2,
        Math.ceil((viewport + singleWidth) / singleWidth)
      );

      if (needed !== copies) {
        // actualizar copias y loopItems, luego volverá a medir en el siguiente ciclo
        setCopies(needed);
        setLoopItems(Array.from({ length: needed }).flatMap(() => messages));
        return;
      }

      // la anchura de la secuencia original se usa para animar
      setTrackWidth(singleWidth);
    };

    // Medir tras render
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [copies]);

  return (
    <motion.div
      initial={{ y: -50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className={[
        "w-full",
        fixed ? "fixed top-0 left-0 right-0 z-50" : "",
        "bg-black text-white",
        "border-b border-white/10",
        "pt-[env(safe-area-inset-top)]",
        "overflow-hidden",
      ].join(" ")}
      role="region"
      aria-label="Ofertas de envío"
    >
      <div className="relative w-full">
        <div className="h-10 md:h-11 relative w-full">
          {/* Carrusel full-bleed: ocupa desde el borde izquierdo al derecho */}
          <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
            <motion.div
              ref={trackRef}
              className="flex items-center gap-6 whitespace-nowrap w-full"
              animate={{ x: trackWidth ? [-trackWidth, 0] : [0, 0] }}
              transition={{
                x: {
                  repeat: Infinity,
                  repeatType: "loop",
                  duration: Math.max(8, (trackWidth || 200) / 40),
                  ease: "linear",
                },
              }}
            >
              {loopItems.map((m, i) => (
                <div
                  key={`${m.id}-${i}`}
                  className="flex items-center gap-1 md:gap-2 flex-shrink-0"
                >
                  <span className="text-sm md:text-lg" aria-hidden="true">
                    {m.icon}
                  </span>
                  <span className="text-xs md:text-sm font-medium tracking-wide">
                    {m.text}
                  </span>
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </div>

      {/* Efecto de brillo que se mueve */}
      <motion.div
        className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-transparent via-white/10 to-transparent"
        animate={{
          x: ["-100%", "100%"],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          repeatDelay: 4,
          ease: "easeInOut",
        }}
      />
    </motion.div>
  );
};
