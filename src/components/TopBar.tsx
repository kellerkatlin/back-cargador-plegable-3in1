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

// Mensajes de Black Friday
const blackFridayMessages: Message[] = [
  {
    id: "bf-1",
    icon: "🔥",
    text: "BLACK FRIDAY: 60% OFF",
  },
  {
    id: "bf-2",
    icon: "⚡",
    text: "Solo del 20 al 31 de Noviembre",
  },
  {
    id: "bf-3",
    icon: "🎁",
    text: "Aprovecha el mejor descuento del año",
  },
  {
    id: "bf-4",
    icon: "🔥",
    text: "60% OFF + Envío GRATIS",
  },
];

export const TopBar = ({ fixed = true }: TopBarProps) => {
  // refs para el carrusel principal
  const trackRef = useRef<HTMLDivElement | null>(null);
  const [trackWidth, setTrackWidth] = useState(0);

  // refs para el carrusel de Black Friday
  const bfTrackRef = useRef<HTMLDivElement | null>(null);
  const [bfTrackWidth, setBfTrackWidth] = useState(0);

  // controlamos cuántas repeticiones hay para llenar toda la pantalla
  const [copies, setCopies] = useState(2);
  const [loopItems, setLoopItems] = useState<Message[]>(() => {
    return Array.from({ length: 2 }).flatMap(() => messages);
  });

  // controlamos repeticiones para Black Friday
  const [bfCopies, setBfCopies] = useState(2);
  const [bfLoopItems, setBfLoopItems] = useState<Message[]>(() => {
    return Array.from({ length: 2 }).flatMap(() => blackFridayMessages);
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

    const measureBf = () => {
      const el = bfTrackRef.current;
      if (!el) return;

      const totalWidth = el.scrollWidth;
      const singleWidth = totalWidth / bfCopies || totalWidth;

      const viewport =
        window.innerWidth || document.documentElement.clientWidth || 1024;
      const needed = Math.max(
        2,
        Math.ceil((viewport + singleWidth) / singleWidth)
      );

      if (needed !== bfCopies) {
        setBfCopies(needed);
        setBfLoopItems(
          Array.from({ length: needed }).flatMap(() => blackFridayMessages)
        );
        return;
      }

      setBfTrackWidth(singleWidth);
    };

    // Medir tras render
    measure();
    measureBf();
    window.addEventListener("resize", measure);
    window.addEventListener("resize", measureBf);
    return () => {
      window.removeEventListener("resize", measure);
      window.removeEventListener("resize", measureBf);
    };
  }, [copies, bfCopies]);

  return (
    <motion.div
      initial={{ y: -50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className={[
        "w-full",
        fixed ? "fixed top-0 left-0 right-0 z-50" : "",
        "border-b border-white/10",
        "pt-[env(safe-area-inset-top)]",
      ].join(" ")}
      role="region"
      aria-label="Ofertas y promociones"
    >
      {/* BLACK FRIDAY BANNER - Barra superior */}
      <div className="relative w-full bg-gradient-to-r from-red-600 via-red-700 to-red-600 overflow-hidden">
        <div className="h-9 md:h-10 relative w-full">
          <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
            <motion.div
              ref={bfTrackRef}
              className="flex items-center gap-8 whitespace-nowrap w-full"
              animate={{ x: bfTrackWidth ? [0, -bfTrackWidth] : [0, 0] }}
              transition={{
                x: {
                  repeat: Infinity,
                  repeatType: "loop",
                  duration: Math.max(20, (bfTrackWidth || 200) / 20),
                  ease: "linear",
                },
              }}
            >
              {bfLoopItems.map((m, i) => (
                <div
                  key={`${m.id}-${i}`}
                  className="flex items-center gap-2 flex-shrink-0"
                >
                  <span className="text-base md:text-xl" aria-hidden="true">
                    {m.icon}
                  </span>
                  <span className="text-xs md:text-sm font-bold tracking-wider text-white uppercase">
                    {m.text}
                  </span>
                </div>
              ))}
            </motion.div>
          </div>
        </div>

        {/* Efecto de brillo que se mueve - Black Friday */}
        <motion.div
          className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none"
          animate={{
            x: ["-100%", "100%"],
          }}
          transition={{
            duration: 2.5,
            repeat: Infinity,
            repeatDelay: 3,
            ease: "easeInOut",
          }}
        />
      </div>

      {/* BARRA NORMAL - Mensajes de envío */}
      <div className="relative w-full bg-black text-white">
        <div className="h-9 md:h-10 relative w-full">
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

        {/* Efecto de brillo que se mueve */}
        <motion.div
          className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-transparent via-white/10 to-transparent pointer-events-none"
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
      </div>
    </motion.div>
  );
};
