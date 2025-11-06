import { ProductHero } from "@/components/ProductHero";
import { VideoSection } from "@/components/VideoSection";
import { ProblemSolution } from "@/components/ProblemSolution";
import { Testimonials } from "@/components/Testimonials";
import { ProductInfo } from "@/components/ProductInfo";
import { ProductSpecs } from "@/components/ProductSpecs";
import { TopBar } from "@/components/TopBar";
import { FaqSection } from "@/components/FaqSection";

const Index = () => {
  return (
    <main className="min-h-screen bg-background">
      <TopBar />

      <ProductHero />
      <VideoSection />
      <ProblemSolution />
      <ProductSpecs />
      <ProductInfo />
      <FaqSection />
      <Testimonials />

      {/* Footer */}
      <footer className="border-t bg-muted/30 py-8 mt-20">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm text-muted-foreground">
            © 2025 P&T Store. Todos los derechos reservados.
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            Pago contraentrega disponible | Envío gratis a todo el Perú
          </p>
        </div>
      </footer>
    </main>
  );
};

export default Index;
