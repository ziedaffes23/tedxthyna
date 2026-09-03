import { useEffect, useState } from "react";
import {
  ArrowDownRight,
  ArrowUpRight,
  CalendarDays,
  Clock3,
  Instagram,
  Linkedin,
  MapPin,
  Menu,
  X,
} from "lucide-react";

const githubAsset = (filename: string) =>
  `https://raw.githubusercontent.com/ziedaffes23/tedxthyna/main/${filename}?v=f8febb8`;

const heroImage = githubAsset("tedx-thyna-hero.jpg");
const boardImage = githubAsset("tedx-thyna-board.jpg");
const stageImage = githubAsset("tedx-thyna-stage.jpg");
const logoImage = githubAsset("tedx-thyna-logo.png");

const navigation = [
  ["MISSION", "#mission"],
  ["THE BOARD", "#board"],
  ["THE MINDS", "#minds"],
  ["THE SCENE", "#scene"],
  ["AGENDA", "#agenda"],
];

const speakers = [
  ["01", "THE FUTURE", "What happens when curiosity becomes a compass?"],
  ["02", "THE CITY", "The local stories that deserve a wider signal."],
  ["03", "THE HUMAN", "New ways to see the people beside us."],
];

const team = [
  ["01", "Abderrahmen Bouderbela", "EVENT PRESIDENT"],
  ["02", "Khadija Kammoun", "PUBLIC RELATIONS"],
  ["03", "Fatma Guermazi", "DELEGATE EXPERIENCE"],
  ["04", "Youssef Ayadi", "OPERATIONS"],
];

