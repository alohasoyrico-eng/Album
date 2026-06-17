import { HomeClient } from "./HomeClient";
import { MAP_LAYOUT } from "@/lib/server/mapLayout";

export default function HomePage() {
  return <HomeClient layout={MAP_LAYOUT} />;
}
