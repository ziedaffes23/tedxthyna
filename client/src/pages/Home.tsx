/**
 * TEDx Thyna homepage.
 * The opening sequence is designed as a focused, responsive invitation into the event.
 */
import { useEffect, useState } from "react";
import { ArrowDownRight, ArrowUpRight, Menu, X } from "lucide-react";

const githubAsset = (filename: string) =>
  `https://raw.githubusercontent.com/ziedaffes23/tedxthyna/main/${filename}?v=f8febb8`;
const heroImage = githubAsset("tedx-thyna-hero.jpg");

const navigation = [
  ["MISSION", "/mission"],
  ["THE BOARD", "/board"],
  ["THE MINDS", "/minds"],
  ["THE SCENE", "/scene"],
  ["AGENDA", "/agenda"],
  ["ORGANIZATION", "/organization"],
];

export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [mobileIntroVisible, setMobileIntroVisible] = useState(true);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const timer = window.setTimeout(() => setMobileIntroVisible(false), reducedMotion ? 250 : 3400);
    return () => window.clearTimeout(timer);
  }, []);

  const closeMenu = () => setMenuOpen(false);
  const skipMobileIntro = () => setMobileIntroVisible(false);

  return (
    <div className="site-shell reference-home">
      {mobileIntroVisible && (
        <section className="mobile-intro" aria-label="TEDx Thyna introduction">
          <div className="mobile-intro-grid" aria-hidden="true" />
          <div className="mobile-intro-scan" aria-hidden="true" />
          <div className="mobile-intro-content">
            <span className="mobile-intro-kicker"><i /> MOBILE TRANSMISSION / 01</span>
            <div className="mobile-intro-wordmark">TEDx <b>THYNA</b></div>
            <p className="mobile-intro-title">Ideas<br /><em>move us.</em></p>
            <p className="mobile-intro-copy">A new signal is coming from Sfax.<br />Step into the story.</p>
            <button className="mobile-intro-enter" onClick={skipMobileIntro}>ENTER THE EXPERIENCE <ArrowUpRight size={16} /></button>
          </div>
          <button className="mobile-intro-skip mono" onClick={skipMobileIntro}>SKIP INTRO <span>↗</span></button>
        </section>
      )}
      <nav className={`top-nav ${scrolled ? "is-scrolled" : ""}`} aria-label="Primary navigation">
        <a className="brand" href="/" onClick={closeMenu} aria-label="TEDx Thyna home">
          <span>TEDx <b>THYNA</b></span>
        </a>
        <div className="nav-links">
          {navigation.map(([label, href]) => <a key={href} href={href}>{label}</a>)}
          <a className="nav-register" href="/register">REGISTER <ArrowUpRight size={14} /></a>
        </div>
        <button className="menu-toggle" onClick={() => setMenuOpen((open) => !open)} aria-label={menuOpen ? "Close navigation" : "Open navigation"} aria-expanded={menuOpen}>
          {menuOpen ? <X /> : <Menu />}
        </button>
      </nav>

      {menuOpen && (
        <div className="mobile-menu">
          <span className="mono red">CLEARANCE: OPEN</span>
          {navigation.map(([label, href]) => <a key={href} href={href} onClick={closeMenu}>{label} <ArrowUpRight /></a>)}
          <a href="/register" onClick={closeMenu}>REGISTER <ArrowUpRight /></a>
        </div>
      )}

      <aside className="case-rail" aria-label="Case progress">
        <span className="rail-vertical">TEDx THYNA / 2026</span>
        <span className="rail-progress">01 <i /> 07</span>
      </aside>

      <main id="top">
        <section className="hero scene reference-hero" style={{ backgroundImage: `linear-gradient(90deg, rgba(5,5,5,.94) 0%, rgba(5,5,5,.54) 55%, rgba(5,5,5,.48)), url(${heroImage})` }}>
          <div className="hero-light" />
          <div className="hero-grid-mark" aria-hidden="true"><span /><span /></div>
          <div className="hero-copy">
            <div className="eyebrow"><span className="status-dot" />SIGNAL DETECTED / SFAX / TX-2026</div>
            <div className="hero-title-wrap">
              <span className="hero-title-index mono">NO. 01 / ORIGIN</span>
              <h1>TEDx<br /><span>THYNA</span></h1>
            </div>
            <p className="hero-tagline">IDEAS<br /><em>MOVE US.</em></p>
            <p className="hero-support">One city. Many voices.<br className="hero-desktop-break" /> A stage for the ideas that move us forward.</p>
            <div className="hero-actions">
              <a className="button button-red" href="/agenda">DISCOVER THE PROGRAMME <ArrowUpRight size={16} /></a>
              <a className="text-link" href="/mission">READ THE MISSION <ArrowDownRight size={17} /></a>
            </div>
          </div>
          <div className="hero-location"><span className="mono">LOCATION IDENTIFIED</span><strong>THÉÂTRE MUNICIPAL<br />DE SFAX</strong><span>PQM7+J55 · SFAX, TUNISIA</span></div>
          <div className="hero-index mono">01 <span>—</span> ACCESS</div>
          <a className="hero-scroll-cue mono" href="#top" aria-label="Scroll to explore"><span />SCROLL TO EXPLORE</a>
        </section>
      </main>
    </div>
  );
}
