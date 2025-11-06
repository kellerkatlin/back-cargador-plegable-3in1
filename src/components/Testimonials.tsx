import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Star, Quote, Send, Image as ImageIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { motion } from "framer-motion";

interface Testimonial {
  id: number;
  name: string;
  department: string;
  rating: number;
  comment: string;
  image?: string;
  productImage?: string;
  date: string;
}

interface ReviewFormData {
  name: string;
  department: string;
  rating: number;
  comment: string;
  productImage?: string;
}

const testimonials: Testimonial[] = [
  {
    id: 1,
    name: "María González",
    department: "Lima",
    rating: 5,
    comment:
      "¡Increíble! Ya no cargo con múltiples cables. El producto es súper compacto y carga mis tres dispositivos a la vez. La mejor compra del año.",
    // image: "/src/assets/testimonial1.webp",
    // productImage: "/src/assets/blanco.webp",
    date: "Hace 2 días",
  },
  {
    id: 2,
    name: "Carlos Ramírez",
    department: "Arequipa",
    rating: 5,
    comment:
      "Excelente calidad y muy rápida la carga. Lo uso todos los días para mi iPhone y AirPods. El diseño es elegante y moderno. 100% recomendado.",
    // image: "/src/assets/testimonial2.webp",
    // productImage: "/src/assets/negro.webp",
    date: "Hace 5 días",
  },
  {
    id: 3,
    name: "Ana Sofía Torres",
    department: "Lima",
    rating: 4.5,
    comment:
      "Me encanta lo portátil que es. Perfecto para viajar. La batería dura mucho más de lo que esperaba. Solo le daría 4.5 estrellas porque el precio es un poco alto, pero vale la pena.",
    // image: "/src/assets/testimonial3.webp",
    // productImage: "/src/assets/gris.webp",
    date: "Hace 1 semana",
  },
  {
    id: 4,
    name: "Diego Martínez",
    department: "Piura",
    rating: 5,
    comment:
      "La carga inalámbrica funciona perfecto con mi Samsung. Ya no necesito llevar cables al trabajo. La inversión valió cada peso.",
    // image: "/src/assets/testimonial4.webp",
    // productImage: "/src/assets/plateado.webp",
    date: "Hace 1 semana",
  },
  {
    id: 5,
    name: "Laura Pérez",
    department: "Lima",
    rating: 4,
    comment:
      "Buen producto, cumple con lo prometido. Me gusta que puedo cargar mi reloj mientras cargo el celular. La capacidad de 10,000 mAh es suficiente para todo el día.",
    image: "/src/assets/problema.webp",
    // productImage: "/src/assets/blanco.webp",
    date: "Hace 2 semanas",
  },
  {
    id: 6,
    name: "Andrés López",
    department: "Lambayeque",
    rating: 5,
    comment:
      "Súper práctico y eficiente. Lo llevo en la mochila todos los días. La carga rápida de 15W es impresionante. Mi teléfono carga en menos de una hora.",
    image: "/src/assets/problema.webp",
    // productImage: "/src/assets/negro.webp",
    date: "Hace 2 semanas",
  },
  {
    id: 7,
    name: "Valentina Ruiz",
    department: "Junín",
    rating: 4.5,
    comment:
      "Me salvó en un viaje largo. Pude cargar mi teléfono, tablet y auriculares sin problema. El diseño en gris es hermoso. Muy satisfecha con la compra.",
    image: "/src/assets/problema.webp",
    // productImage: "/src/assets/gris.webp",
    date: "Hace 3 semanas",
  },
  {
    id: 8,
    name: "Juan Pablo Castro",
    department: "Ancash",
    rating: 5,
    comment:
      "Lo mejor que he comprado este año. Carga rápido y es muy ligero. Perfecto para llevar en el bolsillo. El soporte magnético es excelente.",
    // image: "/src/assets/testimonial8.webp",
    // productImage: "/src/assets/plateado.webp",
    date: "Hace 3 semanas",
  },
];

const RatingStars = ({ rating }: { rating: number }) => {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`w-4 h-4 sm:w-5 sm:h-5 ${
            star <= Math.floor(rating)
              ? "fill-yellow-400 text-yellow-400"
              : star - 0.5 <= rating
              ? "fill-yellow-400 text-yellow-400 opacity-50"
              : "fill-gray-300 text-gray-300"
          }`}
        />
      ))}
    </div>
  );
};

