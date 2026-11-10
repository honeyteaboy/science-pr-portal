import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Science PR Portal | คณะวิทยาศาสตร์",
  description: "ระบบประชาสัมพันธ์คณะวิทยาศาสตร์"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="th"><body>{children}</body></html>;
}
