import QueryClientWrapper from "@/components/query-client-wrapper";
import ThemeProvider from "@/components/theme-provider";
import { cn } from "@/lib/utils";
import type { Metadata } from "next";
import { JetBrains_Mono, Quicksand } from "next/font/google";
import "./globals.css";

// Brand primary typeface. Body copy uses the Helvetica stack from globals.css.
const fontHeading = Quicksand({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-heading",
});

const fontMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: {
    default: "Rona — Enterprise Business Management Platform",
    template: "%s | Rona",
  },
  description:
    "Streamline your success with Rona, the enterprise-grade platform for retail, manufacturing, services and distribution: inventory management, financial tracking and employee management in one place.",
  openGraph: {
    title: "Rona — Enterprise Business Management Platform",
    description: "Streamline Your Success with RONA.",
    siteName: "Rona",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn(
        "h-full",
        "antialiased",
        "font-sans",
        fontHeading.variable,
        fontMono.variable,
      )}
    >
      <body className="app-canvas min-h-full flex flex-col">
        <ThemeProvider>
          <QueryClientWrapper>{children}</QueryClientWrapper>
        </ThemeProvider>
      </body>
    </html>
  );
}
