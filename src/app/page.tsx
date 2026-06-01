/**
 * Home page — Server Component shell.
 *
 * Reason to be RSC: it imports `MAP_LAYOUT` from a server-only module
 * that runs the d3-force simulation at build time. That precomputed
 * layout is passed as a serialisable prop to the interactive shell
 * (`<HomeClient />`), which in turn hands it to `<SemanticMap />`.
 * The browser never runs the simulation.
 */

import { HomeClient } from "./HomeClient";
import { MAP_LAYOUT } from "@/lib/server/mapLayout";

export default function HomePage() {
  return <HomeClient mapLayout={MAP_LAYOUT} />;
}
