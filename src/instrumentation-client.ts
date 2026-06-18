// This file configures the initialization of Sentry on the client.
// The added config here will be used whenever a users loads a page in their browser.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: "https://71a85e8280d2c693825d23d9ea0186dc@o4511576713199616.ingest.de.sentry.io/4511576721653840",
  enabled: process.env.NODE_ENV === "production",
  integrations: [Sentry.replayIntegration()],
  tracesSampleRate: 0.2,
  enableLogs: true,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
  sendDefaultPii: true,
});

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
