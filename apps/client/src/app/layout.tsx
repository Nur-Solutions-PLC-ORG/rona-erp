import QueryClientWrapper from "@/components/query-client-wrapper";
import { cn } from "@/lib/utils";
import type { Metadata } from "next";
import { Poppins, Lato } from "next/font/google";
import "./globals.css";

const fontHeading = Poppins({
  subsets: ["latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],

  variable: "--font-heading",
});

const font = Lato({
  subsets: ["latin"],
  weight: ["100", "300", "400", "700", "900"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: {
    default: "Rona ERP - Effective & Efficient Management",
    template: "%s | Rona ERP",
  },
  description:
    "An ERP system designed to help companies effectively and efficiently manage their workforce, inventory and production, and tracking sales and finance digitally.",
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
      )}
    >
      <body className="min-h-full flex flex-col">
        <QueryClientWrapper>{children}</QueryClientWrapper>
      </body>
    </html>
  );
}
