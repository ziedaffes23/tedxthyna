import { AnimatePresence, motion } from "framer-motion";
import { ArrowUpRight, Check, Copy, Instagram, Linkedin, Mail, MapPin, Minus, Plus, Send } from "lucide-react";
import { useState, type FormEvent } from "react";
import { EVENT, TEAM } from "@/data/site";
import { Chars, EASE_OUT, Lines, Reveal } from "@/components/site/motion";
import { NextFile, Page } from "@/components/site/Page";
import { Palms, PosterName, Torn } from "@/components/site/Poster";
import { useIntroDone } from "@/components/site/intro";

/** Each subject is routed to the team member who handles it. */
const TOPICS = [
  { label: "General question", who: TEAM[4] },
  { label: "Partnership & sponsoring", who: TEAM[0] },
  { label: "Press & speakers", who: TEAM[1] },
  { label: "Attendees & volunteering", who: TEAM[2] },
  { label: "Logistics", who: TEAM[3] },
];

const FAQ = [
  {
    q: "When and where is TEDx Thyna Youth?",
    a: `${EVENT.dateLabel}, from 10:00 to 20:00, at the ${EVENT.venue} — ${EVENT.address}.`,
  },
  {
    q: "How do I get a ticket?",
    a: "Register on register.tedxthyna.com. The General Pass costs 40 TND — pay by card, e-DINAR, Flouci, D17 or bank transfer. Once your payment is confirmed you get your pass with a personal ticket number — download it and show it at the entrance.",
  },
  {
    q: "I registered but lost my ticket.",
    a: "Go back to register.tedxthyna.com, open “I already registered” and enter the email you used. Your pass comes right back.",
  },
  {
    q: "Can my company partner with the event?",
    a: "Yes — choose “Partnership & sponsoring” in the form and our Head of Partnerships will reply directly.",
  },
];

function CopyEmail() {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      className="ct-copy mono"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(EVENT.email);
          setDone(true);
          window.setTimeout(() => setDone(false), 1800);
        } catch {
          window.location.href = `mailto:${EVENT.email}`;
        }
      }}
    >
      {done ? <Check size={13} /> : <Copy size={13} />} {done ? "Copied" : "Copy"}
    </button>
  );
}

