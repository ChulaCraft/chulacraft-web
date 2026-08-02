import { Inter, Rajdhani } from "next/font/google";
import localFont from "next/font/local";

export const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap"
});

export const rajdhani = Rajdhani({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-rajdhani",
  display: "swap"
});

export const minecraftia = localFont({
  src: "../../public/fonts/Minecraftia-Regular.ttf",
  variable: "--font-minecraftia",
  display: "swap",
  preload: true
});
