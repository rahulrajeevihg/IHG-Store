import Head from "next/head";
import { useEffect, useState } from "react";

const COUNTDOWN_MS = 60 * 60 * 1000; // 1 hour
const STORAGE_KEY = "maintenance_end_ts";

function formatHMS(ms) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = String(Math.floor(total / 3600)).padStart(2, "0");
  const m = String(Math.floor((total % 3600) / 60)).padStart(2, "0");
  const s = String(total % 60).padStart(2, "0");
  return `${h}:${m}:${s}`;
}

// Standalone maintenance page. Rendered bare (no header/footer/auth) — see the
// early return for "/maintenance" in pages/_app.js. Shown to all users when the
// MAINTENANCE_MODE env var is on (see middleware.js).
export default function Maintenance() {
  // 1-hour countdown. The end time is anchored on first visit and kept in
  // localStorage so refreshing the page doesn't restart the timer.
  const [remaining, setRemaining] = useState(COUNTDOWN_MS);

  useEffect(() => {
    let end = Number(localStorage.getItem(STORAGE_KEY));
    if (!end || Number.isNaN(end)) {
      end = Date.now() + COUNTDOWN_MS;
      localStorage.setItem(STORAGE_KEY, String(end));
    }
    const tick = () => setRemaining(Math.max(0, end - Date.now()));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const isUp = remaining <= 0;

  return (
    <>
      <Head>
        <title>We&apos;ll be right back — IHG</title>
        <meta name="robots" content="noindex" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="shortcut icon" href="/logo.png" />
      </Head>

      <main className="min-h-screen w-full flex items-center justify-center bg-white px-5 py-12">
        <div className="w-full max-w-[560px] text-center">
          <div className="flex justify-center mb-6">
            {/* Animated GIF — use a plain <img> so the animation plays. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/under-construction.gif"
              alt="Under construction"
              width={420}
              height={420}
              className="w-[300px] h-[300px] sm:w-[420px] sm:h-[420px] object-contain"
            />
          </div>

          <h1 className="text-[22px] sm:text-[26px] font-semibold text-[#1f2937] leading-snug">
            Work in progress
          </h1>
          <p className="mt-3 text-[14px] sm:text-[15px] text-[#5c5c5c] leading-relaxed">
            We&apos;re carrying out scheduled maintenance to update product
            pricing. The site will be back online shortly — thanks for your
            patience.
          </p>

          {isUp ? (
            <p className="mt-7 text-[14px] sm:text-[15px] font-medium text-[#54b41f]">
              We&apos;re almost done — please refresh in a few minutes.
            </p>
          ) : (
            <div className="mt-7">
              <p className="text-[12px] uppercase tracking-[0.12em] text-[#8d9aa8] mb-2">
                Estimated time remaining
              </p>
              <div className="text-[34px] sm:text-[40px] font-semibold tabular-nums tracking-wide text-[#1f2937] font-mono">
                {formatHMS(remaining)}
              </div>
            </div>
          )}

          <div className="mt-9 h-px w-full bg-[#e5e7eb]" />
          <p className="mt-5 text-[12px] text-[#8d9aa8]">
            © {new Date().getFullYear()} products.ihgind.com · All Rights Reserved
          </p>
        </div>
      </main>
    </>
  );
}

// Return a proper 503 so crawlers/monitors treat this as temporary.
export async function getServerSideProps({ res }) {
  res.statusCode = 503;
  res.setHeader("Retry-After", "3600");
  return { props: {} };
}