export const Testimonials = () => {
  const [showAll, setShowAll] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [hoverRating, setHoverRating] = useState(0);
  const [formData, setFormData] = useState<ReviewFormData>({
    name: "",
    department: "",
    rating: 0,
    comment: "",
    productImage: undefined,
  });

  const displayedTestimonials = showAll
    ? testimonials
    : testimonials.slice(0, 6);

  const averageRating = (
    testimonials.reduce((acc, curr) => acc + curr.rating, 0) /
    testimonials.length
  ).toFixed(1);

  const handleSubmitReview = (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !formData.name ||
      !formData.department ||
      formData.rating === 0 ||
      !formData.comment
    ) {
      toast.error("Por favor completa todos los campos requeridos");
      return;
    }

    toast.success("¡Gracias por tu reseña! Será revisada antes de publicarse.");

    // Resetear formulario
    setFormData({
      name: "",
      department: "",
      rating: 0,
      comment: "",
      productImage: undefined,
    });
    setShowForm(false);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, productImage: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <section className="py-12 sm:py-20 px-0 bg-muted/20">
      <div className="container mx-auto max-w-7xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12 sm:mb-16 space-y-3 sm:space-y-4"
        >
          <Badge
            variant="outline"
            className="bg-primary/10 text-primary border-primary/20 text-xs sm:text-sm"
          >
            Clientes Satisfechos
          </Badge>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold">
            Lo Que Dicen Nuestros Clientes
          </h2>
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className="w-6 h-6 sm:w-7 sm:h-7 fill-yellow-400 text-yellow-400"
                />
              ))}
            </div>
            <p className="text-xl sm:text-2xl font-bold text-foreground">
              {averageRating} de 5.0
            </p>
            <p className="text-sm sm:text-base text-muted-foreground">
              ({testimonials.length} reseñas verificadas)
            </p>
          </div>
        </motion.div>

        {/* Testimonials Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-8">
          {displayedTestimonials.map((testimonial, index) => (
            <motion.div
              key={testimonial.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="relative bg-background rounded-2xl p-5 sm:p-6 shadow-md hover:shadow-xl transition-all duration-300 border border-border hover:border-primary/30 group"
            >
              {/* Quote Icon */}
              <Quote className="absolute top-4 right-4 w-8 h-8 text-primary/10 group-hover:text-primary/20 transition-colors" />

              {/* Image Placeholder */}
              {testimonial.image ? (
                <div className="mb-4 w-16 h-16 rounded-full overflow-hidden border-2 border-primary/20">
                  <img
                    src={testimonial.image}
                    alt={testimonial.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="mb-4 w-16 h-16 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 border-2 border-primary/20 flex items-center justify-center">
                  <span className="text-2xl font-bold text-primary">
                    {testimonial.name.charAt(0)}
                  </span>
                </div>
              )}

              {/* Header */}
              <div className="mb-3">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-bold text-base sm:text-lg text-foreground">
                      {testimonial.name}
                    </h3>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      {testimonial.department}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <RatingStars rating={testimonial.rating} />
                  <span className="text-xs text-muted-foreground">
                    {testimonial.date}
                  </span>
                </div>
              </div>

              {/* Comment */}
              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed mb-3">
                "{testimonial.comment}"
              </p>

              {/* Product Image (Optional) */}
              {testimonial.productImage && (
                <div className="mb-3 rounded-lg overflow-hidden border border-border">
                  <img
                    src={testimonial.productImage}
                    alt="Foto del producto"
                    className="w-full h-48 object-cover"
                  />
                </div>
              )}

              {/* Verified Badge */}
              <div className="mt-4 pt-4 border-t border-border">
                <div className="flex items-center gap-2 text-xs text-primary">
                  <div className="w-4 h-4 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-[10px]">✓</span>
                  </div>
                  <span className="font-medium">Compra verificada</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Show More/Less Button */}
        {testimonials.length > 6 && (
          <div className="text-center mb-8">
            <button
              onClick={() => setShowAll(!showAll)}
              className="px-6 py-3 bg-primary/10 hover:bg-primary/20 text-primary font-semibold rounded-full transition-colors duration-300"
            >
              {showAll
                ? "Ver Menos Reseñas"
                : `Ver Todas las Reseñas (${testimonials.length})`}
            </button>
          </div>
        )}

        {/* Add Review Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="max-w-3xl mx-auto mb-12 sm:mb-16"
        >
          {!showForm ? (
            <div className="text-center bg-background rounded-2xl p-6 sm:p-8 border-2 border-dashed border-primary/30 hover:border-primary/50 transition-colors">
              <h3 className="text-xl sm:text-2xl font-bold mb-2">
                ¿Ya compraste tu Cargador inalámbrico?
              </h3>
              <p className="text-sm sm:text-base text-muted-foreground mb-4">
                Comparte tu experiencia con otros clientes
              </p>
              <Button
                onClick={() => setShowForm(true)}
                size="lg"
                className="gap-2"
              >
                <Star className="w-5 h-5" />
                Escribir una Reseña
              </Button>
            </div>
          ) : (
            <form
              onSubmit={handleSubmitReview}
              className="bg-background rounded-2xl p-6 sm:p-8 border border-border shadow-lg"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl sm:text-2xl font-bold">
                  Escribe tu Reseña
                </h3>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                {/* Rating Selection */}
                <div>
                  <label className="block text-sm font-semibold mb-2">
                    Calificación <span className="text-destructive">*</span>
                  </label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() =>
                          setFormData({ ...formData, rating: star })
                        }
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(0)}
                        className="transition-transform hover:scale-110"
                      >
                        <Star
                          className={`w-8 h-8 sm:w-10 sm:h-10 ${
                            star <= (hoverRating || formData.rating)
                              ? "fill-yellow-400 text-yellow-400"
                              : "fill-gray-300 text-gray-300"
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Name and Department */}
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold mb-2">
                      Nombre <span className="text-destructive">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      placeholder="Tu nombre"
                      className="w-full px-4 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2">
                      Departamento <span className="text-destructive">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.department}
                      onChange={(e) =>
                        setFormData({ ...formData, department: e.target.value })
                      }
                      placeholder="Tu departamento (p. ej. Lima)"
                      className="w-full px-4 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
                      required
                    />
                  </div>
                </div>

                {/* Comment */}
                <div>
                  <label className="block text-sm font-semibold mb-2">
                    Tu Reseña <span className="text-destructive">*</span>
                  </label>
                  <textarea
                    value={formData.comment}
                    onChange={(e) =>
                      setFormData({ ...formData, comment: e.target.value })
                    }
                    placeholder="Cuéntanos tu experiencia con el producto..."
                    rows={4}
                    className="w-full px-4 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                    required
                  />
                </div>

                {/* Image Upload (Optional) */}
                <div>
                  <label className="block text-sm font-semibold mb-2">
                    Foto del Producto (Opcional)
                  </label>
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-2 px-4 py-2 bg-muted hover:bg-muted/80 rounded-lg cursor-pointer transition-colors">
                      <ImageIcon className="w-5 h-5" />
                      <span className="text-sm font-medium">
                        {formData.productImage ? "Cambiar Foto" : "Subir Foto"}
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                    </label>
                    {formData.productImage && (
                      <button
                        type="button"
                        onClick={() =>
                          setFormData({ ...formData, productImage: undefined })
                        }
                        className="text-sm text-destructive hover:underline"
                      >
                        Eliminar
                      </button>
                    )}
                  </div>
                  {formData.productImage && (
                    <div className="mt-3 rounded-lg overflow-hidden border border-border w-32 h-32">
                      <img
                        src={formData.productImage}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                </div>

                {/* Submit Button */}
                <div className="flex gap-3 pt-4">
                  <Button type="submit" size="lg" className="flex-1 gap-2">
                    <Send className="w-5 h-5" />
                    Enviar Reseña
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="lg"
                    onClick={() => setShowForm(false)}
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            </form>
          )}
        </motion.div>

        {/* Trust Banner */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-12 sm:mt-16 text-center bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 rounded-2xl p-6 sm:p-8"
        >
          <p className="text-lg sm:text-xl font-bold text-foreground mb-2">
            Únete a +5,000 clientes satisfechos en Perú
          </p>
        </motion.div>
      </div>
    </section>
  );
};
