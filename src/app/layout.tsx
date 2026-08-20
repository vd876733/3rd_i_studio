import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Navigation from "@/components/Navigation";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider } from "@/components/AuthProvider";
import { AuthGuard } from "@/components/auth-guard";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "3rdiStudio Project App",
  description: "Next.js PWA with Prisma, Tailwind CSS, and Shadcn UI",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased light`}
      suppressHydrationWarning
    >
      <body className="min-h-screen flex flex-col bg-background text-foreground antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          forcedTheme="light"
          enableSystem={false}
          disableTransitionOnChange
        >
          <AuthProvider>
            <AuthGuard>
              <Navigation />
              <div className="flex-1 lg:pl-64 pt-16 lg:pt-0 pb-16 lg:pb-0 flex flex-col">
                <main className="flex-1 bg-background text-slate-900 min-h-screen flex flex-col">{children}</main>
              </div>
            </AuthGuard>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
