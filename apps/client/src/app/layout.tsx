import QueryClientWrapper from "@/components/query-client-wrapper";
import { cn } from "@/lib/utils";
import type { Metadata } from "next";
import { JetBrains_Mono, Poppins, Plus_Jakarta_Sans, Source_Serif_4 } from "next/font/google";
import "./globals.css";

const fontHeading = Poppins({
  subsets: ["latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],

  variable: "--font-heading",
});

const font = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["200", "300", "400", "500", "600", "700", "800"],
  variable: "--font-sans",
});

const fontMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-mono",
});

const fontSerifDisplay = Source_Serif_4({
  subsets: ["latin"],
  weight: ["400", "600"],
  style: ["normal"],
  variable: "--font-serif-display",
});

export const metadata: Metadata = {
  title: {
    default: "Rona ERP - Effective & Efficient Management",
    template: "%s | Rona ERP",
  },
  description:
    "An ERP system designed to help organizations effectively and efficiently manage their workforce, inventory and production, and tracking sales and finance digitally.",
  icons: [
    {
      url: "/rona-icon.png",
      href: "/rona-icon.png",
      rel: "icon",
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={cn(
        "h-full",
        "antialiased",
        "font-sans",
        font.variable,
        fontHeading.variable,
        fontMono.variable,
        fontSerifDisplay.variable,
      )}
    >
      <body className="min-h-full flex flex-col">
        <QueryClientWrapper>{children}</QueryClientWrapper>
      </body>
    </html>
  );
}
