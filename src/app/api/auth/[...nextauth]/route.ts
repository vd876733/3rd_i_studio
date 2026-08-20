import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";

// Ensure NEXTAUTH_URL fallback in local development
if (!process.env.NEXTAUTH_URL && process.env.NODE_ENV !== "production") {
  process.env.NEXTAUTH_URL = "http://localhost:3000";
}

// Runtime environment check to warn developers about placeholders
if (!process.env.GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID.includes("placeholder")) {
  console.error("❌ CRITICAL: GOOGLE_CLIENT_ID is missing or set to a placeholder in .env.local!");
}

const handler = NextAuth({
  adapter: PrismaAdapter(prisma) as any,
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token) {
        session.user.id = token.id as string;
      }
      return session;
    },
    async redirect({ url, baseUrl }) {
      return `${baseUrl}/dashboard`;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  secret: process.env.NEXTAUTH_SECRET || "fallback_secret_key_3rdi_studio_2026",
});

export { handler as GET, handler as POST };