export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [introVisible, setIntroVisible] = useState(true);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const timer = window.setTimeout(() => setIntroVisible(false), reducedMotion ? 200 : 2600);
    return () => window.clearTimeout(timer);
  }, []);

  const closeMenu = () => setMenuOpen(false);
  const goTo = (href: string) => {
    closeMenu();
    document.querySelector(href)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="site-shell reference-home">
      {introVisible && (
        <section className="mobile-intro" aria-label="TEDx Thyna introduction">
          <div className="mobile-intro-grid" aria-hidden="true" />
          <div className="mobile-intro-scan" aria-hidden="true" />
          <div className="mobile-intro-content">
            <span className="mobile-intro-kicker"><i /> TRANSMISSION / 01</span>
            <img className="intro-logo" src={logoImage} alt="TEDx Thyna Youth" />
            <p className="mobile-intro-title">Ideas<br /><em>move us.</em></p>
            <p className="mobile-intro-copy">A new signal is coming from Sfax.<br />Step into the story.</p>
            <button className="mobile-intro-enter" onClick={() => setIntroVisible(false)}>ENTER THE EXPERIENCE <ArrowUpRight size={16} /></button>
          </div>
          <button className="mobile-intro-skip mono" onClick={() => setIntroVisible(false)}>SKIP INTRO <span>↗</span></button>
        </section>
      )}

      <nav className={`top-nav ${scrolled ? "is-scrolled" : ""}`} aria-label="Primary navigation">
        <a className="brand" href="#top" onClick={closeMenu} aria-label="TEDx Thyna home">
          <img src={logoImage} alt="" />
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
          {navigation.map(([label, href]) => <a key={href} href={href} onClick={() => goTo(href)}>{label} <ArrowUpRight /></a>)}
          <a href="/register" onClick={closeMenu}>REGISTER <ArrowUpRight /></a>
        </div>
      )}

      <aside className="case-rail" aria-label="Case progress">
        <span className="rail-vertical">TEDx THYNA / 2026</span>
        <span className="rail-progress">01 <i /> 07</span>
      </aside>

      <main id="top">
        <section className="hero scene reference-hero" style={{ backgroundImage: `linear-gradient(90deg, rgba(5,5,5,.95) 0%, rgba(5,5,5,.64) 50%, rgba(5,5,5,.28)), url(${heroImage})` }}>
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
              <a className="button button-red" href="#agenda">DISCOVER THE PROGRAMME <ArrowUpRight size={16} /></a>
              <a className="text-link" href="#mission">READ THE MISSION <ArrowDownRight size={17} /></a>
            </div>
          </div>
          <div className="hero-location"><span className="mono">LOCATION IDENTIFIED</span><strong>THÉÂTRE MUNICIPAL<br />DE SFAX</strong><span>PQM7+J55 · SFAX, TUNISIA</span></div>
          <div className="hero-index mono">01 <span>—</span> ACCESS</div>
          <a className="hero-scroll-cue mono" href="#mission" aria-label="Scroll to explore"><span />SCROLL TO EXPLORE</a>
        </section>

        <section id="mission" className="section-pad manifesto reveal-section">
          <div className="section-kicker"><span>02 / THE MISSION</span><span className="line" /></div>
          <div className="manifesto-layout">
            <div>
              <p className="display-quote">Ideas don't<br />just <em>happen.</em></p>
              <p className="display-quote offset">They <em>move</em><br />people.</p>
            </div>
            <div className="manifesto-copy"><span className="stamp">FILE OPENED</span><p>TEDx Thyna is a gathering of minds, ideas and people capable of changing the way we see the world.</p><p className="muted">This is not just a stage. It is a space to question, connect and leave with a different point of view.</p><a className="text-link" href="/mission">OPEN THE MISSION <ArrowUpRight size={16} /></a></div>
          </div>
        </section>

        <section id="board" className="section-pad board-section reveal-section">
          <div className="section-kicker"><span>03 / THE BOARD</span><span className="line" /></div>
          <div className="board-frame" style={{ backgroundImage: `linear-gradient(90deg, rgba(5,5,5,.86), rgba(5,5,5,.32)), url(${boardImage})` }}>
            <div className="board-head"><span className="mono red">EVIDENCE MAP / LIVE</span><h2>Everything<br /><em>connects.</em></h2></div>
            <div className="clue-map">{["THE MINDS", "THE CITY", "THE SCENE", "THE MISSION"].map((label, i) => <div key={label} className={`clue clue-${i}`}><span>0{i + 1}</span><b>{label}</b><small>LINKED</small></div>)}</div>
            <div className="board-thread thread-one" /><div className="board-thread thread-two" /><div className="board-caption mono">SELECT A CLUE TO CONTINUE THE INVESTIGATION</div>
          </div>
        </section>

        <section id="minds" className="section-pad board-section reveal-section">
          <div className="section-kicker"><span>04 / THE MINDS</span><span className="line" /></div>
          <div className="section-intro"><h2>People behind<br />the <em>signal.</em></h2><p>Three perspectives.<br />One idea in motion.</p></div>
          <div className="dossier-grid">{speakers.map(([number, title, copy], i) => <a className="dossier-card" key={number} href="/register"><span className="dossier-number">CASE FILE {number}</span><div className="dossier-image" style={{ backgroundImage: `linear-gradient(180deg, transparent 35%, rgba(5,5,5,.88)), url(${[heroImage, boardImage, stageImage][i]})` }} /><span className="dossier-redact">██████████████</span><strong>{title}</strong><small>{copy}</small><ArrowUpRight /></a>)}</div>
        </section>

        <section id="scene" className="section-pad scene-section reveal-section">
          <div className="section-kicker"><span>05 / THE SCENE</span><span className="line" /></div>
          <div className="scene-card"><div className="scene-photo" style={{ backgroundImage: `url(${stageImage})` }}><span className="stamp">LOCATION<br />IDENTIFIED</span></div><div className="scene-info"><span className="mono red">OPERATION SITE / SFAX</span><h2>THÉÂTRE<br /><em>MUNICIPAL</em><br />DE SFAX</h2><p>Where ideas arrive, meet and move forward.</p><div className="scene-data"><span>DATE <b>15 NOVEMBER 2026</b></span><span>TIME <b>TO BE ANNOUNCED</b></span></div><a className="text-link" href="https://maps.google.com/?q=Theatre+Municipal+de+Sfax" target="_blank" rel="noreferrer">OPEN LOCATION <ArrowUpRight size={17} /></a></div></div>
        </section>

        <section id="agenda" className="section-pad countdown-section reveal-section">
          <div className="countdown-copy"><span className="mono red">06 / THE AGENDA</span><h2>The day will<br /><em>be revealed.</em></h2><p>Talks, encounters and performances.<br />The next signal announces every moment.</p></div>
          <div className="countdown-grid"><div><strong>15</strong><span>DAY</span></div><div><strong>11</strong><span>MONTH</span></div><div><strong>26</strong><span>YEAR</span></div><div><strong>TX</strong><span>STATUS</span></div></div>
        </section>

        <section className="register-section reveal-section"><div className="register-inner"><div><span className="mono red">ACCESS PROTOCOL / 07</span><h2>Your seat<br />has been <em>identified.</em></h2><p>Register your interest and enter the archive.</p></div><a className="register-button" href="mailto:hello@tedxthyna.tn?subject=TEDx%20Thyna%20Registration">REGISTER NOW <ArrowUpRight size={22} /><small>ACCESS GRANTED</small></a></div></section>
      </main>

      <footer className="footer"><div className="footer-brand"><img src={logoImage} alt="TEDx Thyna Youth" /><span>TEDx <b>THYNA</b></span><p>THE MISSION DOESN'T<br />END HERE.</p></div><div className="footer-links"><span className="mono">TRANSMISSION CHANNELS</span><a href="#">Instagram <Instagram size={15} /></a><a href="#">LinkedIn <Linkedin size={15} /></a><a href="mailto:hello@tedxthyna.tn">Contact <ArrowUpRight size={15} /></a></div><div className="footer-meta mono"><MapPin size={13} /> THÉÂTRE MUNICIPAL DE SFAX<br /><br /><CalendarDays size={13} /> 15 NOVEMBER 2026<br /><br /><Clock3 size={13} /> FILE STATUS: ACTIVE</div></footer>
    </div>
  );
}
