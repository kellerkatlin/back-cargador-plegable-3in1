import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import blancoImage from "@/assets/blanco.webp";
import grisImage from "@/assets/gris.webp";
import negroImage from "@/assets/negro.webp";
import plateadoImage from "@/assets/plateado.webp";
import cargaSeguraImage from "@/assets/carga_segura.png";
import compatibilidadImage from "@/assets/compatibilidad.png";
import videoSrc from "@/assets/video.mp4";
import {
  Check,
  Shield,
  Truck,
  CreditCard,
  MinusCircle,
  PlusCircle,
  ChevronLeft,
  ChevronRight,
  Home,
  Star,
  ShoppingBag,
} from "lucide-react";
import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { ColorSelector } from "./ColorSelector";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { PurchaseModal } from "./PurchaseModal";
import type { CartItem } from "@/types/cart";
import { useProduct } from "@/hooks/useProduct";
import type { ProductVariant } from "@/types/product";
import { averageRating, totalReviews } from "@/data/testimonials";
import { toast } from "sonner";
import { track } from "@/lib/pixel";

const productImages = {
  White: blancoImage,
  Gray: grisImage,
  Black: negroImage,
  Silvery: plateadoImage,
} as const;

// Imágenes adicionales que NO son variantes de color
const additionalImages = [
  {
    src: compatibilidadImage,
    alt: "Compatibilidad universal",
    type: "image" as const,
  },
  {
    src: cargaSeguraImage,
    alt: "Carga Segura - Protección inteligente",
    type: "image" as const,
  },
  {
    src: videoSrc,
    alt: "Video demostración del producto",
    type: "video" as const,
  },
];

type ColorKey = keyof typeof productImages;

// Mapeo de colores UI a nombres de variantes en DB
const colorNameMap: Record<ColorKey, string> = {
  White: "Blanco",
  Gray: "Gris",
  Black: "Negro",
  Silvery: "Plateado",
};

// Notificaciones de compras simuladas
const recentPurchases = [
  { name: "Carlos R****", location: "Jesús María", time: "hace 15 minutos" },
  { name: "María G*****", location: "Arequipa", time: "hace 1 hora" },
  { name: "José L***", location: "Callao", time: "hace 2 horas" },
  { name: "Ana S******", location: "Cusco", time: "hace 3 horas" },
  { name: "Luis M******", location: "Trujillo", time: "hace 5 horas" },
  { name: "Carmen P****", location: "Chiclayo", time: "hace 8 horas" },
  { name: "Roberto F*****", location: "Piura", time: "hace 12 horas" },
  { name: "Diana V****", location: "Iquitos", time: "hace 1 día" },
  { name: "Fernando C*****", location: "Huancayo", time: "hace 2 días" },
  { name: "Patricia R****", location: "Tacna", time: "hace 3 días" },
  { name: "Miguel A*****", location: "Puno", time: "hace 5 días" },
  { name: "Gabriela T****", location: "Ayacucho", time: "hace 1 semana" },
  { name: "Jorge S****", location: "Miraflores", time: "hace 5 horas" },
];

