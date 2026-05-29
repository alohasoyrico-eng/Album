/**
 * Map every Álbum entity kind to a Material Symbols Outlined ligature name.
 *
 * Use as:
 *   import { ICON } from "@/lib/icons";
 *   <span className="icon icon-md">{ICON.artwork}</span>
 *
 * Also exposes ICON_SVG_FONT for SVG <text> elements where the icon must
 * render inside an <svg>: pass the family in fontFamily and the ligature
 * name as text content (OpenType ligatures still apply inside SVG).
 */

import type { SearchKind } from "./searchIndex";

export const ICON: Record<SearchKind, string> = {
  emotion:       "favorite",
  clan:          "groups",
  tribe:         "diversity_3",
  color:         "format_paint",
  typography:    "text_fields",
  artwork:       "palette",
  music:         "music_note",
  film:          "movie",
  poem:          "text_snippet",
  sculpture:     "view_in_ar",
  dance:         "directions_run",
  architecture:  "apartment",
  photography:   "photo_camera",
  literature:    "auto_stories",
  ritual:        "local_fire_department",
  theater:       "theater_comedy",
};

/** Family name to pass into SVG `<text fontFamily=…>`. */
export const ICON_SVG_FONT = "Material Symbols Outlined";

/** Quick action / UI icons not tied to a specific entity kind. */
export const UI_ICON = {
  search:        "search",
  close:         "close",
  arrow_right:   "arrow_forward",
  arrow_left:    "arrow_back",
  arrow_up:      "keyboard_arrow_up",
  arrow_down:    "keyboard_arrow_down",
  open_in_new:   "open_in_new",
  more:          "more_horiz",
  bookmark:      "bookmark_border",
  share:         "ios_share",
  collection:    "collections_bookmark",
  atmosphere:    "blur_on",
  map:           "scatter_plot",
  filter:        "tune",
  enter:         "subdirectory_arrow_left",
} as const;
