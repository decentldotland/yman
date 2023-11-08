import '@/styles/globals.css'
import type { AppProps } from 'next/app'
import { Pixelify_Sans } from 'next/font/google'

const pixelify_sans = Pixelify_Sans({ subsets: ['latin'] })

export default function App({ Component, pageProps }: AppProps) {
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
