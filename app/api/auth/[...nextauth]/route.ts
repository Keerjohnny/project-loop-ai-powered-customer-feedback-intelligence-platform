import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";

export const authOptions = {
  providers: [GitHub],
};

export const { handlers, signIn, signOut, auth } = NextAuth(authOptions);
export const { GET, POST } = handlers;
