import "./globals.css";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import { AppProviders } from "./providers";

const geistSans = Geist({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const SITE_URL = "https://karthikiyer.info";

const TITLE = "Karthik Iyer – AI Engineer & Data Analyst";
const DESCRIPTION =
  "AI engineer & data analyst building data platforms, entity resolution pipelines and analytics dashboards. M.Sc Data Analytics, George Washington University.";

export const metadata = {
  metadataBase: new URL(SITE_URL),
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/" },
  openGraph: {
    type: "profile",
    url: "/",
    siteName: "Karthik Iyer",
    title: TITLE,
    description: DESCRIPTION,
  },
  twitter: { card: "summary_large_image", title: TITLE, description: DESCRIPTION },
};

const PERSON_JSON_LD = {
  "@context": "https://schema.org",
  "@type": "Person",
  "@id": `${SITE_URL}/#person`,
  name: "Karthik Iyer",
  url: SITE_URL,
  image: `${SITE_URL}/img.png`,
  jobTitle: ["AI Engineer", "Data Analyst"],
  worksFor: { "@type": "Organization", name: "RestoreFast" },
  alumniOf: [
    { "@type": "CollegeOrUniversity", name: "George Washington University" },
    { "@type": "CollegeOrUniversity", name: "University of Mumbai" },
  ],
  homeLocation: {
    "@type": "Place",
    address: {
      "@type": "PostalAddress",
      addressLocality: "Arlington",
      addressRegion: "VA",
      addressCountry: "US",
    },
  },
  sameAs: [
    "https://linkedin.com/in/ksi365",
    "https://github.com/karthikiyer365",
    "https://writing.karthikiyer.info",
    "https://projects.karthikiyer.info",
  ],
};

export const viewport = {
  colorScheme: "light dark",
  themeColor: "#ffffff",
};

// Applies a saved dark-theme choice before first paint (no light flash).
// Key must match THEME_STORAGE_KEY in app/providers.tsx.
const THEME_INIT_SCRIPT = `try{if(localStorage.getItem("theme")==="dark")document.documentElement.dataset.theme="dark"}catch(e){}`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(PERSON_JSON_LD) }}
        />
      </head>
      <body>
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-WMVWTJ7M4X"
          strategy="afterInteractive"
        />
        <Script id="gtag-init" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-WMVWTJ7M4X');
          `}
        </Script>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
