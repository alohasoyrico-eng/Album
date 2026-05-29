import type { Metadata } from "next";
import { HellerRanking } from "@/components/editorial/HellerRanking";

export const metadata: Metadata = {
  title: "Heller · Apreciado y rechazado — Álbum",
  description:
    "Visualización del ranking dual de Eva Heller: los colores más apreciados y los más rechazados según una encuesta a 2.000 personas.",
};

export default function ColorsPage() {
  return (
    <div className="relative min-h-screen bg-atmospheric" style={{ paddingTop: "80px" }}>
      <div className="relative z-10 max-w-3xl mx-auto px-6 py-12">
        <header className="mb-12">
          <p
            className="text-xs text-ink-faint mb-3"
            style={{ fontFamily: "var(--font-technical)", letterSpacing: "0.25em" }}
          >
            ATLAS CROMÁTICO
          </p>
          <h1
            className="text-5xl md:text-7xl text-ink leading-[0.95] mb-6"
            style={{ fontFamily: "var(--font-display)", fontWeight: 300, letterSpacing: "-0.03em" }}
          >
            Lo que el color provoca
          </h1>
          <p
            className="text-lg text-ink-muted/85 italic leading-relaxed max-w-2xl"
            style={{ fontFamily: "var(--font-literary)" }}
          >
            En 1989 Eva Heller preguntó a 2.000 personas qué colores apreciaban
            y cuáles rechazaban. Los resultados revelan una geografía afectiva
            del cromatismo: el azul triunfa, el marrón se rechaza, el amarillo
            divide. Algunos colores aparecen en ambas listas — son los que más
            tensión generan.
          </p>
        </header>

        <HellerRanking />
      </div>
    </div>
  );
}