export const ProductHero = () => {
  const [selectedColor, setSelectedColor] = useState<ColorKey>("Silvery");
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [orderItems, setOrderItems] = useState<CartItem[]>([]);

  // Fetch product variants from Supabase (todas las variantes, activas e inactivas)
  const { product } = useProduct({
    productId: "e63b582a-d138-46dc-9a7f-55ef3c84a538",
  });

  // Obtener variante del color seleccionado

  // Obtener todas las variantes activas
  const activeVariants = useMemo(
    () =>
      product?.product_variants?.filter(
        (v: ProductVariant) => v.activo && v.stock > 0
      ) || [],
    [product]
  );

  // Crear lista de colores activos disponibles
  const availableColors = useMemo(
    () =>
      (Object.keys(productImages) as ColorKey[]).filter((colorKey) => {
        const variant = product?.product_variants?.find(
          (v: ProductVariant) =>
            v.color.toLowerCase() === colorNameMap[colorKey].toLowerCase()
        );
        return variant && variant.activo && variant.stock > 0;
      }),
    [product]
  );

  // Calcular el stock total disponible sumando todas las variantes activas
  const totalAvailableStock = useMemo(
    () => activeVariants.reduce((sum, variant) => sum + variant.stock, 0),
    [activeVariants]
  );

  // Stock máximo disponible para el color seleccionado

  // Función para obtener el stock de un color específico (MEMOIZADA)
  const getColorStock = useCallback(
    (colorKey: ColorKey): number => {
      const variant = product?.product_variants?.find(
        (v: ProductVariant) =>
          v.color.toLowerCase() === colorNameMap[colorKey].toLowerCase()
      );
      return variant && variant.activo ? variant.stock : 0;
    },
    [product]
  );

  // Función para obtener colores disponibles (MEMOIZADA)
  const getCurrentAvailableColors = useCallback((): ColorKey[] => {
    return (Object.keys(productImages) as ColorKey[]).filter((colorKey) => {
      const variant = product?.product_variants?.find(
        (v: ProductVariant) =>
          v.color.toLowerCase() === colorNameMap[colorKey].toLowerCase()
      );
      return variant && variant.activo && variant.stock > 0;
    });
  }, [product]);

  // Validar stock de items seleccionados

  // Precios BLACK FRIDAY (20-31 Nov)
  const pricePerUnit1 = 149.9; // Precio para 1 unidad (antes 159.9)
  const pricePerUnit2Plus = 139.9; // Precio por unidad para 2+ unidades (antes 149.9)
  const originalPricePerUnit = 239.85; // Precio original tachado

  // Calcular precio unitario basado en la cantidad
  const currentUnitPrice = quantity >= 2 ? pricePerUnit2Plus : pricePerUnit1;

  // Calcular precio total
  const totalPrice = currentUnitPrice * quantity;

  // Actualizar items del pedido cuando cambia la cantidad o color principal
  useEffect(() => {
    setOrderItems((prevItems) => {
      const newItems: CartItem[] = [];
      const currentAvailableColors = getCurrentAvailableColors();

      // Función auxiliar para obtener el siguiente color disponible
      const getNextAvailableColor = (currentItems: CartItem[]): ColorKey => {
        // Contar colores ya seleccionados
        const colorCounts: Record<string, number> = {};
        for (const item of currentItems) {
          colorCounts[item.color] = (colorCounts[item.color] || 0) + 1;
        }

        // Buscar un color disponible con stock suficiente
        for (const colorKey of currentAvailableColors) {
          const stock = getColorStock(colorKey);
          const currentCount = colorCounts[colorKey] || 0;

          if (currentCount < stock) {
            return colorKey; // Este color tiene stock disponible
          }
        }

        // Si no hay colores disponibles, retornar el primer color disponible o selectedColor
        return currentAvailableColors[0] || selectedColor;
      };

      for (let i = 0; i < quantity; i++) {
        const existingItem = prevItems[i];
        let itemColor: ColorKey = "Silvery";

        if (existingItem) {
          // Mantener el color existente si aún tiene stock
          const existingColorStock = getColorStock(
            existingItem.color as ColorKey
          );
          const colorCounts: Record<string, number> = {};
          for (const item of newItems) {
            colorCounts[item.color] = (colorCounts[item.color] || 0) + 1;
          }
          const currentCount = colorCounts[existingItem.color] || 0;

          if (currentCount < existingColorStock) {
            itemColor = existingItem.color as ColorKey;
          } else {
            // Si no hay stock, obtener el siguiente color disponible
            itemColor = getNextAvailableColor(newItems);
          }
        } else {
          // Nuevo item: obtener el siguiente color disponible
          itemColor = getNextAvailableColor(newItems);
        }

        // Si es el primer item, siempre usar selectedColor si tiene stock
        if (i === 0) {
          const selectedStock = getColorStock(selectedColor);
          if (selectedStock > 0) {
            itemColor = selectedColor;
          } else {
            itemColor = getNextAvailableColor([]);
          }
        }

        newItems.push({
          id: `${i + 1}`,
          color: itemColor,
          quantity: 1,
          unitPrice: currentUnitPrice,
          subtotal: currentUnitPrice,
        });
      }
      return newItems;
    });
  }, [
    quantity,
    selectedColor,
    currentUnitPrice,
    getColorStock,
    getCurrentAvailableColors,
  ]);

  // Función para actualizar color de un item específico
  const updateItemColor = useCallback(
    (index: number, newColor: ColorKey) => {
      const updatedItems = [...orderItems];

      // Verificar stock del nuevo color
      const colorCounts: Record<string, number> = {};
      updatedItems.forEach((item, i) => {
        const itemColor = i === index ? newColor : item.color;
        colorCounts[itemColor] = (colorCounts[itemColor] || 0) + 1;
      });

      // Verificar que el nuevo color tenga stock suficiente
      const newColorStock = getColorStock(newColor);
      const newColorCount = colorCounts[newColor] || 0;

      if (newColorCount > newColorStock) {
        // No permitir cambio si excede el stock
        return;
      }

      updatedItems[index] = { ...updatedItems[index], color: newColor };
      setOrderItems(updatedItems);

      // Si es el primer item, actualizar también el color principal
      if (index === 0) {
        setSelectedColor(newColor);
      }
    },
    [orderItems, getColorStock]
  );

  // Función para abrir modal
  const openPurchaseModal = () => {
    setIsModalOpen(true);

    // Disparar evento AddToCart de Meta Pixel
    track("AddToCart", {
      content_name: "Cargador Plegable 3 en 1 de 15W",
      content_ids: ["e63b582a-d138-46dc-9a7f-55ef3c84a538"],
      content_type: "product",
      value: totalPrice,
      currency: "PEN",
      contents: orderItems.map((item) => ({
        id: "e63b582a-d138-46dc-9a7f-55ef3c84a538",
        quantity: item.quantity,
        item_price: item.unitPrice,
      })),
      num_items: quantity,
    });
  };

  // Mostrar notificaciones de compras recientes aleatorias
  useEffect(() => {
    const showRandomPurchaseNotification = () => {
      const randomPurchase =
        recentPurchases[Math.floor(Math.random() * recentPurchases.length)];

      toast(
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
            <ShoppingBag className="w-4 h-4 text-green-600" />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-sm">
              {randomPurchase.name} acaba de comprar
            </p>
            <p className="text-xs text-black/50">
              {randomPurchase.location} • {randomPurchase.time}
            </p>
          </div>
        </div>
      );
    };

    // IDs para limpiar timeouts
    let nextTimeoutId: ReturnType<typeof setTimeout> | null = null;

    const scheduleNext = () => {
      // Retardo aleatorio entre 20s y 30s
      const delay = Math.random() * 10000 + 20000;
      nextTimeoutId = setTimeout(() => {
        showRandomPurchaseNotification();
        scheduleNext();
      }, delay);
    };

    // Inicia a los 8 segundos y luego programa recursivamente entre 20-30s
    const firstTimeout = setTimeout(() => {
      showRandomPurchaseNotification();
      scheduleNext();
    }, 8000);

    return () => {
      clearTimeout(firstTimeout);
      if (nextTimeoutId) clearTimeout(nextTimeoutId);
    };
  }, []);

  // Para el scroll de miniaturas
  const thumbnailsRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [swipeStartX, setSwipeStartX] = useState<number | null>(null);
  const [swipeDeltaX, setSwipeDeltaX] = useState(0);
  const SWIPE_THRESHOLD = 50; // px
  const inlineCtaRef = useRef<HTMLButtonElement | null>(null);
  const [inlineCtaInView, setInlineCtaInView] = useState(false);

  const onMainTouchStart = (e: React.TouchEvent) => {
    setSwipeStartX(e.touches[0].clientX);
    setSwipeDeltaX(0);
  };

  const onMainTouchMove = (e: React.TouchEvent) => {
    if (swipeStartX === null) return;
    setSwipeDeltaX(e.touches[0].clientX - swipeStartX);
  };

  const onMainTouchEnd = () => {
    if (Math.abs(swipeDeltaX) > SWIPE_THRESHOLD) {
      if (swipeDeltaX < 0)
        handleNextImage(); // deslizó a la izquierda → siguiente
      else handlePrevImage(); // deslizó a la derecha → anterior
    }
    setSwipeStartX(null);
    setSwipeDeltaX(0);
  };

  const onMainMouseDown = (e: React.MouseEvent) => {
    setSwipeStartX(e.clientX);
    setSwipeDeltaX(0);
  };

  const onMainMouseMove = (e: React.MouseEvent) => {
    if (swipeStartX === null) return;
    setSwipeDeltaX(e.clientX - swipeStartX);
  };

  const onMainMouseUp = () => {
    if (Math.abs(swipeDeltaX) > SWIPE_THRESHOLD) {
      if (swipeDeltaX < 0) handleNextImage();
      else handlePrevImage();
    }
    setSwipeStartX(null);
    setSwipeDeltaX(0);
  };

  // Combinar la imagen del color seleccionado + imágenes adicionales + otros colores
  const otherColors = (Object.keys(productImages) as ColorKey[]).filter(
    (color) => color !== selectedColor
  );

  const allImages = [
    {
      src: productImages[selectedColor],
      alt: `Cargador plegable 3 en 1 - ${selectedColor}`,
      isColor: true,
      colorKey: selectedColor,
      type: "image" as const,
    },
    ...additionalImages.map((img) => ({
      ...img,
      isColor: false,
      colorKey: null as ColorKey | null,
    })),
    ...otherColors.map((color) => ({
      src: productImages[color],
      alt: `Cargador plegable 3 en 1 - ${color}`,
      isColor: true,
      colorKey: color,
      type: "image" as const,
    })),
  ];

  const handleColorChange = (color: string) => {
    if (color in productImages) {
      setSelectedColor(color as ColorKey);
      // Cuando cambia el color, volver a la primera imagen (la del color)
      setCurrentImageIndex(0);
    }
  };

  const handleThumbnailClick = (index: number) => {
    setCurrentImageIndex(index);
    scrollToThumbnail(index, 0);
  };
  const handleNextImage = () => {
    const newIndex = (currentImageIndex + 1) % allImages.length;
    setCurrentImageIndex(newIndex);
    scrollToThumbnail(newIndex, +1); // 👉 empuja un poco a la derecha
  };

  const handlePrevImage = () => {
    const newIndex =
      (currentImageIndex - 1 + allImages.length) % allImages.length;
    setCurrentImageIndex(newIndex);
    scrollToThumbnail(newIndex, -1); // 👉 empuja un poco a la izquierda
  };

  useEffect(() => {
    const el = inlineCtaRef.current;
    if (!el) return;

    const io = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        setInlineCtaInView(entry.isIntersecting);
      },
      {
        root: null,
        threshold: 0.4, // visible al menos 40%
        rootMargin: "0px 0px -10% 0px", // detecta un poco antes de tocar el borde inferior
      }
    );

    io.observe(el);
    return () => io.disconnect();
  }, []);

  const EDGE_OFFSET = 40; // px
  // Scroll automático a la miniatura seleccionada
  const scrollToThumbnail = (index: number, dir: -1 | 0 | 1 = 0) => {
    if (!thumbnailsRef.current) return;

    // Carril scrolleable
    const scroller = thumbnailsRef.current;

    // Si tienes el "inner" wrapper, detectarlo; si no, usa el propio scroller
    const inner =
      (scroller.children[0] as HTMLElement) &&
      (scroller.children[0] as HTMLElement).children.length
        ? (scroller.children[0] as HTMLElement)
        : scroller;

    const thumb = (inner.children[index] as HTMLElement) ?? null;
    if (!thumb) return;

    const scrollerRect = scroller.getBoundingClientRect();
    const thumbRect = thumb.getBoundingClientRect();

    const current = scroller.scrollLeft;
    const thumbLeft = thumbRect.left - scrollerRect.left + current;
    const thumbCenter = thumbLeft + thumbRect.width / 2;
    const targetCenter = scroller.clientWidth / 2;

    // Agrega un empujón extra hacia el lado al que vas
    const extra = dir === 0 ? 0 : dir * EDGE_OFFSET;

    let nextLeft = current + (thumbCenter - targetCenter) + extra;

    // Limitar dentro de los bordes reales
    const maxLeft = scroller.scrollWidth - scroller.clientWidth;
    if (nextLeft < 0) nextLeft = 0;
    if (nextLeft > maxLeft) nextLeft = maxLeft;

    scroller.scrollTo({ left: nextLeft, behavior: "smooth" });
  };

  // Funciones para arrastrar miniaturas
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!thumbnailsRef.current) return;
    setIsDragging(true);
    setStartX(e.pageX - thumbnailsRef.current.offsetLeft);
    setScrollLeft(thumbnailsRef.current.scrollLeft);
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !thumbnailsRef.current) return;
    e.preventDefault();
    const x = e.pageX - thumbnailsRef.current.offsetLeft;
    const walk = (x - startX) * 2; // Multiplicar para scroll más rápido
    thumbnailsRef.current.scrollLeft = scrollLeft - walk;
  };

  // Soporte táctil para móviles
  const handleTouchStart = (e: React.TouchEvent) => {
    if (!thumbnailsRef.current) return;
    setIsDragging(true);
    setStartX(e.touches[0].pageX - thumbnailsRef.current.offsetLeft);
    setScrollLeft(thumbnailsRef.current.scrollLeft);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || !thumbnailsRef.current) return;
    const x = e.touches[0].pageX - thumbnailsRef.current.offsetLeft;
    const walk = (x - startX) * 2;
    thumbnailsRef.current.scrollLeft = scrollLeft - walk;
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  const handleQuantityChange = (change: number) => {
    const newQty = quantity + change;
    // Limitar al stock total disponible (suma de todas las variantes)
    if (newQty >= 1 && newQty <= totalAvailableStock) {
      setQuantity(newQty);
    }
  };

  return (
    <>
      {/* Product Section */}
      <section id="producto" className="py-6 mt-8 md:mt-12 sm:py-12">
        <div className="w-full max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-6 lg:gap-12 items-start">
            {/* Product Image */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="relative flex justify-center min-w-0"
            >
              <div className="lg:sticky lg:top-24 space-y-0 sm:space-y-4 w-full min-w-0">
                {" "}
                {/* Main Image */}
                <div
                  className="relative rounded-2xl p-0 sm:p-8 flex items-center justify-center group w-full max-w-full mx-auto overflow-hidden"
                  onTouchStart={onMainTouchStart}
                  onTouchMove={onMainTouchMove}
                  onTouchEnd={onMainTouchEnd}
                  onMouseDown={onMainMouseDown}
                  onMouseMove={onMainMouseMove}
                  onMouseUp={onMainMouseUp}
                >
                  {/* Botón Anterior */}
                  <button
                    onClick={handlePrevImage}
                    className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-10 bg-background/80 hover:bg-background border border-border rounded-full p-2 sm:p-3 shadow-lg transition-all duration-200 opacity-0 group-hover:opacity-100"
                    aria-label="Imagen anterior"
                  >
                    <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
                  </button>

                  {/* Imagen o Video */}
                  {allImages[currentImageIndex].type === "video" ? (
                    <video
                      key={currentImageIndex}
                      autoPlay
                      loop
                      muted
                      playsInline
                      width={1500}
                      height={1500}
                      className="w-full max-w-[280px] sm:max-w-md mx-auto rounded-lg aspect-square object-cover"
                      style={{
                        transform: `translateX(${swipeDeltaX * 0.1}px)`,
                        willChange: "transform",
                      }}
                    >
                      <source
                        src={allImages[currentImageIndex].src}
                        type="video/mp4"
                      />
                    </video>
                  ) : (
                    <motion.img
                      src={allImages[currentImageIndex].src}
                      alt={allImages[currentImageIndex].alt}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.2 }}
                      className="w-full max-w-[280px] sm:max-w-md mx-auto"
                      draggable="false"
                      style={{
                        transform: `translateX(${swipeDeltaX * 0.1}px)`,
                        willChange: "transform",
                      }}
                    />
                  )}

                  {/* Botón Siguiente */}
                  <button
                    onClick={handleNextImage}
                    className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-10 bg-background/80 hover:bg-background border border-border rounded-full p-2 sm:p-3 shadow-lg transition-all duration-200 opacity-0 group-hover:opacity-100"
                    aria-label="Imagen siguiente"
                  >
                    <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
                  </button>

                  {/* Indicador de posición */}
                  <div className="absolute bottom-2 sm:bottom-4 left-1/2 -translate-x-1/2 bg-background/80 px-3 py-1 rounded-full text-xs sm:text-sm font-medium">
                    {currentImageIndex + 1} / {allImages.length}
                  </div>
                </div>
                {/* Thumbnails con scroll arrastrable */}
                <div className="relative max-w-full mx-auto">
                  {/* Gradiente izquierdo */}
                  <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />

                  {/* Gradiente derecho */}
                  <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />

                  <div
                    ref={thumbnailsRef}
                    onMouseDown={handleMouseDown}
                    onMouseLeave={handleMouseLeave}
                    onMouseUp={handleMouseUp}
                    onMouseMove={handleMouseMove}
                    onTouchStart={handleTouchStart}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                    className={cn(
                      "w-full max-w-full mx-auto", // 👈 ancho fijo del carril
                      "flex flex-nowrap gap-2 sm:gap-3", // 👈 evita wrap
                      "overflow-x-auto overflow-y-hidden pb-3 px-2",
                      "scroll-smooth touch-pan-x", // 👈 UX móvil
                      isDragging
                        ? "cursor-grabbing select-none"
                        : "cursor-grab",
                      "[-ms-overflow-style:none] [scrollbar-width:auto]",
                      "[&::-webkit-scrollbar]:h-1.5",
                      "[&::-webkit-scrollbar-track]:bg-muted/30 [&::-webkit-scrollbar-track]:rounded-full",
                      "[&::-webkit-scrollbar-thumb]:bg-primary/40 [&::-webkit-scrollbar-thumb]:rounded-full",
                      "[&::-webkit-scrollbar-thumb]:hover:bg-primary/60"
                    )}
                  >
                    <div className="flex mt-1 gap-2 sm:gap-3 min-w-max mx-auto">
                      {allImages.map((image, index) => (
                        <button
                          key={`${image.colorKey || "additional"}-${index}`}
                          onClick={() => handleThumbnailClick(index)}
                          onMouseDown={(e) => e.stopPropagation()}
                          className={cn(
                            "relative bg-muted/30 rounded-lg p-2 sm:p-3 min-w-[64px] w-16 h-16 sm:min-w-[80px] sm:w-20 sm:h-20",
                            "flex items-center justify-center transition-all duration-200 hover:scale-105 hover:bg-muted/50",
                            "flex-shrink-0", // ✅ mantiene el ancho de cada thumb
                            currentImageIndex === index
                              ? "ring-2 ring-primary shadow-md scale-105"
                              : "opacity-60 hover:opacity-100"
                          )}
                        >
                          {image.type === "video" ? (
                            <video
                              src={image.src}
                              className="w-full h-full object-contain pointer-events-none select-none"
                              muted
                            />
                          ) : (
                            <img
                              src={image.src}
                              alt={image.alt}
                              className="w-full h-full object-contain pointer-events-none select-none"
                              draggable="false"
                            />
                          )}
                          {/* Indicador de video */}
                          {image.type === "video" && (
                            <div className="absolute inset-0 flex items-center justify-center">
                              <div className="bg-black/50 rounded-full p-1.5 sm:p-2">
                                <svg
                                  className="w-4 h-4 sm:w-5 sm:h-5 text-white"
                                  fill="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path d="M8 5v14l11-7z" />
                                </svg>
                              </div>
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Product Info */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, ease: "easeOut", delay: 0.2 }}
              className="w-full max-w-md mx-auto px-2 space-y-4 sm:space-y-7"
            >
              {/* Título + rating */}
              <div className="text-left">
                <h1 className="text-[1.8rem] -mt-4 sm:mt-0 sm:text-4xl md:text-5xl font-bold leading-tight">
                  Cargador inalámbrico plegable 3 en 1
                </h1>

                {/* Estrellas de calificación (accesible) */}
                <div
                  className="flex items-center gap-2 mt-2"
                  aria-label={`Calificación ${averageRating} de 5`}
                >
                  <div className="flex gap-0.5" role="img">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className="w-4 h-4 sm:w-5 sm:h-5 fill-yellow-400 text-yellow-400"
                      />
                    ))}
                  </div>
                  <span className="text-sm font-semibold text-foreground">
                    {averageRating}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    ({totalReviews})
                  </span>
                  {/* Sello social extra en mobile */}
                  <span className="ml-2 hidden xs:inline text-[11px] text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-md px-1.5 py-0.5">
                    +{Math.max(50, Math.min(9999, totalReviews))} vendidos
                  </span>
                </div>
              </div>

              {/* Precio + ofertas */}
              <section className="rounded-2xl  bg-gray-50 border border-gray-200 p-4 sm:p-5 space-y-3">
                <div className="flex  items-center gap-2 sm:gap-3 flex-wrap">
                  {quantity >= 1 && (
                    <span className="text-muted-foreground line-through text-lg sm:text-2xl">
                      S/.{(originalPricePerUnit * quantity).toFixed(2)}
                    </span>
                  )}
                  <span className="text-3xl sm:text-5xl font-extrabold text-primary">
                    S/.{totalPrice.toFixed(2)}
                  </span>
                  <Badge
                    variant="destructive"
                    className="text-xs -mt-3 sm:text-sm"
                  >
                    60% OFF
                  </Badge>
                </div>

                {quantity >= 2 && (
                  <p className="text-sm sm:text-base text-green-700 font-semibold">
                    S/.{pricePerUnit2Plus.toFixed(2)} por unidad · Ahorras S/.
                    {((pricePerUnit1 - pricePerUnit2Plus) * quantity).toFixed(
                      2
                    )}
                  </p>
                )}

                {/* Envío Gratis (gatillo principal) */}
                <div
                  className="rounded-xl p-[2px] bg-gradient-to-r from-emerald-500 to-green-600"
                  aria-live="polite"
                >
                  <div className="relative rounded-[10px] py-1 px-1 text-center text-white shadow-sm overflow-hidden">
                    {/* brillo diagonal muy sutil */}
                    <span className="pointer-events-none absolute -left-10 top-0 h-full w-10 rotate-12 bg-white/20 blur-md" />
                    <div
                      onClick={openPurchaseModal}
                      className="relative z-10 flex items-center justify-center gap-2"
                    >
                      <Truck className="w-5 h-5" />
                      <span className="font-semibold text-sm sm:text-xs tracking-wide">
                        🎉 ENVÍO GRATIS A TODO EL PERÚ
                      </span>
                    </div>
                  </div>
                </div>

                {/* Incentivo 2+ unidades */}
                <div className="flex flex-wrap items-center gap-2">
                  <Badge
                    variant="outline"
                    onClick={() => {
                      if (quantity < 2) {
                        setQuantity(2);
                      }
                    }}
                    className="text-xs sm:text-sm bg-amber-300 hover:bg-amber-400 border-none font-medium px-1 py-2 cursor-pointer transition-all duration-200 active:scale-95"
                  >
                    🎁 Descuento extra al comprar 2 o más unidades
                  </Badge>
                  <span className="text-[11px] sm:text-xs text-gray-500">
                    🔥 Solo Black Friday (20-31 Nov)
                  </span>
                </div>
              </section>

              {/* Selector de color (FUNCIONAL, intacto) */}
              <section>
                <ColorSelector
                  selectedColor={selectedColor}
                  onColorChange={handleColorChange}
                  availableColors={availableColors}
                  getColorStock={(color: string) =>
                    getColorStock(color as ColorKey)
                  }
                />
              </section>

              {/* Cantidad (FUNCIONAL, intacto) */}
              <section className="space-y-2">
                <p className="text-sm font-semibold">Cantidad</p>
                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleQuantityChange(-1)}
                    disabled={quantity <= 1}
                    aria-label="Disminuir cantidad"
                  >
                    <MinusCircle className="w-5 h-5" />
                  </Button>
                  <span className="text-2xl font-semibold w-16 text-center border rounded-md">
                    {quantity}
                  </span>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleQuantityChange(1)}
                    disabled={quantity >= Math.min(totalAvailableStock, 10)}
                    aria-label="Aumentar cantidad"
                  >
                    <PlusCircle className="w-5 h-5" />
                  </Button>
                </div>
                {totalAvailableStock === 0 && (
                  <p className="text-xs text-red-600 font-semibold">Agotado</p>
                )}
              </section>

              {/* Resumen de pedido (FUNCIONAL, intacto) */}
              {quantity > 1 && (
                <section className="border border-gray-200 rounded-xl p-3 bg-gray-50">
                  <h3 className="text-sm font-semibold mb-2 text-gray-700">
                    Colores seleccionados
                  </h3>
                  <div className="max-h-80 overflow-y-auto space-y-1.5">
                    {orderItems.map((item, index) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between py-1.5 px-2 bg-white rounded text-xs"
                      >
                        <span className="text-gray-600">#{index + 1}</span>
                        <div className="flex items-center gap-1.5">
                          <div className="scale-75">
                            <ColorSelector
                              selectedColor={item.color}
                              onColorChange={(color) =>
                                updateItemColor(index, color as ColorKey)
                              }
                              availableColors={availableColors}
                              getColorStock={(color: string) =>
                                getColorStock(color as ColorKey)
                              }
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                    <div className="border-t pt-2 mt-2 flex justify-between items-center">
                      <span className="text-xs font-medium text-gray-600">
                        {quantity} unidades
                      </span>
                      <span className="text-sm font-semibold text-primary">
                        S/.{totalPrice.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </section>
              )}

              {/* CTA principal */}
              <Button
                ref={inlineCtaRef}
                size="icon"
                className="w-full px- text-base sm:text-lg py-5 sm:py-6 rounded-2xl shadow-md hover:shadow-lg"
                onClick={openPurchaseModal}
              >
                🚚 Pide ahora • paga en casa
              </Button>

              {/* Sellos de confianza */}
              <div className="grid grid-cols-3 gap-2 sm:gap-3 pt-2">
                {[
                  { icon: Truck, label: "Envío Gratis" },
                  { icon: Shield, label: "Garantía 12 meses" },
                  { icon: CreditCard, label: "Paga al Recibir" },
                ].map(({ icon: Icon, label }) => (
                  <div
                    key={label}
                    className="flex flex-col items-center gap-1.5 sm:gap-2 p-2 sm:p-3 bg-muted/50 rounded-xl"
                  >
                    <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                    <p className="text-[10px] sm:text-xs font-medium text-center leading-tight">
                      {label}
                    </p>
                  </div>
                ))}
              </div>

              {/* Lista de características */}
              <div className="space-y-2.5 sm:space-y-3 pt-3 sm:pt-4 border-t">
                {[
                  "Carga simultánea de 3 dispositivos",
                  "Compatible con iPhone, Android, Apple Watch y AirPods",
                  "Diseño ultra compacto y portátil",
                  "Tecnología de carga rápida 15W",
                  "Garantía de 12 meses incluida",
                ].map((feature) => (
                  <div
                    key={feature}
                    className="flex items-start gap-2.5 sm:gap-3"
                  >
                    <Check className="w-4 h-4 sm:w-5 sm:h-5 text-primary mt-0.5 flex-shrink-0" />
                    <span className="text-xs sm:text-sm leading-relaxed">
                      {feature}
                    </span>
                  </div>
                ))}
              </div>

              {/* Barra sticky de compra (solo mobile) */}
            </motion.div>
          </div>
        </div>

        <AnimatePresence>
          {!inlineCtaInView && (
            <motion.div
              initial={{ y: 80, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 80, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="fixed left-0 right-0 bottom-0 z-50"
            >
              <div className="container mx-auto px-4 pb-[env(safe-area-inset-bottom)]">
                <div className="p-3">
                  <div className="flex justify-center items-center gap-3">
                    <motion.div
                      animate={{
                        scale: [1, 1.08, 1],
                      }}
                      transition={{
                        duration: 1.5,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                    >
                      <Button
                        onClick={() => {
                          setIsModalOpen(true);
                        }}
                        className="px-14 md:hidden text-base text-center rounded-full inline-flex items-center justify-center gap-2"
                        size="lg"
                      >
                        <Home className="w-4 h-4" />
                        Pide ahora • paga en casa
                      </Button>
                    </motion.div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <PurchaseModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          initialQuantity={quantity}
          selectedColor={selectedColor}
          orderItems={orderItems}
          onUpdateOrderItems={setOrderItems}
          onQuantityChange={(newQty) => setQuantity(newQty)}
          onColorChange={(newColor) => setSelectedColor(newColor as ColorKey)}
        />
      </section>
    </>
  );
};
