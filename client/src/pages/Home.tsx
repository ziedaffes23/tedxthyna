import { useEffect, useState } from "react";
import { ArrowDownRight, ArrowUpRight, Menu, X } from "lucide-react";

const asset = (name: string) => `https://raw.githubusercontent.com/ziedaffes23/tedxthyna/main/${name}?v=f8febb8`;
const logo = "/tedx-thyna-wordmark.png";
const navigation = [["MISSION", "/mission"], ["THE MINDS", "/minds"], ["THE SCENE", "/scene"], ["AGENDA", "/agenda"], ["CONTACT", "/contact"]];

function ClassifiedIntro({ onFinish }: { onFinish: () => void }) {
  const [leaving, setLeaving] = useState(false);
  useEffect(() => { const timer = window.setTimeout(() => { setLeaving(true); window.setTimeout(onFinish, 650); }, 4800); return () => window.clearTimeout(timer); }, [onFinish]);
  const finish = () => { setLeaving(true); window.setTimeout(onFinish, 300); };
  return <section className={`classified-intro ${leaving ? "is-leaving" : ""}`} aria-label="Opening case file">
    <div className="intro-tech intro-tech-top">CASE STATUS / ACTIVE<br />ACCESS / GRANTED</div><div className="intro-tech intro-tech-bottom">LOCATION / TUNISIA<br />FILE / TX-026</div>
    <div className="intro-center"><span className="intro-label">TEDx THYNA</span><span className="intro-file">CASE FILE / TX-026</span><span className="intro-red-line" /><span className="intro-stamp">CONFIDENTIAL</span><h1>THE INVESTIGATION<br /><em>BEGINS.</em></h1><span className="intro-entering">ENTERING ARCHIVE...</span></div>
    <button className="intro-skip" onClick={finish}>SKIP INTRO <ArrowUpRight size={13} /></button>
  </section>;
}

export default function Home() {
  const [intro, setIntro] = useState(true); const [menu, setMenu] = useState(false);
  return <div className="reference-home-v2">
    {intro && <ClassifiedIntro onFinish={() => setIntro(false)} />}
    <header className="reference-header"><a href="/" className="reference-brand"><img src={logo} alt="TEDx Thyna" /></a><nav className="reference-nav">{navigation.map(([label, href]) => <a href={href} key={href}>{label}</a>)}<a className="reference-register" href="/register">REGISTER <ArrowUpRight size={14} /></a></nav><button className="reference-menu" onClick={() => setMenu(!menu)} aria-label="Toggle navigation">{menu ? <X /> : <Menu />}</button></header>
    {menu && <div className="reference-mobile-menu">{navigation.map(([label, href]) => <a href={href} key={href} onClick={() => setMenu(false)}>{label}<ArrowUpRight size={14} /></a>)}<a href="/register">REGISTER <ArrowUpRight size={14} /></a></div>}
    <main>
      <section className="reference-hero-v2"><div className="hero-orbit orbit-one" /><div className="hero-orbit orbit-two" /><div className="hero-grid-mark-v2" /><div className="hero-side-label">01 / THE INVESTIGATION</div><div className="hero-main-copy"><p className="reference-kicker"><i /> CASE NO. TX-026</p><h1>THE<br />CASE<br />IS<br /><em>OPEN.</em></h1></div><div className="hero-support-copy"><p>Some stories are meant to be discovered.<br />Some questions are meant to be asked.</p><strong>TEDx Thyna 2026</strong><a className="outline-cta" href="#story">ENTER THE INVESTIGATION <ArrowUpRight size={15} /></a></div><div className="hero-stamp">CASE<br />ACTIVE</div><div className="hero-bottom-meta"><span>THÉÂTRE MUNICIPAL DE SFAX</span><span>15 NOVEMBER 2026</span><a href="#story">SCROLL TO DISCOVER <ArrowDownRight size={14} /></a></div></section>
      <section className="story-preview" id="story"><div className="story-intro"><span className="reference-kicker">02 / THE STORY</span><h2>THE STORY HAS<br />MORE THAN <em>ONE SIDE.</em></h2><p>Every great idea begins as a secret worth sharing. Follow the questions, the people, and the place behind TEDx Thyna.</p></div><div className="story-links"><a href="/minds"><span className="story-index">01</span><span><b>THE MINDS</b><small>Who is behind the story?</small></span><ArrowUpRight /></a><a href="/scene"><span className="story-index">02</span><span><b>THE SCENE</b><small>Where did it happen?</small></span><ArrowUpRight /></a><a href="/mission"><span className="story-index">03</span><span><b>THE EVIDENCE</b><small>What was left behind?</small></span><ArrowUpRight /></a></div></section>
      <section className="reference-final-cta"><span className="reference-kicker">03 / THE NEXT MOVE</span><h2>ARE YOU READY TO<br /><em>UNCOVER THE STORY?</em></h2><a className="outline-cta dark-cta" href="/register">DISCOVER TEDx THYNA <ArrowUpRight size={15} /></a></section>
    </main>
    <footer className="reference-footer"><div><span className="reference-brand footer-brand"><img src={logo} alt="TEDx Thyna" /></span><p>CASE FILE / TX-026<br />STATUS / ACTIVE</p></div><div className="footer-social"><a href="/mission">Mission</a><a href="https://www.instagram.com/tedxthyna/" target="_blank" rel="noreferrer">Instagram</a><a href="/contact">Contact</a><span>© 2026 TEDx Thyna Youth</span></div></footer>
  </div>;
}
