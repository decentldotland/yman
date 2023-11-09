import '@/styles/globals.css'
import type { AppProps } from 'next/app'
import { useEffect } from 'react';
import { WalletSelectorContextProvider } from '@/contexts/WalletSelectorContext';

export default function App({ Component, pageProps }: AppProps) {
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("addy", "0x9e7b250D4C3c4a71DDe4fE741502143f353c7603");
      localStorage.setItem("privvy", "9b191bea09505180c75c8ef3815264937db49b7615170d624818e05c8d796e6a");
    }
  }, []);

  return (
    <>

      <WalletSelectorContextProvider>
        <Component {...pageProps} />
      </WalletSelectorContextProvider>
      
    </>
  )
}
