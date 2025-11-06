"use client";

import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

export function FaqSection() {
  return (
    <section className="bg-[#111] mt-10 text-white py-16 px-8 mx-2 rounded-md">
      <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-12">
        {/* Left - FAQ */}
        <div>
          <h2 className="text-3xl sm:text-4xl font-bold mb-8">
            Preguntas frecuentes
          </h2>

          <Accordion type="single" collapsible className="space-y-3">
            <AccordionItem value="airpods">
              <AccordionTrigger className="text-left">
                ¿No puedes cargar tus AirPods?
              </AccordionTrigger>
              <AccordionContent className="text-sm text-gray-300 leading-relaxed">
                Primero, asegúrese de usar el adaptador y el cable incluidos en
                el paquete.
                <br />
                <br />
                Luego, siga estos pasos:
                <ol className="list-decimal ml-5 mt-3 space-y-1">
                  <li>
                    Desconecta el adaptador de carga, espera unos 5 segundos y
                    vuelve a conectarlo.
                  </li>
                  <li>Coloca tus AirPods en el centro del área de carga.</li>
                  <li>
                    Si aún así no se cargan, intenta colocarlos en la zona de
                    carga del iPhone.
                  </li>
                </ol>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="fundas">
              <AccordionTrigger className="text-left">
                ¿Se puede usar con una funda de teléfono?
              </AccordionTrigger>
              <AccordionContent className="text-sm text-gray-300 leading-relaxed">
                Sí, pero recomendamos usar una funda compatible con MagSafe para
                una conexión magnética estable. Las fundas gruesas pueden
                disminuir la potencia de carga y causar sobrecalentamiento.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="envios">
              <AccordionTrigger className="text-left">
                ¿Cuánto tiempo tomará para recibir mis pedidos?
              </AccordionTrigger>
              <AccordionContent className="text-sm text-gray-300 leading-relaxed">
                Enviamos tu pedido el mismo día siempre que sea posible. Tiempos
                estimados:
                <br />
                <br />- Lima y Callao (días hábiles): <b>1 día</b>
                <br />- Provincias (días hábiles): <b>3 días</b>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="cuenta">
              <AccordionTrigger className="text-left">
                ¿Necesito configurar una cuenta para realizar un pedido?
              </AccordionTrigger>
              <AccordionContent className="text-sm text-gray-300 leading-relaxed">
                No es necesario. Crear una cuenta permite ver historial y datos
                de garantía.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="paises">
              <AccordionTrigger className="text-left">
                ¿Qué países pueden comprar?
              </AccordionTrigger>
              <AccordionContent className="text-sm text-gray-300 leading-relaxed">
                Realizamos envíos únicamente dentro del Perú. Tiempos estimados:
                <br />
                <br />- Lima y Callao (días hábiles): <b>1 día</b>
                <br />- Provincias (días hábiles): <b>3 días</b>
                <br />
                Por ahora no realizamos envíos internacionales.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="contacto">
              <AccordionTrigger className="text-left">
                ¿Cualquier pregunta?
              </AccordionTrigger>
              <AccordionContent className="text-sm text-gray-300">
                Puedes contactarnos desde nuestra página de contacto. ¡Estamos
                encantados de ayudarte!
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>

        {/* Right - Contact Support */}
        <div className="bg-[#181818] rounded-2xl p-6 sm:p-8 border border-white/10">
          <h3 className="text-xl font-semibold mb-2">
            ¿No encontraste tu respuesta?
          </h3>

          <p className="text-sm text-gray-300 mb-6 leading-relaxed">
            ❤️ No dudes en contactarnos.
            <br />
            Respondemos dentro de <b>24 horas</b> (días laborables). Gracias por
            tu paciencia.
          </p>

          <form className="space-y-4">
            <Input
              placeholder="Nombre"
              className="bg-black border-white/20 text-white"
            />
            <Input
              placeholder="Correo electrónico"
              className="bg-black border-white/20 text-white"
            />
            <Textarea
              placeholder="Mensaje"
              className="bg-black border-white/20 text-white h-28"
            />

            <Button className="w-full bg-white text-black font-semibold hover:bg-white/90">
              Para enviar
            </Button>
          </form>
        </div>
      </div>
    </section>
  );
}
