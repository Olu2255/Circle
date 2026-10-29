import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Circle · Go further, together", template: "%s · Circle" },
  description:
    "A small circle of people who understand your ambitions. Connect around your career and learning goals.",
  robots: { index: false, follow: false },
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <a className="skip-link" href="#main-content">
          Skip to content
        </a>
        {children}
      </body>
    </html>
  );
}
