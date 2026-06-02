import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'iClose — Buy Dubai property without paying agent commission',
  description: 'The buyer-first way to buy Dubai off-plan property. Zero commission, 100% cashback. Confirmed in writing before you sign.',
}

export const viewport: Viewport = {
  themeColor: '#000000',
}

const themeScript = `(function(){try{var t=localStorage.getItem('theme');if(t==='dark'||t==='light'){document.documentElement.setAttribute('data-theme',t);}}catch(e){}})();`

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head><script dangerouslySetInnerHTML={{ __html: themeScript }} /></head>
      <body>{children}</body>
    </html>
  )
}
