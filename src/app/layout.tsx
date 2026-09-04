import type { Metadata } from "next";
import { Bodoni_Moda, IBM_Plex_Sans, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";

/** Bodoni Moda is the tall condensed display serif this DESIGN.md pins for headlines and the address hero. */
const bodoniModa = Bodoni_Moda({
  subsets: ["latin"],
  weight: ["700"],
  display: "swap",
  variable: "--font-bodoni",
});

/** IBM Plex Sans carries body copy, labels, and buttons: a clean grotesk against the serif display. */
const plexSans = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
  variable: "--font-plex-sans",
});

/** Ids, timestamps and BBLs are set like a dateline stamp, not body copy. */
const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
  variable: "--font-plex-mono",
});

export const metadata: Metadata = {
  title: {
    default: "Order to Correct",
    template: "%s",
  },
  description:
    "A tenant and a legal-aid advocate share one housing court case, each with a different WebMCP tool set: capability-key roles, confirm-before-mutate, shared state, SSE.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${bodoniModa.variable} ${plexSans.variable} ${plexMono.variable} h-full`}
    >
      <body className="min-h-full bg-paper text-ink antialiased">{children}</body>
    </html>
  );
}
