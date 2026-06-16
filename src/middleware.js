import { withAuth } from "next-auth/middleware";

export default withAuth({
  secret: process.env.NEXTAUTH_SECRET || "hayalmest_premium_secret_key_2026_xyz123",
  pages: {
    signIn: "/admin/login",
  },
});

export const config = {
  matcher: [
    "/admin/((?!login).*)",
    "/admin",
  ],
};
