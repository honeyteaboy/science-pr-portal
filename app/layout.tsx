import type { Metadata } from "next";
import { DeviceModeShell } from "@/components/DeviceModeShell";
import "./globals.css";

export const metadata: Metadata = {
  title: "Science PR Portal | คณะวิทยาศาสตร์",
  description: "ระบบประชาสัมพันธ์คณะวิทยาศาสตร์"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="th">
      <body>
        <DeviceModeShell>{children}</DeviceModeShell>
      </body>
    </html>
  );
}
