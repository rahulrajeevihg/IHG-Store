import { useEffect, useRef, useState, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { useRouter } from 'next/router';
import dynamic from 'next/dynamic';
import Head from 'next/head';
import { get_recent_quotations, getErpDeskQuotationUrl, check_Image } from '@/libs/api';

const MobileHeader = dynamic(() => import('@/components/Headers/mobileHeader/MobileHeader'));
const CartSidebar  = dynamic(() => import('@/components/Sales/CartSidebar'));
const QuotationHistoryDrawer = dynamic(() => import('@/components/Sales/QuotationHistoryDrawer'));

// ─── Category definitions with detailed wireframe SVGs ────────────────────────
const CATEGORIES = [
  {
    name: 'SPOT LIGHT',
    color: '#f59e0b',
    lightBg: '#fffbeb',
    icon: (
      <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: 52, height: 52 }}>
        {/* Housing body */}
        <ellipse cx="32" cy="16" rx="12" ry="7" stroke="currentColor" strokeWidth="1.8"/>
        <rect x="20" y="13" width="24" height="10" rx="2" stroke="currentColor" strokeWidth="1.8"/>
        {/* Reflector inner */}
        <ellipse cx="32" cy="22" rx="7" ry="4" stroke="currentColor" strokeWidth="1.4" strokeDasharray="2 2"/>
        {/* Lamp bulb */}
        <circle cx="32" cy="22" r="2.5" fill="currentColor" opacity="0.25" stroke="currentColor" strokeWidth="1.2"/>
        {/* Light cone */}
        <path d="M22 23 L10 50 M42 23 L54 50" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" opacity="0.4"/>
        <path d="M24 23 L14 50 M40 23 L50 50" stroke="currentColor" strokeWidth="1" strokeLinecap="round" opacity="0.2"/>
        {/* Beam fill */}
        <path d="M22 23 L10 50 L54 50 L42 23 Z" fill="currentColor" opacity="0.06"/>
        {/* Mount bracket */}
        <line x1="32" y1="10" x2="32" y2="4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        <line x1="26" y1="4" x2="38" y2="4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    name: 'WALL LIGHT',
    color: '#8b5cf6',
    lightBg: '#f5f3ff',
    icon: (
      <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: 52, height: 52 }}>
        {/* Wall surface */}
        <rect x="2" y="4" width="8" height="56" rx="1" fill="currentColor" opacity="0.1" stroke="currentColor" strokeWidth="1.6"/>
        {/* Arm bracket */}
        <path d="M10 24 Q20 24 20 32" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none"/>
        {/* Shade outer */}
        <path d="M12 32 Q20 22 28 28 Q36 34 28 44 Q20 50 12 44 Z" stroke="currentColor" strokeWidth="1.8" fill="currentColor" opacity="0.07"/>
        {/* Shade opening top */}
        <ellipse cx="20" cy="28" rx="8" ry="3" stroke="currentColor" strokeWidth="1.4"/>
        {/* Shade opening bottom */}
        <ellipse cx="20" cy="43" rx="10" ry="3.5" stroke="currentColor" strokeWidth="1.4"/>
        {/* Bulb */}
        <circle cx="20" cy="34" r="3" fill="currentColor" opacity="0.2" stroke="currentColor" strokeWidth="1.2"/>
        {/* Light rays right */}
        <line x1="30" y1="30" x2="38" y2="26" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" opacity="0.5"/>
        <line x1="32" y1="35" x2="42" y2="35" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" opacity="0.5"/>
        <line x1="30" y1="40" x2="38" y2="44" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" opacity="0.5"/>
      </svg>
    ),
  },
  {
    name: 'DOWN LIGHT',
    color: '#0ea5e9',
    lightBg: '#f0f9ff',
    icon: (
      <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: 52, height: 52 }}>
        {/* Ceiling surface */}
        <rect x="4" y="4" width="56" height="8" rx="1" fill="currentColor" opacity="0.08" stroke="currentColor" strokeWidth="1.6"/>
        {/* Recessed housing */}
        <rect x="16" y="8" width="32" height="10" rx="2" fill="currentColor" opacity="0.1" stroke="currentColor" strokeWidth="1.6"/>
        {/* Trim ring outer */}
        <ellipse cx="32" cy="18" rx="14" ry="5" stroke="currentColor" strokeWidth="1.8"/>
        {/* Trim ring inner */}
        <ellipse cx="32" cy="18" rx="9" ry="3.5" stroke="currentColor" strokeWidth="1.2" strokeDasharray="2.5 2"/>
        {/* Light source */}
        <ellipse cx="32" cy="18" rx="4" ry="2" fill="currentColor" opacity="0.3"/>
        {/* Downward light cone */}
        <path d="M20 20 L12 52 L52 52 L44 20 Z" fill="currentColor" opacity="0.05"/>
        {/* Light rays */}
        <line x1="32" y1="22" x2="32" y2="50" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" opacity="0.35"/>
        <line x1="26" y1="22" x2="20" y2="50" stroke="currentColor" strokeWidth="1" strokeLinecap="round" opacity="0.25"/>
        <line x1="38" y1="22" x2="44" y2="50" stroke="currentColor" strokeWidth="1" strokeLinecap="round" opacity="0.25"/>
        <line x1="29" y1="22" x2="24" y2="50" stroke="currentColor" strokeWidth="0.8" strokeLinecap="round" opacity="0.15"/>
        <line x1="35" y1="22" x2="40" y2="50" stroke="currentColor" strokeWidth="0.8" strokeLinecap="round" opacity="0.15"/>
      </svg>
    ),
  },
  {
    name: 'SUSPENDED LAMP',
    color: '#f97316',
    lightBg: '#fff7ed',
    icon: (
      <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: 52, height: 52 }}>
        {/* Ceiling mount */}
        <rect x="26" y="3" width="12" height="5" rx="2" fill="currentColor" opacity="0.15" stroke="currentColor" strokeWidth="1.6"/>
        {/* Cord/suspension */}
        <line x1="32" y1="8" x2="32" y2="20" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
        {/* Shade top ring */}
        <ellipse cx="32" cy="21" rx="10" ry="3" stroke="currentColor" strokeWidth="1.6"/>
        {/* Shade body — dome */}
        <path d="M22 21 Q18 30 18 36 Q18 44 32 46 Q46 44 46 36 Q46 30 42 21" stroke="currentColor" strokeWidth="1.8" fill="currentColor" opacity="0.07"/>
        {/* Shade bottom opening */}
        <ellipse cx="32" cy="46" rx="14" ry="4" stroke="currentColor" strokeWidth="1.6"/>
        {/* Inner shade detail */}
        <ellipse cx="32" cy="26" rx="6" ry="2" stroke="currentColor" strokeWidth="1" strokeDasharray="2 2" opacity="0.6"/>
        {/* Bulb */}
        <circle cx="32" cy="32" r="4" fill="currentColor" opacity="0.15" stroke="currentColor" strokeWidth="1.2"/>
        <circle cx="32" cy="32" r="2" fill="currentColor" opacity="0.3"/>
        {/* Light spill below */}
        <path d="M22 48 L16 60 M42 48 L48 60" stroke="currentColor" strokeWidth="1" strokeLinecap="round" opacity="0.3"/>
        <path d="M26 48 L24 60 M38 48 L40 60" stroke="currentColor" strokeWidth="0.8" strokeLinecap="round" opacity="0.2"/>
      </svg>
    ),
  },
  {
    name: 'CHANDELIERS',
    color: '#ec4899',
    lightBg: '#fdf2f8',
    icon: (
      <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: 52, height: 52 }}>
        {/* Ceiling mount */}
        <ellipse cx="32" cy="6" rx="7" ry="3" stroke="currentColor" strokeWidth="1.6" fill="currentColor" opacity="0.1"/>
        {/* Center stem */}
        <line x1="32" y1="9" x2="32" y2="22" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        {/* Central body */}
        <ellipse cx="32" cy="23" rx="5" ry="3" stroke="currentColor" strokeWidth="1.6" fill="currentColor" opacity="0.1"/>
        {/* Left arm */}
        <path d="M27 23 Q16 23 14 30" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" fill="none"/>
        {/* Right arm */}
        <path d="M37 23 Q48 23 50 30" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" fill="none"/>
        {/* Far left arm */}
        <path d="M28 22 Q18 18 10 26" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" fill="none" strokeDasharray="1 0"/>
        {/* Far right arm */}
        <path d="M36 22 Q46 18 54 26" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" fill="none"/>
        {/* Left candle */}
        <rect x="11" y="30" width="6" height="8" rx="3" stroke="currentColor" strokeWidth="1.4" fill="currentColor" opacity="0.08"/>
        <path d="M14 30 Q14 27 14 26" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
        <ellipse cx="14" cy="25" rx="1.5" ry="2" fill="currentColor" opacity="0.4"/>
        {/* Right candle */}
        <rect x="47" y="30" width="6" height="8" rx="3" stroke="currentColor" strokeWidth="1.4" fill="currentColor" opacity="0.08"/>
        <path d="M50 30 Q50 27 50 26" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
        <ellipse cx="50" cy="25" rx="1.5" ry="2" fill="currentColor" opacity="0.4"/>
        {/* Mid left candle */}
        <rect x="11" y="26" width="5" height="7" rx="2.5" stroke="currentColor" strokeWidth="1.2" fill="currentColor" opacity="0.06"/>
        <ellipse cx="13.5" cy="25" rx="1.2" ry="1.8" fill="currentColor" opacity="0.3"/>
        {/* Mid right candle */}
        <rect x="48" y="26" width="5" height="7" rx="2.5" stroke="currentColor" strokeWidth="1.2" fill="currentColor" opacity="0.06"/>
        <ellipse cx="50.5" cy="25" rx="1.2" ry="1.8" fill="currentColor" opacity="0.3"/>
        {/* Center bottom pendant */}
        <line x1="32" y1="26" x2="32" y2="34" stroke="currentColor" strokeWidth="1.4"/>
        <path d="M28 34 Q32 38 36 34" stroke="currentColor" strokeWidth="1.4" fill="currentColor" opacity="0.1"/>
        <ellipse cx="32" cy="38" rx="4" ry="5" stroke="currentColor" strokeWidth="1.4" fill="currentColor" opacity="0.08"/>
        {/* Decorative ring */}
        <ellipse cx="32" cy="23" rx="10" ry="3.5" stroke="currentColor" strokeWidth="1" strokeDasharray="2 3" opacity="0.5"/>
      </svg>
    ),
  },
  {
    name: 'LED DRIVERS',
    color: '#10b981',
    lightBg: '#ecfdf5',
    icon: (
      <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: 52, height: 52 }}>
        {/* Main body */}
        <rect x="8" y="16" width="48" height="28" rx="3" stroke="currentColor" strokeWidth="1.8" fill="currentColor" opacity="0.06"/>
        {/* Heat fins right side */}
        <line x1="56" y1="21" x2="62" y2="21" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
        <line x1="56" y1="26" x2="62" y2="26" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
        <line x1="56" y1="31" x2="62" y2="31" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
        <line x1="56" y1="36" x2="62" y2="36" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
        <line x1="56" y1="41" x2="62" y2="41" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
        {/* Input terminal left */}
        <rect x="2" y="25" width="6" height="14" rx="1.5" stroke="currentColor" strokeWidth="1.4" fill="currentColor" opacity="0.08"/>
        <line x1="5" y1="29" x2="5" y2="29" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
        <line x1="5" y1="34" x2="5" y2="34" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
        {/* Label area */}
        <rect x="14" y="22" width="24" height="16" rx="2" stroke="currentColor" strokeWidth="1.2" fill="currentColor" opacity="0.05" strokeDasharray="2 2"/>
        {/* LED label lines */}
        <line x1="17" y1="27" x2="25" y2="27" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" opacity="0.7"/>
        <line x1="17" y1="31" x2="35" y2="31" stroke="currentColor" strokeWidth="1" strokeLinecap="round" opacity="0.5"/>
        <line x1="17" y1="34" x2="30" y2="34" stroke="currentColor" strokeWidth="1" strokeLinecap="round" opacity="0.5"/>
        {/* Status LED dot */}
        <circle cx="46" cy="24" r="3" fill="currentColor" opacity="0.3" stroke="currentColor" strokeWidth="1.2"/>
        <circle cx="46" cy="24" r="1.5" fill="currentColor" opacity="0.6"/>
        {/* Output wires bottom */}
        <line x1="24" y1="44" x2="20" y2="56" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
        <line x1="32" y1="44" x2="32" y2="56" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
        <line x1="40" y1="44" x2="44" y2="56" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
        <line x1="17" y1="56" x2="47" y2="56" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
      </svg>
    ),
  },
];

