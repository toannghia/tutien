import { betterAuth } from "better-auth";
import { anonymous } from "better-auth/plugins";
import { mergeGuestInto } from "./merge";

export type Env = {
  DB: D1Database;
  ASSETS: Fetcher;
  BETTER_AUTH_SECRET: string;
  BETTER_AUTH_URL: string;
  GOOGLE_CLIENT_ID?: string;
  GOOGLE_CLIENT_SECRET?: string;
  MATCHMAKER: DurableObjectNamespace;
  DUEL_ROOM: DurableObjectNamespace;
  DUEL_BOT_LABEL?: string;
};

export const GUEST_NAME = "Vô danh tu sĩ";

// Binding D1 chỉ có trong từng request, nên tạo instance theo env
export function createAuth(env: Env) {
  return betterAuth({
    database: env.DB,
    secret: env.BETTER_AUTH_SECRET,
    baseURL: env.BETTER_AUTH_URL,
    basePath: "/api/auth",
    emailAndPassword: { enabled: true, minPasswordLength: 8 },
    socialProviders:
      env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET
        ? { google: { clientId: env.GOOGLE_CLIENT_ID, clientSecret: env.GOOGLE_CLIENT_SECRET } }
        : {},
    session: {
      expiresIn: 60 * 60 * 24 * 90, // 90 ngày — khớp với hạn dọn tài khoản khách
      updateAge: 60 * 60 * 24,
    },
    plugins: [
      anonymous({
        emailDomainName: "guest.tutien.invalid",
        generateName: () => GUEST_NAME,
        // Chạy khi khách đăng ký hoặc đăng nhập (email, Google...). Sau hook này Better Auth xoá user khách.
        onLinkAccount: async ({ anonymousUser, newUser }) => {
          await mergeGuestInto(env.DB, anonymousUser.user.id, newUser.user.id);
        },
      }),
    ],
  });
}

export type Auth = ReturnType<typeof createAuth>;
