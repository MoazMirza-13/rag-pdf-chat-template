import "./globals.css";

export const metadata = {
  title: "Private PDF Chat",
  description: "Upload a PDF and discover what it knows.",
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
