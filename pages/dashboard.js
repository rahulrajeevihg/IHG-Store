import Head from 'next/head';
import HomeDashboard from '@/components/HomeDashboard';

export default function Dashboard() {
  return (
    <>
      <Head>
        <title>Sales Team Performance Hub</title>
      </Head>
      <HomeDashboard />
    </>
  );
}
