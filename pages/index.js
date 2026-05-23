import Head from 'next/head';
import LandingPage from '@/components/LandingPage';

// HomeDashboard (Sales Team Performance Hub) is preserved at /dashboard
export default function Home() {
  return (
    <>
      <Head>
        <title>Products App 2.0 — IHG Industries</title>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600;700&family=Geist+Mono:wght@400;500&display=swap" rel="stylesheet" />
      </Head>
      <LandingPage />
    </>
  );
}
