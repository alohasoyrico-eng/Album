import { AtmosphereBuilder } from "@/components/atmosphere/AtmosphereBuilder";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Constructor de Atmósferas — Álbum",
  description: "Combina emoción, color y tipografía para generar atmósferas únicas.",
};

export default function AtmospherePage() {
  return <AtmosphereBuilder />;
}
