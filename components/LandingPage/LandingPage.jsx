import { useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import { useSelector } from 'react-redux';
import styles from './LandingPage.module.scss';

const PRODUCT_NODES = [
  { src: '/landing-products/p1.png',  x: 0.08, y: 0.22, w: 170, h: 170, period: 5.8, phase: 0.0, parallax: 1.0 },
  { src: '/landing-products/p4.png',  x: 0.27, y: 0.78, w: 130, h: 130, period: 4.9, phase: 1.6, parallax: 0.7 },
  { src: '/landing-products/p2.png',  x: 0.86, y: 0.18, w: 120, h: 120, period: 6.4, phase: 2.3, parallax: 1.2 },
  { src: '/landing-products/p9.png',  x: 0.92, y: 0.48, w: 150, h: 150, period: 5.3, phase: 0.9, parallax: 1.1 },
  { src: '/landing-products/p6.png',  x: 0.04, y: 0.62, w: 110, h: 130, period: 5.6, phase: 3.0, parallax: 0.8 },
  { src: '/landing-products/p10.png', x: 0.72, y: 0.86, w: 145, h: 145, period: 4.6, phase: 2.0, parallax: 1.0 },
  { src: '/landing-products/p5.png',  x: 0.55, y: 0.08, w: 110, h: 110, period: 6.1, phase: 4.1, parallax: 0.9 },
];

export default function LandingPage() {
  const router = useRouter();
  const user = useSelector(s => s.logInInfo?.customerInfo);
  const navRef = useRef(null);
  const heroRef = useRef(null);

  // Scroll shadow on nav
  useEffect(() => {
    const nav = navRef.current;
    if (!nav) return;
    const onScroll = () => nav.classList.toggle(styles.scrolled, window.scrollY > 4);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Animations — injected as plain scripts to exactly match the reference HTML behaviour
  useEffect(() => {
    const hero = heroRef.current;
    if (!hero) return;

    // ── canvas ──────────────────────────────────────────────────────────────
    const canvas = document.createElement('canvas');
    canvas.id = '__lp_particles';
    Object.assign(canvas.style, {
      position: 'absolute', inset: '0', width: '100%', height: '100%',
      zIndex: '0', pointerEvents: 'none',
    });
    // globals.scss has `canvas { display: none !important }` — override it with an
    // important inline rule so the particle field is actually visible.
    canvas.style.setProperty('display', 'block', 'important');
    hero.prepend(canvas);

    // ── product-bg ──────────────────────────────────────────────────────────
    const bg = document.createElement('div');
    bg.id = '__lp_bg';
    Object.assign(bg.style, {
      position: 'absolute', inset: '0', zIndex: '1',
      pointerEvents: 'none', overflow: 'hidden',
    });
    hero.insertBefore(bg, hero.children[1]);

    // ── product cards ────────────────────────────────────────────────────────
    const PEAK = 0.55, TROUGH = 0.05;
    const items = PRODUCT_NODES.map(n => {
      const card = document.createElement('div');
      Object.assign(card.style, {
        position: 'absolute', left: '0', top: '0',
        width: n.w + 'px', height: n.h + 'px',
        background: '#fff',
        border: '1px solid rgba(10,10,10,0.06)',
        boxShadow: '0 1px 2px rgba(10,10,10,0.04),0 8px 24px -10px rgba(10,10,10,0.10),0 24px 60px -28px rgba(10,10,10,0.18)',
        padding: '14px', opacity: '0',
        transform: 'translate(-50%,-50%)',
        willChange: 'opacity,transform', userSelect: 'none',
      });
      const img = document.createElement('img');
      Object.assign(img.style, {
        display: 'block', width: '100%', height: '100%',
        objectFit: 'contain', filter: 'contrast(0.97)', pointerEvents: 'none',
      });
      img.src = n.src; img.alt = ''; img.draggable = false;
      card.appendChild(img);
      bg.appendChild(card);
      return { ...n, card, _x: 0, _y: 0 };
    });

    function placeAll() {
      const rect = hero.getBoundingClientRect();
      const W = rect.width  || window.innerWidth;
      const H = rect.height || window.innerHeight;
      items.forEach(it => { it._x = W * it.x; it._y = H * it.y; });
    }
    placeAll();
    let rto; const onResize2 = () => { clearTimeout(rto); rto = setTimeout(placeAll, 80); };
    window.addEventListener('resize', onResize2);

    const t0cards = performance.now();
    let cardRaf;
    function cardFrame(now) {
      const t = (now - t0cards) / 1000;
      for (const it of items) {
        const u = (Math.sin((t / it.period) * Math.PI * 2 + it.phase) + 1) * 0.5;
        const e = u * u * (3 - 2 * u);
        it.card.style.opacity = (TROUGH + (PEAK - TROUGH) * e).toFixed(3);
        it.card.style.transform =
          `translate(-50%,-50%) translate(${(it._x + Math.cos(t * 0.40 + it.phase * 1.2) * 4 * it.parallax).toFixed(1)}px,${(it._y + Math.sin(t * 0.55 + it.phase * 1.7) * 8 * it.parallax).toFixed(1)}px) scale(${(0.94 + e * 0.08).toFixed(3)})`;
      }
      cardRaf = requestAnimationFrame(cardFrame);
    }
    cardRaf = requestAnimationFrame(cardFrame);

    // ── particle field ────────────────────────────────────────────────────────
    const PALETTE = ['#3B6FC9','#C24A4A','#C99B2A','#7A52C2','#C9722E'];
    const ctx = canvas.getContext('2d', { alpha: true });
    let DPR = Math.min(window.devicePixelRatio || 1, 2);
    let W = 0, H = 0, CX = 0, CY = 0, FIELD_R = 0, RADIUS = 0, RADIUS_SQ = 0;
    const EXCL = 40, MAX_PULL = 55, REACT = 0.06;
    let particles = [], particlesRunning = true;
    const mouse = { x:-9999,y:-9999,sx:-9999,sy:-9999,active:false };
    const prefRed = window.matchMedia('(prefers-reduced-motion:reduce)').matches;

    function innerR() { return Math.min(W,H)*0.18; }
    function rand(a,b) { return a+Math.random()*(b-a); }
    function pick(a) { return a[(Math.random()*a.length)|0]; }

    function makePt() {
      const ir = innerR(), depth = Math.pow(Math.random(),1.1);
      return {
        baseAngle: Math.random()*Math.PI*2,
        baseRadius: ir + Math.sqrt(Math.random())*(FIELD_R-ir),
        depth, size: 2.5+depth*2.5+Math.random()*0.5,
        color: pick(PALETTE),
        restOpacity: 0.40+depth*0.20, peakOpacity: 0.88,
        morphPhase: Math.random()*Math.PI*2,
        morphPeriod: rand(6,10), maxAspect: rand(1.4,1.9),
        baseRot: Math.random()*Math.PI,
        driftAmp: 4+depth*6,
        driftFx: rand(0.10,0.30), driftFy: rand(0.10,0.30),
        driftPx: Math.random()*Math.PI*2, driftPy: Math.random()*Math.PI*2,
        offsetX:0, offsetY:0, force:0,
      };
    }

    function resize() {
      W = window.innerWidth; H = window.innerHeight;
      CX=W/2; CY=H/2;
      FIELD_R = Math.hypot(W,H)/2+40;
      RADIUS  = Math.hypot(W,H)*0.7; RADIUS_SQ=RADIUS*RADIUS;
      canvas.width  = Math.floor(W*DPR);
      canvas.height = Math.floor(H*DPR);
      ctx.setTransform(DPR,0,0,DPR,0,0);
      particles = Array.from({length: Math.round(Math.max(700,Math.min(1100,W*H/2000)))},makePt);
    }

    const t0p = performance.now();
    function step(now) {
      const t = (now-t0p)/1000;
      mouse.sx += (mouse.x-mouse.sx)*0.18;
      mouse.sy += (mouse.y-mouse.sy)*0.18;
      ctx.clearRect(0,0,W,H);
      const breathe = Math.sin(t*0.25)*0.02+1;
      const gRot = t*0.012+Math.sin(t*0.12)*0.03;
      const ir = innerR();

      for (const p of particles) {
        const angle = p.baseAngle+gRot+Math.sin(t*0.6+p.morphPhase)*0.02;
        const radius = p.baseRadius*breathe;
        let x = CX+Math.cos(angle)*radius, y = CY+Math.sin(angle)*radius;

        let tX=0,tY=0,force=0;
        if (mouse.active) {
          const dx=mouse.sx-x, dy=mouse.sy-y, dSq=dx*dx+dy*dy;
          if (dSq<RADIUS_SQ) {
            const d=Math.sqrt(dSq)||0.0001, ux=dx/d, uy=dy/d;
            if (d<EXCL) { const k=(EXCL-d)/EXCL; tX=-ux*(k*18+4); tY=-uy*(k*18+4); force=1; }
            else { const s_=((RADIUS-d)/(RADIUS-EXCL)); const s=s_*s_*(3-2*s_); tX=ux*MAX_PULL*s; tY=uy*MAX_PULL*s; force=s; }
          }
        }
        p.offsetX+=(tX-p.offsetX)*REACT; p.offsetY+=(tY-p.offsetY)*REACT; p.force=force;
        x+=p.offsetX+Math.sin(t*p.driftFx+p.driftPx)*p.driftAmp;
        y+=p.offsetY+Math.cos(t*p.driftFy+p.driftPy)*p.driftAmp;

        const tw=0.88+0.12*Math.sin(t*0.5+p.morphPhase);
        const inner=Math.min(1,Math.max(0,(radius-ir*0.6)/(ir*0.7)));
        const fadeOut=1-Math.pow(Math.min(1,radius/FIELD_R),3);
        const alpha=(p.restOpacity+(p.peakOpacity-p.restOpacity)*p.force)*tw*inner*fadeOut;
        if (alpha<=0.005) continue;

        const morph=(Math.sin(t/p.morphPeriod*Math.PI*2+p.morphPhase)+1)*0.5;
        let aspect=1+(p.maxAspect-1)*morph, rot=p.baseRot+t*0.05;
        if (p.force>0.05) {
          const mag=Math.hypot(p.offsetX,p.offsetY);
          if (mag>0.3) {
            let diff=Math.atan2(p.offsetY,p.offsetX)-rot;
            while(diff>Math.PI/2)diff-=Math.PI; while(diff<-Math.PI/2)diff+=Math.PI;
            rot+=diff*p.force; aspect+=p.force*0.9;
          }
        }
        const rx=p.size/2*aspect, ry=p.size/2;
        if (x<-rx-4||x>W+rx+4||y<-ry-4||y>H+ry+4) continue;
        ctx.globalAlpha=alpha; ctx.fillStyle=p.color;
        ctx.beginPath(); ctx.ellipse(x,y,rx,ry,rot,0,Math.PI*2); ctx.fill();
      }
      ctx.globalAlpha=1;
    }

    let pRaf;
    function pLoop(now) { if(!particlesRunning)return; step(now); pRaf=requestAnimationFrame(pLoop); }

    const onPM = e => {
      mouse.active=true; mouse.x=e.clientX; mouse.y=e.clientY;
      if(mouse.sx===-9999){mouse.sx=e.clientX;mouse.sy=e.clientY;}
    };
    const onPL = () => { mouse.active=false; mouse.x=-9999;mouse.y=-9999;mouse.sx=-9999;mouse.sy=-9999; };
    const onVC = () => {
      particlesRunning=!document.hidden&&!prefRed;
      if(particlesRunning) pRaf=requestAnimationFrame(pLoop);
    };
    let rto2; const onResize3=()=>{ clearTimeout(rto2);rto2=setTimeout(()=>{DPR=Math.min(window.devicePixelRatio||1,2);resize();},80); };

    window.addEventListener('pointermove',onPM,{passive:true});
    window.addEventListener('pointerleave',onPL,{passive:true});
    document.addEventListener('mouseleave',onPL);
    window.addEventListener('resize',onResize3);
    document.addEventListener('visibilitychange',onVC);

    // Defer first resize to next frame so layout is settled
    requestAnimationFrame(() => {
      resize();
      if (prefRed) { step(performance.now()); particlesRunning=false; }
      else pRaf = requestAnimationFrame(pLoop);
    });

    return () => {
      particlesRunning = false;
      cancelAnimationFrame(pRaf);
      cancelAnimationFrame(cardRaf);
      clearTimeout(rto); clearTimeout(rto2);
      window.removeEventListener('pointermove',onPM);
      window.removeEventListener('pointerleave',onPL);
      document.removeEventListener('mouseleave',onPL);
      window.removeEventListener('resize',onResize2);
      window.removeEventListener('resize',onResize3);
      document.removeEventListener('visibilitychange',onVC);
      canvas.remove(); bg.remove();
    };
  }, []);

  const initials = user?.full_name
    ? user.full_name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
    : 'IH';

  return (
    <div className={styles.root}>
      <nav className={styles.nav} ref={navRef}>
        <a href="#" className={styles.brand} aria-label="IHG home">
          <img src="/logo.png" alt="IHG" className={styles.brandLogo} />
          <span>Products App</span>
        </a>
        <div className={styles.navRight}>
          <a href="/profile" className={styles.userPill} aria-label="Account">
            <span className={styles.avatar} aria-hidden="true">{initials}</span>
            {user?.full_name && <span className={styles.uname}>{user.full_name}</span>}
          </a>
        </div>
      </nav>

      <section ref={heroRef} className={styles.hero}>
        {/* canvas & product-bg are injected by useEffect */}
        <div className={styles.heroInner}>
          <span className={styles.eyebrow}>
            <span className={styles.dot} aria-hidden="true" />
            Now with AI-powered search
          </span>

          <h1 className={styles.headline}>
            <span className={styles.headlineTitle}>Products App</span>
            <span className={styles.versionTag}>2.0</span>
          </h1>

          <p className={styles.sub}>
            One smart destination to explore every product &mdash; enhanced with AI for effortless search and discovery.
          </p>

          <div className={styles.ctas}>
            <button className={`${styles.cta} ${styles.ctaPrimary}`} onClick={() => router.push('/list')}>
              Explore Products
            </button>
          </div>

          <p className={styles.footnote}>Products App 2.0</p>
        </div>
      </section>
    </div>
  );
}
