import { Providers } from "@/components/Providers";
import "./globals.css";

export const metadata = {
  title: "HayalMest Meyhanesi | Randevu & Rezervasyon",
  description: "Premium Türkü Bar - Hayatın En Özel Anlarını HayalMest'te Kutlayın!",
};

export default function RootLayout({ children }) {
  return (
    <html lang="tr">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
