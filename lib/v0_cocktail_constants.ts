import { Cocktail } from "@/types/cocktail"

export type ParticleEffect = "rain" | "fire" | "neon" | "snow" | "bokeh" | "none"

export const GLASS_TYPES = [
  "Coupe",
  "Martini",
  "Highball",
  "Rocks",
  "Collins",
  "Nick & Nora",
  "Hurricane",
  "Flute",
  "Tiki Mug",
] as const

export const PARTICLE_EFFECTS: { value: ParticleEffect; label: string }[] = [
  { value: "rain", label: "Rain" },
  { value: "fire", label: "Fire" },
  { value: "neon", label: "Neon" },
  { value: "snow", label: "Snow" },
  { value: "bokeh", label: "Bokeh" },
  { value: "none", label: "None" },
]

export type Ingredient = {
  id: string
  name: string
  amount: string
}

export function emptyCocktail(): Cocktail {
  return {
    id: crypto.randomUUID(),
    slug: "",
    name: "",
    order_index: 0,
    is_published: false,
    vibe_title: "",
    description: "",
    ingredients: [{ id: crypto.randomUUID(), name: "", amount: "" }],
    taste_notes: "",
    glass_type: GLASS_TYPES[0],
    theme_color_primary: "#1f2937",
    theme_color_secondary: "#9ca3af",
    liquid_color: "#f59e0b",
    particle_effect: "none",
    backdrop_image_url: null,
    backdrop_video_url: null,
    spline_scene_url: null,
    abv: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
}
