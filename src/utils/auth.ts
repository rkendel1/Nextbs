import bcrypt from "bcrypt";
import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GitHubProvider from "next-auth/providers/github";
import GoogleProvider from "next-auth/providers/google";
import EmailProvider from "next-auth/providers/email";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { PrismaClient } from "@prisma/client";
import { prisma } from "./prismaDB";
import type { Adapter } from "next-auth/adapters";

export const authOptions: NextAuthOptions = {
  pages: {
    signIn: "/?auth=signin",
    signOut: "/",
    error: "/?auth=signin", // Error code passed in query string
  },
  adapter: PrismaAdapter(prisma) as Adapter,
  secret: process.env.SECRET,
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  cookies: {
    sessionToken: {
      name: process.env.NODE_ENV === 'production'
        ? `__Secure-next-auth.session-token`
        : `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
    callbackUrl: {
      name: process.env.NODE_ENV === 'production'
        ? `__Secure-next-auth.callback-url`
        : `next-auth.callback-url`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
    csrfToken: {
      name: process.env.NODE_ENV === 'production'
        ? `__Host-next-auth.csrf-token`
        : `next-auth.csrf-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
    state: {
      name: process.env.NODE_ENV === 'production'
        ? '__Secure-next-auth.state'
        : 'next-auth.state',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        maxAge: 900, // 15 minutes in seconds
      },
    },
  },

  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "text", placeholder: "Jhondoe" },
        password: { label: "Password", type: "password" },
        username: { label: "Username", type: "text", placeholder: "Jhon Doe" },
      },

      async authorize(credentials) {
        // check to see if email and password is there
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Please enter an email or password");
        }

        // check to see if user already exist
        const user = await prisma.user.findUnique({
          where: {
            email: credentials.email,
          },
        });

        // if user was not found
        if (!user || !user?.password) {
          throw new Error("Invalid email or password");
        }

        // check to see if passwords match
        const passwordMatch = await bcrypt.compare(
          credentials.password,
          user.password,
        );

        // console.log(passwordMatch);

        if (!passwordMatch) {
          console.log("test", passwordMatch);
          throw new Error("Incorrect password");
        }

        return user;
      },
    }),

    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    }),

    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: "select_account",
          access_type: "online",
          response_type: "code"
        }
      },
    }),

    EmailProvider({
      server: {
        host: process.env.EMAIL_SERVER_HOST,
        port: Number(process.env.EMAIL_SERVER_PORT),
        auth: {
          user: process.env.EMAIL_SERVER_USER,
          pass: process.env.EMAIL_SERVER_PASSWORD,
        },
      },
      from: process.env.EMAIL_FROM,
    }),
  ],

  callbacks: {
    signIn: async ({ user, account, profile }) => {
      // Handle automatic account linking for OAuth providers
      if (account?.provider === "google" || account?.provider === "github") {
        if (!user.email) return false;

        // Check if this OAuth account already exists
        const existingAccount = await prisma.account.findUnique({
          where: {
            provider_providerAccountId: {
              provider: account.provider,
              providerAccountId: account.providerAccountId,
            },
          },
        });

        // If OAuth account exists, allow sign-in
        if (existingAccount) return true;

        // Check if user exists with this email
        const existingUser = await prisma.user.findUnique({
          where: { email: user.email },
        });

        // If user exists, manually link the OAuth account
        if (existingUser) {
          await prisma.account.create({
            data: {
              userId: existingUser.id,
              type: account.type,
              provider: account.provider,
              providerAccountId: account.providerAccountId,
              refresh_token: account.refresh_token,
              access_token: account.access_token,
              expires_at: account.expires_at,
              token_type: account.token_type,
              scope: account.scope,
              id_token: account.id_token,
              session_state: account.session_state,
            },
          });
          return true;
        }
      }
      
      // Allow all other sign-ins
      return true;
    },

    jwt: async (payload: any) => {
      const { token } = payload;
      const user = payload.user;

      if (user) {
        // Get additional user data including onboarding status
        const dbUser = await prisma.user.findUnique({
          where: { id: user.id },
          include: { saasCreator: true }
        });

          return {
            ...token,
            id: user.id,
            role: user.role,
            onboardingCompleted: dbUser?.saasCreator?.onboardingCompleted || false,
            onboardingStep: dbUser?.saasCreator?.onboardingStep || 1,
          };
      }
      return token;
    },

    session: async ({ session, token }) => {
      if (session?.user) {
        return {
          ...session,
          user: {
            ...session.user,
            id: token?.id,
            role: token?.role,
            onboardingCompleted: token?.onboardingCompleted || false,
            onboardingStep: token?.onboardingStep || 1,
          },
        };
      }
      return session;
    },

    redirect: async ({ url, baseUrl }) => {
      // Allow relative URLs
      if (url.startsWith("/")) {
        // Handle error cases - redirect to custom signin with error
        if (url.includes('/api/auth/error')) {
          return `${baseUrl}/?auth=signin&error=OAuthCallback`;
        }
        // Never redirect to default NextAuth signin page
        if (url.includes('/api/auth/signin')) {
          return `${baseUrl}/?auth=signin`;
        }
        return `${baseUrl}${url}`;
      }
      
      // Allow callback URLs for the same origin
      if (new URL(url).origin === baseUrl) {
        // Check if this is a sign-in callback that should go to onboarding
        if (url.includes('/api/auth/callback/') || url.includes('callbackUrl')) {
          return `${baseUrl}/saas/onboarding`;
        }
        // Never redirect to default NextAuth pages
        if (url.includes('/api/auth/signin')) {
          return `${baseUrl}/?auth=signin`;
        }
        return url;
      }
      
      // Handle external redirects that might go to default NextAuth pages
      if (url.includes('/api/auth/signin')) {
        return `${baseUrl}/?auth=signin`;
      }
      
      // Default to custom signin page for any other case
      return `${baseUrl}/?auth=signin`;
    },
  },

  // debug: process.env.NODE_ENV === "developement",
};