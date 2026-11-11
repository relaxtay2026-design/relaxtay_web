import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: "guest" | "manager";
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    userId?: string;
    role?: "guest" | "manager";
    accountStatus?: string;
    /** Stamp of the password this session was started under. */
    pwd?: string;
  }
}
