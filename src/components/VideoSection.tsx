import videoSrc from "@/assets/video.mp4";
import { Badge } from "@/components/ui/badge";
import { Play } from "lucide-react";
import { motion } from "framer-motion";
import { useRef, useState, useEffect } from "react";
export const VideoSection = () => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(true);

  const togglePlay = (e?: React.MouseEvent) => {
    e?.preventDefault();
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) {
      v.play();
      setIsPlaying(true);
    } else {
      v.pause();
      setIsPlaying(false);
    }
  };

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    v.addEventListener("play", handlePlay);
    v.addEventListener("pause", handlePause);
    return () => {
      v.removeEventListener("play", handlePlay);
      v.removeEventListener("pause", handlePause);
    };
  }, []);

  return (
    <section className="py-12 sm:py-20 px-0 bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto max-w-4xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="text-center mb-8 sm:mb-12 space-y-3 sm:space-y-4"
        >
          <Badge
            variant="outline"
            className="bg-primary/10 text-primary border-primary/20 text-xs sm:text-sm"
          >
            Míralo en Acción
          </Badge>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold">
            Experimenta el Poder
          </h2>
          <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
            Descubre cómo nuestro Cargador Plegable 3 en 1 revoluciona la forma
            en que cargas tus dispositivos
          </p>
        </motion.div>

        {/* Video Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="relative group max-w-sm mx-auto"
          onClick={togglePlay}
        >
          {/* Decorative elements */}
          <div className="absolute -inset-1 bg-gradient-to-r from-primary/30 via-primary/50 to-primary/30 rounded-3xl blur-xl opacity-50 group-hover:opacity-75 transition-opacity duration-500"></div>

          <div className="relative bg-black rounded-lg sm:rounded-3xl overflow-hidden shadow-2xl aspect-[9/16]">
            {/* Play indicator overlay (optional) */}
            <div
              className={
                "absolute inset-0 flex items-center justify-center z-10 transition-opacity duration-300 " +
                (isPlaying
                  ? "pointer-events-none opacity-0"
                  : "pointer-events-auto opacity-100")
              }
              role="button"
              aria-label={isPlaying ? "Pausar video" : "Reproducir video"}
            >
              <div className="bg-primary/90 rounded-full p-4 sm:p-6 backdrop-blur-sm transform scale-90 group-hover:scale-100 transition-transform duration-300">
                <Play className="w-8 h-8 sm:w-12 sm:h-12 text-primary-foreground fill-current" />
              </div>
            </div>

            {/* Video */}
            <video
              ref={videoRef}
              autoPlay
              loop
              muted
              playsInline
              className="w-full h-full object-cover"
              poster="" // Puedes agregar un poster si deseas
            >
              <source src={videoSrc} type="video/mp4" />
              Tu navegador no soporta la reproducción de videos.
            </video>
          </div>
        </motion.div>

        {/* Bottom text */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="text-center mt-8 sm:mt-12"
        >
          <p className="text-sm sm:text-base text-muted-foreground">
            ⚡ Carga rápida, diseño compacto, tecnología avanzada
          </p>
        </motion.div>
      </div>
    </section>
  );
};
