import { getRequestConfig } from "next-intl/server";
import { cookies } from "next/headers";

export default getRequestConfig(async () => {
  const cookieStore = await cookies();
  const locale = cookieStore.get("risklens-locale")?.value ?? "fr";
  const validLocales = ["fr", "en", "es", "zh"];
  const safeLocale = validLocales.includes(locale) ? locale : "fr";

  return {
    locale: safeLocale,
    messages: (await import(`../messages/${safeLocale}.json`)).default,
  };
});