// ─── Editorial banners ────────────────────────────────────────────────────────
const BANNERS = [
  {
    title: 'Spotlights & Downlights',
    sub: 'Precision beam control for every space',
    query: 'SPOT LIGHT',
    bg: '#fffbeb',
    border: '#fde68a',
    accent: '#d97706',
    tag: 'Most Popular',
  },
  {
    title: 'LED Drivers & Controls',
    sub: 'Constant current & voltage solutions',
    query: 'LED DRIVERS',
    bg: '#f0fdf4',
    border: '#bbf7d0',
    accent: '#16a34a',
    tag: 'Technical',
  },
  {
    title: 'Suspended & Chandeliers',
    sub: 'Statement pieces for premium spaces',
    query: 'SUSPENDED LAMP',
    bg: '#fdf4ff',
    border: '#e9d5ff',
    accent: '#9333ea',
    tag: 'Decorative',
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function greeting() {
  const h = new Date().getHours();
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
}
function formatDate() {
  return new Date().toLocaleDateString('en-AE', { weekday: 'long', day: 'numeric', month: 'long' });
}
function StatusBadge({ status }) {
  const map = { Draft: ['#fef9c3','#854d0e'], Submitted: ['#dcfce7','#15803d'], Cancelled: ['#fee2e2','#b91c1c'], Expired: ['#f3f4f6','#6b7280'] };
  const [bg, color] = map[status] || map.Draft;
  return <span style={{ background: bg, color, fontSize: 10, fontWeight: 600, padding: '2px 7px', borderRadius: 99 }}>{status}</span>;
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function Home() {
  const router      = useRouter();
  const webSettings = useSelector((s) => s.webSettings.websiteSettings);
  const cartItems   = useSelector((s) => s.cartSettings.cartItems);
  const cartCount   = useSelector((s) => s.cartSettings.cartCount);
  const cartValue   = useSelector((s) => s.cartSettings.cartValue);
  const loginInfo   = useSelector((s) => s.logInInfo.customerInfo);

  const [theme_settings, setTheme_settings]   = useState(null);
  const [quotations, setQuotations]           = useState([]);
  const [quotLoading, setQuotLoading]         = useState(true);
  const [cartOpen, setCartOpen]               = useState(false);
  const [quotDrawerOpen, setQuotDrawerOpen]   = useState(false);
  const [activeCategory, setActiveCategory]   = useState('');
  const [displayName, setDisplayName]         = useState('');
  const [displayDate, setDisplayDate]         = useState('');
  const [displayGreeting, setDisplayGreeting] = useState('');

  useMemo(() => {
    if (webSettings?.app_settings) setTheme_settings(webSettings.app_settings);
  }, [webSettings]);

  // Client-only values — avoids SSR/hydration mismatch
  useEffect(() => {
    const name = loginInfo?.full_name || localStorage.getItem('full_name') || 'Sales Rep';
    setDisplayName(name.split(' ')[0]);
    setDisplayDate(formatDate());
    setDisplayGreeting(greeting());
  }, [loginInfo]);

  useEffect(() => {
    (async () => {
      const resp = await get_recent_quotations().catch(() => null);
      if (Array.isArray(resp?.message)) setQuotations(resp.message);
      setQuotLoading(false);
    })();
  }, []);

  const grandTotal = parseFloat(cartValue?.grand_total || 0);

  const go = (category) => {
    if (category) router.push(`/list?category_list=${encodeURIComponent(category)}`);
    else router.push('/list');
  };

  const refreshQuotes = async () => {
    setQuotLoading(true);
    const r = await get_recent_quotations().catch(() => null);
    if (Array.isArray(r?.message)) setQuotations(r.message);
    setQuotLoading(false);
  };

  return (
    <>
      <Head><title>IHG — Sales Dashboard</title></Head>

      <div className="lg:hidden sticky top-0 z-[99] bg-white">
        {theme_settings && <MobileHeader home cart search theme_settings={theme_settings} />}
      </div>

      {cartOpen && (
        <CartSidebar
          onClose={() => setCartOpen(false)}
          onQuotationCreated={() => { setCartOpen(false); refreshQuotes(); }}
        />
      )}
      <QuotationHistoryDrawer
        open={quotDrawerOpen}
        onClose={() => setQuotDrawerOpen(false)}
        quotations={quotations}
        loading={quotLoading}
        onRefresh={refreshQuotes}
      />

      <div style={{ background: '#f8fafc', minHeight: '100vh' }}>

        {/* ── Hero ─────────────────────────────────────────────────────── */}
        <div style={{ background: '#fff', borderBottom: '1px solid #e8edf3' }}>
          <div style={{ maxWidth: 1140, margin: '0 auto', padding: '32px 28px 28px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 24, alignItems: 'start' }}>

              {/* Left: greeting */}
              <div>
                <p style={{ color: '#94a3b8', fontSize: 12, margin: '0 0 4px', letterSpacing: 0.4 }}>{displayDate}</p>
                <h1 style={{ color: '#0f172a', fontSize: 28, fontWeight: 800, margin: '0 0 4px', letterSpacing: -0.5 }}>
                  {displayGreeting}{displayGreeting ? ', ' : ''}<span style={{ color: '#4f46e5' }}>{displayName}</span>
                </h1>
                <p style={{ color: '#64748b', fontSize: 14, margin: '0 0 24px' }}>Ready to build your next quotation?</p>

                {/* Action buttons */}
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 24 }}>
                  <button onClick={() => go()} style={{
                    background: '#4f46e5', color: '#fff', border: 'none', borderRadius: 10,
                    padding: '10px 20px', fontWeight: 700, fontSize: 14, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: 8,
                    boxShadow: '0 2px 8px rgba(79,70,229,0.25)',
                  }}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                    Browse Products
                  </button>
                  <button onClick={() => setCartOpen(true)} style={{
                    background: '#fff', color: '#0f172a', border: '1.5px solid #e2e8f0', borderRadius: 10,
                    padding: '10px 20px', fontWeight: 600, fontSize: 14, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: 8,
                  }}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
                    My Cart
                    {cartCount > 0 && <span style={{ background: '#ef4444', color: '#fff', fontSize: 10, fontWeight: 800, padding: '1px 6px', borderRadius: 99 }}>{cartCount}</span>}
                  </button>
                  <button onClick={() => setQuotDrawerOpen(true)} style={{
                    background: '#fff', color: '#0f172a', border: '1.5px solid #e2e8f0', borderRadius: 10,
                    padding: '10px 20px', fontWeight: 600, fontSize: 14, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: 8,
                  }}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9 12h6m-6 4h6m2 5H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5.586a1 1 0 0 1 .707.293l5.414 5.414a1 1 0 0 1 .293.707V19a2 2 0 0 1-2 2z"/></svg>
                    Quotations
                  </button>
                </div>

                {/* Stat pills */}
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                  {[
                    { label: 'Items in Cart', value: cartCount, color: '#4f46e5', bg: '#eef2ff' },
                    { label: 'Cart Value', value: grandTotal > 0 ? `AED ${grandTotal.toLocaleString('en-AE', { minimumFractionDigits: 2 })}` : '—', color: '#059669', bg: '#ecfdf5' },
                    { label: 'Recent Quotes', value: quotLoading ? '…' : quotations.length, color: '#d97706', bg: '#fffbeb' },
                  ].map((s) => (
                    <div key={s.label} style={{ background: s.bg, borderRadius: 10, padding: '10px 16px', minWidth: 110 }}>
                      <p style={{ color: '#64748b', fontSize: 10, margin: '0 0 3px', fontWeight: 600, letterSpacing: 0.4, textTransform: 'uppercase' }}>{s.label}</p>
                      <p style={{ color: s.color, fontSize: 20, fontWeight: 800, margin: 0 }}>{s.value}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right: cart preview */}
              <div style={{
                background: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: 16,
                minWidth: 280, maxWidth: 300, overflow: 'hidden',
              }}>
                <div style={{ padding: '14px 16px', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <p style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', margin: 0 }}>Active Cart</p>
                  {grandTotal > 0 && (
                    <span style={{ background: '#ecfdf5', color: '#16a34a', fontSize: 12, fontWeight: 700, padding: '3px 10px', borderRadius: 8 }}>
                      AED {grandTotal.toLocaleString('en-AE', { minimumFractionDigits: 2 })}
                    </span>
                  )}
                </div>
                {cartCount > 0 ? (
                  <>
                    <div style={{ padding: '6px 0' }}>
                      {cartItems.slice(0, 4).map((item) => (
                        <div key={item.item_code} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 16px' }}>
                          <div style={{ width: 32, height: 32, borderRadius: 7, background: '#fff', border: '1px solid #e2e8f0', overflow: 'hidden', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {item.website_image_url || item.image
                              ? <img src={check_Image(item.website_image_url || item.image)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21h6M12 3a6 6 0 0 1 6 6c0 2.4-1.3 4.5-3.2 5.6L15 18H9l.2-3.4A6 6 0 0 1 6 9a6 6 0 0 1 6-6z"/></svg>
                            }
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ fontSize: 11, fontWeight: 600, color: '#1e293b', margin: '0 0 1px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.item_name || item.item_code}</p>
                            <p style={{ fontSize: 10, color: '#94a3b8', margin: 0 }}>Qty: {item.quantity || item.count}</p>
                          </div>
                          <p style={{ fontSize: 11, fontWeight: 700, color: '#0f172a', flexShrink: 0 }}>AED {parseFloat(item.amount || 0).toFixed(0)}</p>
                        </div>
                      ))}
                      {cartCount > 4 && <p style={{ fontSize: 10, color: '#94a3b8', textAlign: 'center', margin: '2px 0 6px' }}>+{cartCount - 4} more</p>}
                    </div>
                    <div style={{ padding: '10px 16px 14px', display: 'flex', gap: 8 }}>
                      <button onClick={() => setCartOpen(true)} style={{ flex: 1, background: '#4f46e5', color: '#fff', border: 'none', borderRadius: 8, padding: '9px 0', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>Open Cart</button>
                      <button onClick={() => go()} style={{ flex: 1, background: '#fff', color: '#374151', border: '1.5px solid #e2e8f0', borderRadius: 8, padding: '9px 0', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Add More</button>
                    </div>
                  </>
                ) : (
                  <div style={{ padding: '28px 16px', textAlign: 'center' }}>
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#e2e8f0" strokeWidth="1.5" style={{ margin: '0 auto 8px', display: 'block' }} strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
                    <p style={{ color: '#94a3b8', fontSize: 12, margin: '0 0 10px' }}>No items yet</p>
                    <button onClick={() => go()} style={{ background: '#4f46e5', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 18px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>Browse Products →</button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ── Category strip ──────────────────────────────────────────── */}
          <div style={{ maxWidth: 1140, margin: '0 auto', padding: '0 28px 18px' }}>
            <div style={{ display: 'flex', gap: 8, overflowX: 'auto', scrollbarWidth: 'none' }}>
              <button
                onClick={() => { setActiveCategory(''); go(); }}
                style={{
                  flexShrink: 0, borderRadius: 99, padding: '7px 18px', fontSize: 13, fontWeight: 600,
                  cursor: 'pointer', transition: 'all 0.15s', border: 'none',
                  background: activeCategory === '' ? '#4f46e5' : '#f1f5f9',
                  color: activeCategory === '' ? '#fff' : '#64748b',
                }}
              >All Products</button>

              {CATEGORIES.map((cat) => (
                <button
                  key={cat.name}
                  onClick={() => { setActiveCategory(cat.name); go(cat.name); }}
                  style={{
                    flexShrink: 0, borderRadius: 99, padding: '7px 18px', fontSize: 13, fontWeight: 600,
                    cursor: 'pointer', transition: 'all 0.15s', whiteSpace: 'nowrap',
                    border: activeCategory === cat.name ? 'none' : '1.5px solid #e2e8f0',
                    background: activeCategory === cat.name ? cat.color : '#fff',
                    color: activeCategory === cat.name ? '#fff' : '#374151',
                  }}
                >{cat.name}</button>
              ))}

              <button
                onClick={() => go()}
                style={{
                  flexShrink: 0, borderRadius: 99, padding: '7px 18px', fontSize: 13, fontWeight: 600,
                  cursor: 'pointer', whiteSpace: 'nowrap',
                  background: '#f1f5f9', color: '#4f46e5',
                  border: '1.5px dashed #c7d2fe',
                }}
              >More →</button>
            </div>
          </div>
        </div>

        {/* ── Page body ─────────────────────────────────────────────────── */}
        <div style={{ maxWidth: 1140, margin: '0 auto', padding: '32px 28px 56px' }}>

          {/* Editorial banners */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 32 }}>
            {BANNERS.map((b) => (
              <button
                key={b.title}
                onClick={() => go(b.query)}
                style={{
                  background: b.bg, border: `1.5px solid ${b.border}`,
                  borderRadius: 16, padding: '24px 22px', textAlign: 'left',
                  cursor: 'pointer', transition: 'all 0.18s',
                  position: 'relative', overflow: 'hidden',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = `0 10px 28px rgba(0,0,0,0.08)`; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
              >
                <span style={{
                  display: 'inline-block', background: b.accent, color: '#fff',
                  fontSize: 10, fontWeight: 700, padding: '3px 9px', borderRadius: 99,
                  letterSpacing: 0.5, marginBottom: 14,
                }}>{b.tag}</span>
                <p style={{ fontSize: 16, fontWeight: 800, color: '#0f172a', margin: '0 0 6px' }}>{b.title}</p>
                <p style={{ fontSize: 13, color: '#64748b', margin: '0 0 18px', lineHeight: 1.5 }}>{b.sub}</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: b.accent, fontSize: 13, fontWeight: 700 }}>
                  Explore
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                </div>
              </button>
            ))}
          </div>

          {/* Two-column: categories + quotations */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 24, alignItems: 'start' }}>

            {/* Category grid */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <h2 style={{ fontSize: 15, fontWeight: 800, color: '#0f172a', margin: 0 }}>Shop by Category</h2>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.name}
                    onClick={() => { setActiveCategory(cat.name); go(cat.name); }}
                    style={{
                      background: '#fff', border: '1.5px solid #e8edf3',
                      borderRadius: 16, padding: '26px 12px 20px',
                      cursor: 'pointer', textAlign: 'center',
                      transition: 'all 0.18s ease', display: 'flex',
                      flexDirection: 'column', alignItems: 'center',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = cat.color;
                      e.currentTarget.style.transform = 'translateY(-4px)';
                      e.currentTarget.style.boxShadow = `0 10px 28px rgba(0,0,0,0.07)`;
                      e.currentTarget.style.background = cat.lightBg;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = '#e8edf3';
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = 'none';
                      e.currentTarget.style.background = '#fff';
                    }}
                  >
                    <div style={{ color: cat.color, marginBottom: 14 }}>
                      {cat.icon}
                    </div>
                    <p style={{ fontSize: 12, fontWeight: 700, color: '#1e293b', margin: 0, lineHeight: 1.35 }}>{cat.name}</p>
                  </button>
                ))}

                {/* View More card */}
                <button
                  onClick={() => go()}
                  style={{
                    background: '#fff', border: '1.5px dashed #c7d2fe',
                    borderRadius: 16, padding: '26px 12px 20px',
                    cursor: 'pointer', textAlign: 'center', transition: 'all 0.18s ease',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = '#eef2ff'; e.currentTarget.style.transform = 'translateY(-4px)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.transform = 'translateY(0)'; }}
                >
                  <div style={{ color: '#4f46e5', marginBottom: 14 }}>
                    <svg viewBox="0 0 52 52" fill="none" style={{ width: 52, height: 52 }}>
                      <circle cx="16" cy="16" r="8" stroke="currentColor" strokeWidth="1.8"/>
                      <circle cx="36" cy="16" r="8" stroke="currentColor" strokeWidth="1.8"/>
                      <circle cx="16" cy="36" r="8" stroke="currentColor" strokeWidth="1.8"/>
                      <circle cx="36" cy="36" r="8" stroke="currentColor" strokeWidth="1.8" strokeDasharray="3 2"/>
                      <line x1="33" y1="36" x2="39" y2="36" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                      <line x1="36" y1="33" x2="36" y2="39" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                  </div>
                  <p style={{ fontSize: 12, fontWeight: 700, color: '#4f46e5', margin: 0 }}>View More</p>
                </button>
              </div>
            </div>

            {/* Recent Quotations */}
            <div style={{ background: '#fff', borderRadius: 16, border: '1.5px solid #e8edf3', overflow: 'hidden' }}>
              <div style={{ padding: '16px 18px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <p style={{ fontSize: 14, fontWeight: 800, color: '#0f172a', margin: '0 0 2px' }}>Recent Quotations</p>
                  <p style={{ fontSize: 11, color: '#94a3b8', margin: 0 }}>Your last 5</p>
                </div>
                <button onClick={() => setQuotDrawerOpen(true)} style={{ fontSize: 12, color: '#4f46e5', fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>View all →</button>
              </div>

              {quotLoading ? (
                <div style={{ padding: '20px 18px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {Array(4).fill(null).map((_, i) => (
                    <div key={i} style={{ display: 'flex', gap: 10 }}>
                      <div style={{ flex: 1, height: 11, background: '#f1f5f9', borderRadius: 6 }} />
                      <div style={{ width: 56, height: 11, background: '#f1f5f9', borderRadius: 6 }} />
                    </div>
                  ))}
                </div>
              ) : quotations.length === 0 ? (
                <div style={{ padding: '36px 18px', textAlign: 'center' }}>
                  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#e2e8f0" strokeWidth="1.4" style={{ margin: '0 auto 10px', display: 'block' }} strokeLinecap="round" strokeLinejoin="round"><path d="M9 12h6m-6 4h6m2 5H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5.586a1 1 0 0 1 .707.293l5.414 5.414a1 1 0 0 1 .293.707V19a2 2 0 0 1-2 2z"/></svg>
                  <p style={{ color: '#94a3b8', fontSize: 13, margin: '0 0 10px' }}>No quotations yet</p>
                  <button onClick={() => go()} style={{ fontSize: 12, color: '#4f46e5', fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer' }}>Start browsing →</button>
                </div>
              ) : (
                <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                  {quotations.slice(0, 5).map((q, i) => (
                    <li key={q.name}>
                      <a
                        href={getErpDeskQuotationUrl(q.name)}
                        target="_blank" rel="noreferrer"
                        style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10, padding: '12px 18px', borderBottom: i < 4 ? '1px solid #f8fafc' : 'none', textDecoration: 'none', transition: 'background 0.15s' }}
                        onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                      >
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                            <span style={{ fontSize: 12, fontWeight: 700, color: '#0f172a', fontFamily: 'monospace' }}>{q.name}</span>
                            <StatusBadge status={q.status} />
                          </div>
                          {q.customer_name && <p style={{ fontSize: 11, color: '#64748b', margin: '0 0 2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{q.customer_name}</p>}
                          <p style={{ fontSize: 10, color: '#94a3b8', margin: 0 }}>
                            {q.creation ? new Date(q.creation).toLocaleDateString('en-AE', { day: 'numeric', month: 'short', year: '2-digit' }) : ''}
                          </p>
                        </div>
                        <p style={{ fontSize: 13, fontWeight: 800, color: '#0f172a', flexShrink: 0, margin: 0 }}>
                          AED {parseFloat(q.grand_total || 0).toLocaleString('en-AE', { minimumFractionDigits: 2 })}
                        </p>
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
