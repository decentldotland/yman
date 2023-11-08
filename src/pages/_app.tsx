import '@/styles/globals.css'
import type { AppProps } from 'next/app'
import { Pixelify_Sans } from 'next/font/google'
import { useEffect } from 'react';

const pixelify_sans = Pixelify_Sans({ subsets: ['latin'] })

export default function App({ Component, pageProps }: AppProps) {
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("addy", "0x9e7b250D4C3c4a71DDe4fE741502143f353c7603");
      localStorage.setItem("privvy", "9b191bea09505180c75c8ef3815264937db49b7615170d624818e05c8d796e6a");
    }
  }, []);

  return (
    <>
      <style jsx global>{`
        html {
          font-family: ${pixelify_sans.style.fontFamily};
        }
      `}
      </style>
      <Component {...pageProps} />
    </>
  )
}
