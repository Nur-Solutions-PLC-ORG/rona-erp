import { cn } from "@/lib/utils";
import type { Metadata } from "next";
import { Inter, Public_Sans } from "next/font/google";
import "./globals.css";
import QueryClientWrapper from "@/components/query-client-wrapper";

const fontHeading = Public_Sans({
  subsets: ["latin"],
  variable: "--font-heading",
});

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

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
        inter.variable,
        fontHeading.variable,
      )}
    >
      <body className="min-h-full flex flex-col">
        <QueryClientWrapper>{children}</QueryClientWrapper>
      </body>
    </html>
  );
}
