import { Outlet, Link, createRootRoute, HeadContent, Scripts } from "@tanstack/react-router";
import { AuthProvider } from "@/lib/auth-context";
import { ThemeProvider } from "@/lib/theme-context";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { Toaster } from "sonner";
import "@/lib/i18n";
import { ConnectivityListener } from "@/components/ConnectivityListener";

import appCss from "../styles.css?url";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Polyglot Scribe — AI-Powered Multilingual Transcription & Translation" },
      { name: "description", content: "Professional AI transcription and translation for Live Speech, Audio Files, and YouTube videos. Seamlessly translate between English, Amharic, Afaan Oromo, and Somali." },
      { name: "keywords", content: "transcription, translation, AI, Amharic, Somali, Afaan Oromo, Ethiopia, speech-to-text, YouTube transcription" },
      { name: "author", content: "Polyglot Scribe" },
      { name: "robots", content: "index, follow" },

      // Open Graph / Facebook
      { property: "og:type", content: "website" },
      { property: "og:title", content: "Polyglot Scribe — Real-time Transcription & Translation" },
      { property: "og:description", content: "The ultimate tool for transcribing and translating voice, files, and YouTube in Amharic, Somali, Afaan Oromo, and English." },
      { property: "og:image", content: "/logo.png" },

      // Twitter
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Polyglot Scribe — AI Transcription" },
      { name: "twitter:description", content: "Transcribe live speech, audio files, and YouTube videos with instant translation across 4 languages." },
      { name: "twitter:image", content: "/logo.png" },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
      {
        rel: "icon",
        type: "image/png",
        href: "/logo.png",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";
  return (
    <ThemeProvider>
      <GoogleOAuthProvider clientId={googleClientId}>
        <AuthProvider>
          <Outlet />
          <ConnectivityListener />
          <Toaster richColors position="top-right" />
        </AuthProvider>
      </GoogleOAuthProvider>
    </ThemeProvider>
  );
}
