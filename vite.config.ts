import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { type ManifestOptions, VitePWA } from "vite-plugin-pwa";


const manifest:  Partial<ManifestOptions> | false = {
  theme_color: "#8936FF",
  background_color: "#2EC6FE",
  icons: [
    {
      purpose: "maskable",
      sizes: "512x512",
      src: "icon512_maskable.png",
      type: "image/png",
    },
    {
      purpose: "any",
      sizes: "512x512",
      src: "icon512_rounded.png",
      type: "image/png",
    },
  ],

  screenshots: [{
    src: "/screenshots/desktop.png",
    type: "image/png",
    sizes: "1919x967",
    form_factor: "wide",
  },
  {
    src: "/screenshots/mobile.png",
    type: "image/png",
    sizes: "454x814",
    form_factor: "narrow",
  },
],

  orientation: "any",
  display: "fullscreen",
  lang: "ru-UA",
  short_name: "Balloon calc",
  name: "Калькулятор шариков",
};

// https://vite.dev/config/
export default defineConfig({
  base: "/balloon_calc/",
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      workbox: {
        globPatterns: ["**/*.{html,css,js,ico,png,svg}"],
      },
      manifest: manifest,
      
    }),
  ],
});


