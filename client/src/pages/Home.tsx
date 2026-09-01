/**
 * Redacted Noir / reference-led homepage.
 * This file deliberately keeps the homepage to one cinematic hero: all deeper
 * event details live behind the persistent top navigation routes.
 */
import { useEffect, useState } from "react";
import { ArrowDownRight, ArrowUpRight, Menu, X } from "lucide-react";

const githubAsset = (filename: string) =>
  `https://raw.githubusercontent.com/ziedaffes23/tedxthyna/main/${filename}?v=f8febb8`;

const mark = githubAsset("tedx-thyna-mark.png");
const heroImage = githubAsset("tedx-thyna-hero.jpg");
const boardImage = githubAsset("tedx-thyna-board.jpg");

const navigation = [
  ["MISSION", "/mission"],
  ["THE MINDS", "/minds"],
  ["THE SCENE", "/scene"],
  ["AGENDA", "/agenda"],
  ["ORGANIZATION", "/organization"],
];

export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const closeMenu = () => setMenuOpen(false);

  return (
    <div className="site-shell reference-home">
      <nav className={`top-nav ${scrolled ? "is-scrolled" : ""}`} aria-label="Primary navigation">
        <a className="brand" href="/" onClick={closeMenu} aria-label="TEDx Thyna home">
          <img src={mark} alt="TEDx Thyna mark" />
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
        <section
          className="hero scene reference-hero"
          style={{ backgroundImage: `linear-gradient(90deg, rgba(5,5,5,.94) 0%, rgba(5,5,5,.54) 55%, rgba(5,5,5,.48)), url(${heroImage})` }}
        >
          <div className="hero-light" />
          <div className="hero-copy">
            <div className="eyebrow"><span className="status-dot" />CASE Nº TX-2026 / SFAX / ACTIVE</div>
            <h1>TEDx<br /><span>THYNA</span></h1>
            <p className="hero-tagline">THE MISSION<br /><em>BEGINS.</em></p>
            <p className="hero-support">An idea can change everything.<br />What happens when a city decides to investigate?</p>
            <div className="hero-actions">
              <a className="button button-red" href="/organization">ENTER THE ORGANIZATION <ArrowUpRight size={16} /></a>
              <a className="text-link" href="/mission">DISCOVER THE MISSION <ArrowDownRight size={17} /></a>
            </div>
          </div>
          <div className="hero-location">
            <span className="mono">LOCATION IDENTIFIED</span>
            <strong>THÉÂTRE MUNICIPAL<br />DE SFAX</strong>
            <span>PQM7+J55 · SFAX, TUNISIA</span>
          </div>
          <div className="hero-index mono">01 <span>—</span> ACCESS</div>
        </section>

        <section id="board" className="board-section section-pad reference-board">
          <div className="section-kicker"><span>03 / INVESTIGATION BOARD</span><span className="line" /></div>
          <div className="board-frame" style={{ backgroundImage: `linear-gradient(90deg, rgba(5,5,5,.78), rgba(5,5,5,.26)), url(${boardImage})` }}>
            <div className="board-head"><span className="mono red">EVIDENCE MAP / LIVE</span><h2>Everything<br /><em>connects.</em></h2></div>
            <div className="clue-map">
              {[["TEDx THYNA", "ORIGIN"], ["THE MINDS", "LINKED"], ["IDEAS", "LINKED"], ["THE SCENE", "LINKED"], ["THE MISSION", "PURPOSE"]].map(([clue, status], i) => <div key={clue} className={`clue clue-${i}`}><span>{String(i + 1).padStart(2, "0")}</span><b>{clue}</b><small>{status}</small></div>)}
            </div>
            <div className="board-thread thread-one" /><div className="board-thread thread-two" /><div className="board-thread thread-three" />
            <div className="board-caption mono">SELECT A CLUE TO CONTINUE THE INVESTIGATION</div>
          </div>
        </section>
      </main>
    </div>
  );
}
