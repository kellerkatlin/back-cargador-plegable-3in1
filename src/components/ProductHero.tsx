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
} from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { ColorSelector } from "./ColorSelector";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { PurchaseModal } from "./PurchaseModal";
import type { CartItem } from "@/types/cart";

const productImages = {
  White: blancoImage,
  Gray: grisImage,
  Black: negroImage,
  Silvery: plateadoImage,
} as const;

// Imágenes adicionales que NO son variantes de color
const additionalImages = [
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
  {
    src: compatibilidadImage,
    alt: "Compatibilidad universal",
    type: "image" as const,
  },
];

type ColorKey = keyof typeof productImages;

export const ProductHero = () => {
  const [selectedColor, setSelectedColor] = useState<ColorKey>("Silvery");
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [orderItems, setOrderItems] = useState<CartItem[]>([]);

  // Precios
  const pricePerUnit1 = 159.9; // Precio para 1 unidad
  const pricePerUnit2Plus = 149.9; // Precio por unidad para 2+ unidades
  const originalPricePerUnit = 239.85; // Precio original tachado

  // Calcular precio unitario basado en la cantidad
  const currentUnitPrice = quantity >= 2 ? pricePerUnit2Plus : pricePerUnit1;

  // Calcular precio total
  const totalPrice = currentUnitPrice * quantity;

  // Actualizar items del pedido cuando cambia la cantidad o color principal
  useEffect(() => {
    setOrderItems((prevItems) => {
      const newItems: CartItem[] = [];
      for (let i = 0; i < quantity; i++) {
        const existingItem = prevItems[i];
        let itemColor = "Silvery";
        if (existingItem) {
          itemColor = existingItem.color;
        }

        // Si es el primer item, siempre usar selectedColor
        if (i === 0) {
          itemColor = selectedColor;
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
  }, [quantity, selectedColor, currentUnitPrice]);

  // Función para actualizar color de un item específico
  const updateItemColor = (index: number, newColor: ColorKey) => {
    const updatedItems = [...orderItems];
    updatedItems[index] = { ...updatedItems[index], color: newColor };
    setOrderItems(updatedItems);

    // Si es el primer item, actualizar también el color principal
    if (index === 0) {
      setSelectedColor(newColor);
    }
  };

  // Función para abrir modal
  const openPurchaseModal = () => {
    setIsModalOpen(true);
  };

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
    if (newQty >= 1 && newQty <= 10) {
      setQuantity(newQty);
    }
  };

  return (
    <>
      {/* Product Section */}
      <section id="producto" className="py-6 mt-12 sm:py-12">
        <div className="w-full max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-6 lg:gap-12 items-start">
            {/* Product Image */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="relative flex justify-center min-w-0"
            >
              <div className="lg:sticky lg:top-24 space-y-3 sm:space-y-4 w-full min-w-0">
                {" "}
                {/* Main Image */}
                <div
                  className="relative rounded-2xl p-2 sm:p-8 flex items-center justify-center group w-full max-w-full mx-auto overflow-hidden"
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
              className="space-y-4 sm:space-y-6 w-full max-w-md mx-auto"
            >
              <div>
                <h1 className="text-center md:text-left text-2xl sm:text-4xl md:text-5xl font-bold mb-3 sm:mb-4 leading-tight">
                  Cargador inalámbrico plegable 3 en 1
                </h1>
                <p className="text-center md:text-left text-base sm:text-xl text-muted-foreground">
                  Despídete del caos de cables – bienvenido al orden magnético
                </p>
              </div>

              {/* Price */}
              <div className="border-t border-b py-3 sm:py-4">
                <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                  {quantity >= 2 && (
                    <span className="text-muted-foreground line-through text-lg sm:text-2xl">
                      S/.{(pricePerUnit1 * quantity).toFixed(2)}
                    </span>
                  )}
                  {quantity === 1 && (
                    <span className="text-muted-foreground line-through text-lg sm:text-2xl">
                      S/.{originalPricePerUnit.toFixed(2)}
                    </span>
                  )}
                  <span className="text-3xl sm:text-4xl font-bold text-primary">
                    S/.{totalPrice.toFixed(2)}
                  </span>
                  <Badge variant="destructive" className="text-xs sm:text-sm">
                    {quantity >= 2 ? "37% OFF" : "33% OFF"}
                  </Badge>
                </div>
                {quantity >= 2 && (
                  <p className="text-sm sm:text-base text-green-600 font-semibold mt-2">
                    ¡S/.{pricePerUnit2Plus.toFixed(2)} por unidad! Ahorras S/.
                    {((pricePerUnit1 - pricePerUnit2Plus) * quantity).toFixed(
                      2
                    )}
                  </p>
                )}
                <p className="text-xs sm:text-sm text-muted-foreground mt-2 animate-pulse">
                  Envío gratis incluido
                </p>
                <Badge
                  variant="outline"
                  className="text-xs sm:text-sm bg-amber-300 mt-3"
                >
                  🎁 Descuento extra al comprar 2 o más productos
                </Badge>
              </div>

              {/* Color Selection */}
              <div>
                <ColorSelector
                  selectedColor={selectedColor}
                  onColorChange={handleColorChange}
                />
              </div>

              {/* Quantity */}
              <div className="space-y-2">
                <p className="text-sm font-semibold">Cantidad</p>
                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleQuantityChange(-1)}
                    disabled={quantity <= 1}
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
                    disabled={quantity >= 10}
                  >
                    <PlusCircle className="w-5 h-5" />
                  </Button>
                </div>
              </div>

              {/* Order Items Summary - Solo aparece cuando quantity > 1 */}
              {quantity > 1 && (
                <div className="border border-gray-200 rounded-lg p-3 bg-gray-50">
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
                </div>
              )}

              {/* CTA Button */}
              <div className="space-y-3">
                <Button
                  ref={inlineCtaRef}
                  size="lg"
                  className="w-full text-base sm:text-lg py-5 sm:py-6"
                  onClick={openPurchaseModal}
                >
                  Ordenar Ahora - Pago Contraentrega
                </Button>
              </div>

              {/* Trust Badges */}
              <div className="grid grid-cols-3 gap-2 sm:gap-3 pt-3 sm:pt-4">
                <div className="flex flex-col items-center gap-1.5 sm:gap-2 p-2 sm:p-3 bg-muted/50 rounded-lg">
                  <Truck className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                  <p className="text-[10px] sm:text-xs font-medium text-center leading-tight">
                    Envío Gratis
                  </p>
                </div>
                <div className="flex flex-col items-center gap-1.5 sm:gap-2 p-2 sm:p-3 bg-muted/50 rounded-lg">
                  <Shield className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                  <p className="text-[10px] sm:text-xs font-medium text-center leading-tight">
                    Garantía 12 meses
                  </p>
                </div>
                <div className="flex flex-col items-center gap-1.5 sm:gap-2 p-2 sm:p-3 bg-muted/50 rounded-lg">
                  <CreditCard className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                  <p className="text-[10px] sm:text-xs font-medium text-center leading-tight">
                    Paga al Recibir
                  </p>
                </div>
              </div>

              {/* Features List */}
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
                    <Check className="w-4 h-4 sm:w-5 sm:h-5 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-xs sm:text-sm leading-relaxed">
                      {feature}
                    </span>
                  </div>
                ))}
              </div>
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
