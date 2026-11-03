import { createAuthClient } from "@neondatabase/auth";
import { BetterAuthReactAdapter } from "@neondatabase/auth/react/adapters";
import { getNeonAuthUrl } from "../auth/neonAuth";

let authClientPromise;

export const getAuthClient = async () => {
  if (!authClientPromise) {
    authClientPromise = getNeonAuthUrl().then((authUrl) =>
      createAuthClient(authUrl, {
        adapter: BetterAuthReactAdapter(),
      })
    );
  }

  return authClientPromise;
};

export default getAuthClient;
