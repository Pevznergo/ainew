import { compare } from 'bcrypt-ts';
import NextAuth, { type DefaultSession } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import Google from 'next-auth/providers/google';
import Yandex from 'next-auth/providers/yandex';
import {
  createGuestUser,
  getUser,
  getUserBalance,
  getUserSubscriptionStatus,
} from '@/lib/db/queries';
import { authConfig } from './auth.config';
import { DUMMY_PASSWORD } from '@/lib/constants';
import type { DefaultJWT } from 'next-auth/jwt';

export type UserType = 'guest' | 'regular';

declare module 'next-auth' {
  interface Session extends DefaultSession {
    user: {
      id: string;
      type: UserType;
      subscription_active: boolean;
      balance: number;
    } & DefaultSession['user'];
  }

  interface User {
    id?: string;
    email?: string | null;
    type: UserType;
  }
}

declare module 'next-auth/jwt' {
  interface JWT extends DefaultJWT {
    id: string;
    type: UserType;
  }
}

export const {
  handlers: { GET, POST },
  auth,
  signIn,
  signOut,
} = NextAuth({
  ...authConfig,
  providers: [
    // OAuth провайдеры (добавляем в начало)
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    }),
    Yandex({
      clientId: process.env.YANDEX_CLIENT_ID || '',
      clientSecret: process.env.YANDEX_CLIENT_SECRET || '',
      authorization: {
        params: {
          scope: 'login:email login:info',
        },
      },
    }),
    // Существующие провайдеры
    Credentials({
      credentials: {},
      async authorize({ email, password }: any) {
        const users = await getUser(email);

        if (users.length === 0) {
          await compare(password, DUMMY_PASSWORD);
          return null;
        }

        const [user] = users;

        if (!user.password) {
          await compare(password, DUMMY_PASSWORD);
          return null;
        }

        const passwordsMatch = await compare(password, user.password);

        if (!passwordsMatch) return null;

        return { ...user, type: 'regular' };
      },
    }),
    Credentials({
      id: 'guest',
      credentials: {},
      async authorize() {
        const [guestUser] = await createGuestUser();
        return { ...guestUser, type: 'guest' };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id as string;
        token.type = user.type || 'regular'; // Устанавливаем тип для OAuth пользователей
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.type = token.type;
        try {
          const [status, balance] = await Promise.all([
            getUserSubscriptionStatus(token.id),
            getUserBalance(token.id),
          ]);
          session.user.subscription_active =
            status?.subscription_active ?? false;
          session.user.balance = balance?.balance ?? 0;
        } catch (e) {
          session.user.subscription_active = false;
          session.user.balance = 0;
        }
      }
      return session;
    },
    async signIn({ user, account }) {
      // Устанавливаем тип 'regular' для OAuth пользователей
      if (account?.provider === 'google' || account?.provider === 'yandex') {
        user.type = 'regular';
      }
      return true;
    },
  },
});
