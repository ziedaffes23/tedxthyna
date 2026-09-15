import { useEffect, useState } from "react";
import { ArrowDownRight, ArrowUpRight, Mail, Menu, X } from "lucide-react";

const githubAsset = (filename: string) =>
  `https://raw.githubusercontent.com/ziedaffes23/tedxthyna/main/${filename}?v=f8febb8`;

const heroImage = githubAsset("tedx-thyna-hero.jpg");
const stageImage = githubAsset("tedx-thyna-stage.jpg");
const boardImage = githubAsset("tedx-thyna-board.jpg");
const logoImage = githubAsset("tedx-thyna-logo.png");

const navigation = [
  ["MISSION", "/mission"],
  ["THE MINDS", "/minds"],
  ["ORGANIZATION", "/organization"],
  ["THE SCENE", "/scene"],
  ["AGENDA", "/agenda"],
];

export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  const closeMenu = () => setMenuOpen(false);

  return (
    <div className="editorial-home">
      <nav className={`editorial-nav ${scrolled ? "is-scrolled" : ""}`}>
        <a className="editorial-brand" href="/" onClick={closeMenu} aria-label="TEDx Thyna home">
          <img src={logoImage} alt="" /><span>TEDx <b>THYNA</b></span>
        </a>
        <div className="editorial-links">
          {navigation.map(([label, href]) => <a key={href} href={href}>{label}</a>)}
          <a href="/contact">CONTACT <Mail size={14} /></a>
          <a className="editorial-register" href="/register">REGISTER <ArrowUpRight size={14} /></a>
        </div>
        <button className="editorial-menu" onClick={() => setMenuOpen((open) => !open)} aria-label="Toggle menu">
          {menuOpen ? <X /> : <Menu />}
        </button>
      </nav>
      {menuOpen && <div className="editorial-mobile-menu">{navigation.map(([label, href]) => <a key={href} href={href} onClick={closeMenu}>{label}<ArrowUpRight /></a>)}<a href="/contact" onClick={closeMenu}>CONTACT<Mail /></a><a href="/register" onClick={closeMenu}>REGISTER<ArrowUpRight /></a></div>}

      <main>
        <section className="editorial-hero">
          <div className="hero-copy-new">
            <p className="issue-label"><span>01</span> TEDx THYNA / SFAX / 2026</p>
            <h1>Ideas<br /><i>in motion.</i></h1>
            <p className="hero-deck">A new generation of voices is shaping what comes next. Meet them in the heart of Sfax.</p>
            <div className="hero-actions-new"><a className="primary-cta" href="/register">SAVE YOUR SEAT <ArrowUpRight size={17} /></a><a className="secondary-cta" href="#story">EXPLORE THE STORY <ArrowDownRight size={17} /></a></div>
          </div>
          <div className="hero-image-new" style={{ backgroundImage: `url(${heroImage})` }}><span className="image-tag">SFAX / 15.11.26</span><span className="image-caption">A stage for the next<br />conversation.</span></div>
          <div className="hero-side-note">THEME<br /><strong>THE NEXT<br />CHAPTER</strong></div>
          <div className="hero-bottom-line"><span>INDEPENDENTLY ORGANIZED TED EVENT</span><span>SCROLL TO DISCOVER ↓</span></div>
        </section>

        <section className="intro-editorial" id="story">
          <div className="section-number">02 / WHY TEDx THYNA</div>
          <div className="intro-statement"><p className="eyebrow-new">ONE CITY. MANY FUTURES.</p><h2>What if the<br /><em>next idea</em><br />starts here?</h2></div>
          <div className="intro-detail"><p>TEDx Thyna brings curious people together to share ideas worth spreading. From Sfax to everywhere, we are making room for brave questions, unexpected connections, and the people who move us forward.</p><a className="round-link" href="/mission">READ OUR MISSION <ArrowUpRight size={18} /></a></div>
        </section>

        <section className="feature-editorial">
          <div className="feature-image" style={{ backgroundImage: `url(${stageImage})` }}><span>03 / THE STAGE</span></div>
          <div className="feature-copy"><p className="eyebrow-new">THE SCENE</p><h2>Where a<br /><em>city</em><br />speaks.</h2><p>The historic Théâtre Municipal de Sfax becomes a meeting point for ideas, stories, and the energy of a city in motion.</p><a className="text-link-new" href="/scene">DISCOVER THE VENUE <ArrowUpRight size={17} /></a></div>
        </section>

        <section className="voices-editorial">
          <div><p className="eyebrow-new">04 / THE MINDS</p><h2>Fresh<br /><em>perspectives.</em></h2></div>
          <div className="voice-grid"><article><span>01</span><div className="voice-image" style={{ backgroundImage: `url(${boardImage})` }} /><h3>People who<br />question the usual.</h3></article><article><span>02</span><div className="voice-image" style={{ backgroundImage: `url(${heroImage})` }} /><h3>Stories that<br />stay with you.</h3></article><article><span>03</span><div className="voice-image" style={{ backgroundImage: `url(${stageImage})` }} /><h3>A room built<br />for possibility.</h3></article></div>
        </section>

        <section className="closing-editorial"><p className="eyebrow-new">15 NOVEMBER 2026 / SFAX, TUNISIA</p><h2>Be there for<br /><em>the next idea.</em></h2><a className="primary-cta" href="/register">REGISTER YOUR INTEREST <ArrowUpRight size={17} /></a></section>
      </main>
      <footer className="editorial-footer"><div className="footer-brand-new"><img src={logoImage} alt="TEDx Thyna" /><span>TEDx <b>THYNA</b></span></div><p>Ideas move us.<br />See you in Sfax.</p><div className="footer-links-new"><a href="https://www.instagram.com/tedxthyna/" target="_blank" rel="noreferrer">Instagram</a><a href="/contact">Contact</a><span>© 2026 TEDx Thyna</span></div></footer>
    </div>
  );
}
