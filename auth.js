import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { neon } from "@neondatabase/serverless";
import bcrypt from "bcryptjs";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email: {},
        password: {},
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        const sql = neon(process.env.DATABASE_URL);
        const rows = await sql`
          SELECT id, email, name, password_hash FROM users
          WHERE email = ${credentials.email}
        `;
        if (rows.length === 0) return null;
        const user = rows[0];
        const valid = await bcrypt.compare(String(credentials.password), user.password_hash);
        if (!valid) return null;
        return { id: String(user.id), email: user.email, name: user.name };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) token.userId = user.id;
      return token;
    },
    session({ session, token }) {
      session.user.id = token.userId;
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
});
