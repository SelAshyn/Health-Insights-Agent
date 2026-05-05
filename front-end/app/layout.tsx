import type { Metadata } from "next";
import { Inter, Sora } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/AuthContext";

// Inter — the gold standard for UI text. Extremely legible at small sizes.
// variable: "--font-inter" creates a CSS custom property we can reference in Tailwind.
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap", // show fallback font while Inter loads, then swap — avoids invisible text
});

// Sora — modern, geometric, slightly rounded. Great for brand names and headings.
const sora = Sora({
  variable: "--font-sora",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700", "800"], // load only the weights we'll use
});

export const metadata: Metadata = {
  title: "Health Insights Agent",
  description: "AI-powered health report analysis — understand your blood work in plain language",
  icons: {
    icon: "/icon.svg",
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
      // Attach both font variables to the html element so they're available
      // as CSS custom properties throughout the entire app.
      className={`${inter.variable} ${sora.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
