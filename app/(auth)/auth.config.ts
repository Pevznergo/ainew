import type { NextAuthConfig } from 'next-auth';

export const authConfig = {
  pages: {
    signIn: '/login',
    newUser: '/',
  },
  providers: [
    // added later in auth.ts since it requires bcrypt which is only compatible with Node.js
    // while this file is also used in non-Node.js environments
  ],
  callbacks: {},
  // Добавляем базовый URL для редиректов
  basePath: process.env.NEXTAUTH_URL
    ? new URL(process.env.NEXTAUTH_URL).pathname
    : '',
} satisfies NextAuthConfig;
