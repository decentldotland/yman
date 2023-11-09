import Image from 'next/image'
import { Inter } from 'next/font/google'
import Head from 'next/head'

const inter = Inter({ subsets: ['latin'] })

export default function Home() {
  return (
    <>
      <Head>
          <title>YoctoManji</title>
          <link rel="icon" href="/diamond.png" />
      </Head>
      <main
        className={`flex min-h-screen flex-col items-center justify-center p-24 ${inter.className} bg-black`}
      >
        <a className="text-white text-5xl" href="/board">Proceed to the mythical YoctoManji</a>
      </main>
    </>
  )
}
