/*
 * Redacted Noir: each route is a separate case-file tab, with asymmetry,
 * crimson signal accents, mono metadata, and the same visual evidence language.
 */
import { ArrowDownRight, ArrowUpRight, Copy, Instagram, Linkedin } from "lucide-react";
import { useState, type ReactNode } from "react";

const githubAsset = (filename: string) => `https://raw.githubusercontent.com/ziedaffes23/tedxthyna/main/${filename}?v=f8febb8`;
const mark = githubAsset("tedx-thyna-mark.png");
const heroImage = githubAsset("tedx-thyna-hero.jpg");
const boardImage = githubAsset("tedx-thyna-board.jpg");
const stageImage = githubAsset("tedx-thyna-stage.jpg");

const team = [
  ["01", "Abderrahmen Bouderbela", "Event President & Head of Partnerships", "+216 28 737 990"],
  ["02", "Khadija Kammoun", "Public Relations & Speaker Relations Specialist", "+216 99 988 304"],
  ["03", "Fatma Guermazi", "Social Media & Delegate Experience Specialist", "+216 55 680 377"],
  ["04", "Youssef Ayadi", "Head of Operations", "+216 50 650 013"],
  ["05", "Zied Affes", "Data & Information Specialist", "+216 54 051 117"],
  ["06", "Mohamed Aziz Mtimet", "Head of Finance & Legalities", "+216 92 662 991"],
];

function SiteNav() {
  const [menuOpen, setMenuOpen] = useState(false);
  return <><nav className="top-nav is-scrolled route-nav"><a className="brand" href="/"><img src={mark} alt="TEDx Thyna mark" /><span>TEDx <b>THYNA</b></span></a><div className="nav-links"><a href="/mission">MISSION</a><a href="/minds">THE MINDS</a><a href="/scene">THE SCENE</a><a href="/agenda">AGENDA</a><a href="/organization">ORGANIZATION</a><a className="nav-register" href="/register">REGISTER <ArrowUpRight size={14} /></a></div><button className="menu-toggle" onClick={() => setMenuOpen(!menuOpen)} aria-label="Open navigation">{menuOpen ? "×" : "☰"}</button></nav>{menuOpen && <div className="mobile-menu"><span className="mono red">CLEARANCE: OPEN</span><a href="/mission">MISSION <ArrowUpRight /></a><a href="/minds">THE MINDS <ArrowUpRight /></a><a href="/scene">THE SCENE <ArrowUpRight /></a><a href="/agenda">AGENDA <ArrowUpRight /></a><a href="/organization">ORGANIZATION <ArrowUpRight /></a><a href="/register">REGISTER <ArrowUpRight /></a></div>}</>;
}

function PageIntro({ number, label, title, lead }: { number: string; label: string; title: ReactNode; lead: string }) {
  return <header className="route-intro section-pad"><div className="section-kicker"><span>{number} / {label}</span><span className="line" /></div><div className="route-intro-grid"><div><span className="mono red">CASE Nº TX-2026 / SFAX / ACTIVE</span><h1>{title}</h1></div><p>{lead}</p></div></header>;
}

function Mission() {
  return <><PageIntro number="02" label="THE ORGANIZATION" title={<>Behind every idea<br />lies a <em>story.</em></>} lead="TEDx Thyna is more than a stage. It is a gathering of minds, ideas and people capable of changing the way we see the world." /><main className="route-body section-pad mission-route"><div className="evidence-note"><span className="stamp">FILE OPENED</span><p>And behind this event lies an organization.</p></div><div className="route-split"><p className="display-quote">Behind every story<br />lies a <em>network.</em></p><div className="route-panel"><span className="mono red">ACCESS PROTOCOL / 02</span><h2>Follow<br /><em>the signal.</em></h2><p>Every encounter leaves a trace. Every question opens a door.</p><a className="text-link" href="/minds">OPEN THE MINDS <ArrowDownRight size={17} /></a></div></div></main></>;
}

function Minds() {
  const dossiers = [["THE FUTURE / CLASSIFIED", heroImage], ["THE CITY / CLASSIFIED", boardImage], ["THE HUMAN / CLASSIFIED", stageImage]];
  return <><PageIntro number="04" label="THE MINDS" title={<>The people<br />behind the <em>signal.</em></>} lead="Three perspectives. One signal waiting to be revealed." /><main className="route-body section-pad minds-route"><div className="classified-strip"><span className="mono red">EVIDENCE INDEX / SPEAKER FILES</span><span className="mono">CLEARANCE: PENDING</span></div><div className="dossier-grid">{dossiers.map(([name, image], i) => <a key={name} className={`dossier-card dossier-route-card dossier-offset-${i}`} href="/register"><span className="dossier-number">CASE FILE 0{i + 1}</span><div className="dossier-image" style={{ backgroundImage: `linear-gradient(180deg, transparent 35%, rgba(5,5,5,.86)), url(${image})` }} /><span className="dossier-redact">██████████████</span><strong>{name}</strong><small>STATUS: TO BE REVEALED</small><ArrowUpRight /></a>)}</div></main></>;
}

