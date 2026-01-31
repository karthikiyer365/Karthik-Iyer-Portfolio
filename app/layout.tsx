import "./globals.css";
import { AppProviders } from "./providers";

export const metadata = {
  title: "Karthik Iyer",
  description: "Developer Portfolio",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
