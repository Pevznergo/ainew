import { compare } from 'bcrypt-ts';
import NextAuth, { type DefaultSession } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
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
    Credentials({
      credentials: {},
      async authorize({ email, password }: any) {
        try {
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
        } catch (error) {
          console.error('Error in regular authorize:', error);
          return null;
        }
      },
    }),
    Credentials({
      id: 'guest',
      credentials: {},
      async authorize() {
        try {
          console.log('Creating guest user...');
          const [guestUser] = await createGuestUser();
          console.log('Guest user created:', guestUser.id);
          return { ...guestUser, type: 'guest' };
        } catch (error) {
          console.error('Error creating guest user:', error);
          // Возвращаем fallback гостевого пользователя
          return {
            id: `guest_${Date.now()}`,
            email: `guest_${Date.now()}@aporto.tech`,
            type: 'guest' as const,
          };
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id as string;
        token.type = user.type;
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
          console.error('Error getting user data:', e);
          session.user.subscription_active = false;
          session.user.balance = 0;
        }
      }
      return session;
    },
  },
});