function Organization() {
  const [active, setActive] = useState<string | null>(null);
  return <><PageIntro number="05" label="THE ORGANIZATION" title={<>Personnel<br /><em>files.</em></>} lead="The people behind the signal. A live operation in Sfax." /><main className="route-body section-pad organization-route"><div className="classified-strip"><span className="mono red">PERSONNEL INDEX / 06 FILES</span><span className="mono">STATUS: ACTIVE</span></div><div className="team-list">{team.map(([n, name, role, phone]) => <div className="team-file" key={n}><span className="team-number">{n}</span><div className="team-person"><span className="mono">PERSONNEL FILE {n}/06</span><strong>{name}</strong><small>{role}</small></div><div className="team-contact"><span className="mono">CONTACT</span><button className={active === phone ? "revealed" : ""} onClick={() => { navigator.clipboard?.writeText(phone); setActive(phone); window.setTimeout(() => setActive(null), 1200); }}>{active === phone ? phone : "████████████"}<Copy size={14} /></button></div><span className="team-status"><i /> ACTIVE</span></div>)}</div></main></>;
}

function Scene() {
  return <><PageIntro number="06" label="THE SCENE" title={<>The place<br />where ideas<br /><em>arrive.</em></>} lead="An address, a stage, a city waiting for the next signal." /><main className="route-body section-pad scene-route"><div className="scene-card"><div className="scene-photo" style={{ backgroundImage: `url(${stageImage})` }}><span className="stamp">LOCATION<br />IDENTIFIED</span></div><div className="scene-info"><span className="mono red">OPERATION SITE / SFAX</span><h2>THÉÂTRE<br /><em>MUNICIPAL</em><br />DE SFAX</h2><p>PQM7+J55<br />Sfax, Tunisia</p><div className="scene-data"><span>DATE <b>15 NOVEMBER 2026</b></span><span>TIME <b>TO BE ANNOUNCED</b></span></div><a className="text-link" href="https://maps.google.com/?q=Theatre+Municipal+de+Sfax" target="_blank" rel="noreferrer">OPEN LOCATION <ArrowUpRight size={17} /></a></div></div></main></>;
}

function Agenda() {
  return <><PageIntro number="04" label="THE AGENDA" title={<>The day<br />will be<br /><em>revealed.</em></>} lead="The programme is being assembled. The next signal will announce every moment." /><main className="route-body section-pad agenda-route"><div className="agenda-card"><span className="stamp">IN PREPARATION</span><span className="mono red">AGENDA / TX-2026</span><h2>WILL BE<br /><em>ANNOUNCED SOON.</em></h2><p>Talks, encounters and performances will appear here as soon as the programme is cleared.</p><a className="text-link" href="/register">REGISTER YOUR INTEREST <ArrowUpRight size={17} /></a></div></main></>;
}

function Register() {
  return <><PageIntro number="07" label="THE MISSION" title={<>Your seat<br />has been <em>identified.</em></>} lead="The operation is already in motion. Register your intent and enter the archive." /><main className="route-body section-pad register-route"><div className="register-panel"><div><span className="mono red">ACCESS PROTOCOL / 07</span><h2>Join the<br /><em>operation.</em></h2><p>Registration opens soon. Leave a signal and we will contact you.</p></div><a className="register-button" href="mailto:hello@tedxthyna.tn?subject=TEDx%20Thyna%20Registration">REGISTER NOW <ArrowUpRight size={22} /><small>ACCESS GRANTED</small></a></div><div className="route-footnote mono">FILE STATUS: ACTIVE / CASE Nº TX-2026 / THÉÂTRE MUNICIPAL DE SFAX</div></main></>;
}

export default function SectionPage({ section }: { section: "mission" | "minds" | "organization" | "scene" | "agenda" | "register" }) {
  const Page = { mission: Mission, minds: Minds, organization: Organization, scene: Scene, agenda: Agenda, register: Register }[section];
  return <div className="site-shell route-shell"><SiteNav /><aside className="case-rail"><span className="rail-vertical">TEDx THYNA / 2026</span><span className="rail-progress">{({ mission: "02", minds: "04", organization: "05", scene: "06", agenda: "04", register: "07" }[section])} <i /> 07</span></aside><Page /><footer className="footer"><div className="footer-brand"><img src={mark} alt="" /><span>TEDx <b>THYNA</b></span><p>THE MISSION DOESN'T<br />END HERE.</p></div><div className="footer-links"><span className="mono">TRANSMISSION CHANNELS</span><a href="#">Instagram <Instagram size={15} /></a><a href="#">LinkedIn <Linkedin size={15} /></a><a href="mailto:hello@tedxthyna.tn">Contact <ArrowUpRight size={15} /></a></div><div className="footer-meta mono">THÉÂTRE MUNICIPAL DE SFAX<br /><br />FILE STATUS: ACTIVE<br />CASE Nº: TX-2026</div></footer></div>;
}