export default function Contact() {
  const ready = useIntroDone();
  const [topic, setTopic] = useState(0);
  const [sent, setSent] = useState(false);
  const [open, setOpen] = useState<number | null>(0);
  const who = TOPICS[topic].who;

  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const d = new FormData(e.currentTarget);
    const subject = encodeURIComponent(`[${TOPICS[topic].label}] TEDx Thyna Youth — ${d.get("name")}`);
    const body = encodeURIComponent(`${d.get("message")}\n\n—\n${d.get("name")}\n${d.get("email")}${d.get("phone") ? `\n${d.get("phone")}` : ""}`);
    const cc = who.email === EVENT.email ? "" : `&cc=${encodeURIComponent(EVENT.email)}`;
    window.location.href = `mailto:${who.email}?subject=${subject}&body=${body}${cc}`;
    setSent(true);
  };

  return (
    <Page title="Contact — TEDx Thyna Youth 2026">
      <main className="contact-page theme-paper">
        {/* ───── hero ───── */}
        <header className="ct-hero">
          <svg className="hero-arc" viewBox="0 0 1440 700" preserveAspectRatio="none" aria-hidden>
            <motion.path d="M-40 420 C 320 300, 640 620, 1000 460 S 1380 300, 1500 360" initial={{ pathLength: 0 }} animate={ready ? { pathLength: 1 } : undefined} transition={{ duration: 2.2, delay: 0.4, ease: EASE_OUT }} />
          </svg>
          <div className="ct-hero-copy">
            <motion.span className="script ct-script" initial={{ opacity: 0, x: -20 }} animate={ready ? { opacity: 1, x: 0 } : undefined} transition={{ delay: 0.2, duration: 1, ease: EASE_OUT }}>
              Get in touch
            </motion.span>
            <h1 className="ct-title" aria-label="Start a conversation">
              <span className="ct-row">
                <Chars text="Start a" play={ready} delay={0.3} />
              </span>
              <span className="ct-row is-red">
                <Chars text="conversation." play={ready} delay={0.5} stagger={0.03} />
              </span>
            </h1>
            <motion.p className="ct-lead" initial={{ opacity: 0, y: 20 }} animate={ready ? { opacity: 1, y: 0 } : undefined} transition={{ delay: 0.9, duration: 1, ease: EASE_OUT }}>
              A question, an idea, a partnership? Your message goes straight to the person in the team who can answer it.
            </motion.p>
          </div>
          <motion.div className="ct-collage" aria-hidden initial={{ opacity: 0, scale: 0.94, rotate: 2 }} animate={ready ? { opacity: 1, scale: 1, rotate: 0 } : undefined} transition={{ duration: 1.4, delay: 0.3, ease: EASE_OUT }}>
            <span className="ct-block is-dark" />
            <span className="ct-block is-red" />
            <div className="ct-logo">
              <img src="/media/logo.webp" alt="" />
            </div>
            <Palms className="ct-palms" />
            <div className="ct-stamp mono">
              Response
              <br />
              within 48h
            </div>
          </motion.div>
          <Torn side="under" seed={17} />
        </header>

        {/* ───── form + channels ───── */}
        <section className="ct-main">
          <Reveal className="ct-card">
            <span className="script ct-card-script">Write to us</span>
            <form className="ct-form" onSubmit={submit}>
              <fieldset className="ct-field">
                <legend className="mono">What is it about?</legend>
                <div className="chips">
                  {TOPICS.map((t, i) => (
                    <label key={t.label} className={`chip ${topic === i ? "is-on" : ""}`}>
                      <input type="radio" name="topic" checked={topic === i} onChange={() => setTopic(i)} />
                      {t.label}
                    </label>
                  ))}
                </div>
              </fieldset>

              <AnimatePresence mode="wait">
                <motion.div key={who.email} className="ct-route" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.3 }}>
                  <span className="ct-route-badge">
                    {who.name
                      .split(" ")
                      .filter((_, i, a) => i === 0 || i === a.length - 1)
                      .map((p) => p[0])
                      .join("")}
                  </span>
                  <span>
                    <small className="mono">Your message goes to</small>
                    <b>{who.name}</b> · {who.role}
                  </span>
                </motion.div>
              </AnimatePresence>

              <div className="ct-row2">
                <label className="ct-field">
                  <span className="mono">Name</span>
                  <input name="name" required autoComplete="name" placeholder="Your full name" />
                </label>
                <label className="ct-field">
                  <span className="mono">Email</span>
                  <input name="email" type="email" required autoComplete="email" placeholder="you@example.com" />
                </label>
              </div>
              <label className="ct-field">
                <span className="mono">Phone (optional)</span>
                <input name="phone" type="tel" autoComplete="tel" placeholder="+216 …" />
              </label>
              <label className="ct-field">
                <span className="mono">Message</span>
                <textarea name="message" required rows={5} placeholder="Tell us what is on your mind…" />
              </label>
              <button className="btn btn-red btn-wide" type="submit" data-cursor="Send">
                <span className="btn-fill" />
                <span className="btn-label">{sent ? "Opening your email app…" : "Send message"}</span>
                <Send size={16} />
              </button>
              <p className="ct-note">Sending opens your email app with everything filled in — just press send.</p>
            </form>
            <Torn side="bottom" seed={29} className="ct-card-torn" />
          </Reveal>

          <aside className="ct-side">
            <Reveal className="ct-channel is-mail">
              <Mail size={20} />
              <div>
                <small className="mono">Email</small>
                <a href={`mailto:${EVENT.email}`}>{EVENT.email}</a>
              </div>
              <CopyEmail />
            </Reveal>
            <Reveal delay={0.06}>
              <a className="ct-channel" href={EVENT.instagram} target="_blank" rel="noreferrer" data-cursor="Follow">
                <Instagram size={20} />
                <div>
                  <small className="mono">Instagram</small>
                  <span>@tedxthyna</span>
                </div>
                <ArrowUpRight size={18} className="ct-arrow" />
              </a>
            </Reveal>
            <Reveal delay={0.12}>
              <a className="ct-channel" href={EVENT.linkedin} target="_blank" rel="noreferrer" data-cursor="Follow">
                <Linkedin size={20} />
                <div>
                  <small className="mono">LinkedIn</small>
                  <span>TEDxThyna Youth</span>
                </div>
                <ArrowUpRight size={18} className="ct-arrow" />
              </a>
            </Reveal>
            <Reveal delay={0.18}>
              <a className="ct-channel is-venue" href={EVENT.mapsUrl} target="_blank" rel="noreferrer" data-cursor="Map">
                <MapPin size={20} />
                <div>
                  <small className="mono">Venue · {EVENT.dateLabel}</small>
                  <span>{EVENT.venue}</span>
                  <em>{EVENT.address}</em>
                </div>
                <ArrowUpRight size={18} className="ct-arrow" />
              </a>
            </Reveal>
            <Reveal delay={0.24} className="ct-ticket">
              <PosterName first="Need a" last="ticket?" />
              <a className="btn-link mono" href={EVENT.registerUrl}>
                register.tedxthyna.com <ArrowUpRight size={14} />
              </a>
            </Reveal>
          </aside>
        </section>

        {/* ───── FAQ ───── */}
        <section className="ct-faq">
          <div className="ct-faq-head">
            <span className="script lineup-script">Before you write</span>
            <Lines as="h2" className="display lineup-title">
              <span>Quick</span>
              <em>answers.</em>
            </Lines>
          </div>
          <ul className="ct-faq-list">
            {FAQ.map((f, i) => (
              <li key={f.q} className={open === i ? "is-open" : ""}>
                <button type="button" aria-expanded={open === i} onClick={() => setOpen(open === i ? null : i)}>
                  <span>{f.q}</span>
                  {open === i ? <Minus size={18} /> : <Plus size={18} />}
                </button>
                <AnimatePresence initial={false}>
                  {open === i && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.4, ease: EASE_OUT }} className="ct-faq-a">
                      <p>{f.a}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </li>
            ))}
          </ul>
          <Torn side="under" seed={31} />
        </section>
      </main>
      <NextFile current="/contact" />
    </Page>
  );
}
