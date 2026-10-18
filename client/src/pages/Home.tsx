import { AnimatePresence, motion, useMotionValue, useMotionValueEvent, useReducedMotion, useScroll, useSpring, useTransform } from "framer-motion";
import { ArrowDownRight, ArrowUpRight, MapPin } from "lucide-react";
import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import { Link } from "wouter";
import { EVENT, FILES, img, speakerPhoto, speakerSlug, SPEAKERS, srcSet } from "@/data/site";
import { Palms, PosterName, Torn } from "@/components/site/Poster";
import { useIntroDone } from "@/components/site/intro";
import { Chars, EASE_OUT, Lines, Magnetic, Marquee, Reveal, RollingNumber, ScrollWords, useCountdown } from "@/components/site/motion";
import { Kicker, Page } from "@/components/site/Page";

function useMedia(query: string) {
  const [match, setMatch] = useState(() => typeof window !== "undefined" && window.matchMedia(query).matches);
  useEffect(() => {
    const mq = window.matchMedia(query);
    const on = () => setMatch(mq.matches);
    on();
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, [query]);
  return match;
}

/* ───────────────────────── 01 · HERO ───────────────────────── */

function Hero() {
  const ready = useIntroDone();
  const ref = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const titleY = useTransform(scrollYProgress, [0, 1], ["0%", "30%"]);
  const collageY = useTransform(scrollYProgress, [0, 1], ["0%", "-12%"]);
  const fade = useTransform(scrollYProgress, [0.55, 0.95], [1, 0]);
  const { days, hours, minutes, seconds } = useCountdown(EVENT.dateISO);
  const [current, setCurrent] = useState(0);
  const swipe = useRef(0);
  const go = (d: number) => setCurrent((c) => (c + d + SPEAKERS.length) % SPEAKERS.length);
  const s = SPEAKERS[current];

  // rotate speakers every 4s (restarts after a manual change)
  useEffect(() => {
    if (!ready || reduce) return;
    const t = window.setTimeout(() => setCurrent((c) => (c + 1) % SPEAKERS.length), 4000);
    return () => window.clearTimeout(t);
  }, [ready, reduce, current]);

  // preload only the next portrait, so first load stays light
  useEffect(() => {
    const im = new Image();
    im.src = speakerPhoto(SPEAKERS[(current + 1) % SPEAKERS.length].photo);
  }, [current]);

  // pointer depth for the collage layers
  const px = useMotionValue(0);
  const py = useMotionValue(0);
  const sx = useSpring(px, { stiffness: 60, damping: 18 });
  const sy = useSpring(py, { stiffness: 60, damping: 18 });
  const depth = (k: number) => ({ x: useTransform(sx, (v) => v * k), y: useTransform(sy, (v) => v * k) });
  const d1 = depth(-14);
  const d2 = depth(22);
  const d3 = depth(-30);
  const d4 = depth(10);


  return (
    <section
      ref={ref}
      className="hero theme-paper"
      onPointerMove={(e) => {
        if (reduce || e.pointerType !== "mouse") return;
        px.set(e.clientX / window.innerWidth - 0.5);
        py.set(e.clientY / window.innerHeight - 0.5);
      }}
    >
      <svg className="hero-arc" viewBox="0 0 1440 900" preserveAspectRatio="none" aria-hidden>
        <motion.path
          d="M-40 520 C 300 420, 620 760, 980 600 S 1380 380, 1500 460"
          initial={{ pathLength: 0 }}
          animate={ready ? { pathLength: 1 } : undefined}
          transition={{ duration: 2.4, delay: 0.6, ease: EASE_OUT }}
        />
        <motion.path
          d="M-40 760 C 400 700, 700 860, 1100 760 S 1400 700, 1500 720"
          initial={{ pathLength: 0 }}
          animate={ready ? { pathLength: 1 } : undefined}
          transition={{ duration: 2.4, delay: 0.9, ease: EASE_OUT }}
        />
      </svg>

      <motion.div className="hero-content" style={{ opacity: fade }}>
        <motion.div className="hero-top mono" initial={{ opacity: 0 }} animate={ready ? { opacity: 1 } : undefined} transition={{ delay: 0.9, duration: 1 }}>
          <span>
            <i className="blink-dot" /> TEDx Thyna Youth — 2026 edition
          </span>
          <span className="hide-sm">{EVENT.venueShort}</span>
          <span>{EVENT.dateShort}</span>
        </motion.div>

        <div className="hero-grid-main">
          <motion.div className="hero-copy" style={{ y: titleY }}>
            <motion.span className="script hero-script" initial={{ opacity: 0, x: -20 }} animate={ready ? { opacity: 1, x: 0 } : undefined} transition={{ delay: 0.2, duration: 1.2, ease: EASE_OUT }}>
              This year&apos;s theme
            </motion.span>
            <h1 className="hero-title" aria-label="Break the Pattern">
              <span className="ht-row ht-break">
                <Chars text="Break" play={ready} delay={0.25} stagger={0.06} />
              </span>
              <span className="ht-row ht-pattern">
                <span className="ht-the">
                  <Chars text="The" play={ready} delay={0.55} />
                </span>
                <Chars text="Pattern" play={ready} delay={0.65} stagger={0.05} />
              </span>
            </h1>
            <motion.div className="hero-intro" initial={{ opacity: 0, y: 30 }} animate={ready ? { opacity: 1, y: 0 } : undefined} transition={{ delay: 1.1, duration: 1.1, ease: EASE_OUT }}>
              <p>
                Eleven voices. One stage. On <b>{EVENT.dateLabel}</b>, Sfax gathers at the {EVENT.venue} to question what we take for granted.
              </p>
              <div className="hero-ctas">
                <Magnetic>
                  <a href={EVENT.registerUrl} className="btn btn-red" data-cursor="Join">
                    <span className="btn-fill" />
                    <span className="btn-label">Claim your seat</span>
                    <ArrowUpRight size={16} />
                  </a>
                </Magnetic>
                <Link href="/speakers" className="btn-link mono">
                  Meet the speakers <ArrowUpRight size={14} />
                </Link>
              </div>
            </motion.div>
          </motion.div>

          <motion.div className="hero-collage" style={{ y: collageY }} initial={{ opacity: 0, scale: 0.92, rotate: 3 }} animate={ready ? { opacity: 1, scale: 1, rotate: 0 } : undefined} transition={{ duration: 1.6, delay: 0.3, ease: EASE_OUT }}>
            <motion.div className="hc-city" style={d1}>
              <img src={img("sfax", 1000)} alt="" />
              <Torn side="bottom" seed={11} />
            </motion.div>
            <motion.span className="hc-block is-dark" style={d2} aria-hidden />
            <motion.span className="hc-block is-red" style={d3} aria-hidden />
            <motion.span className="hc-block is-red-sm" style={d1} aria-hidden />
            <motion.div style={d4} className="hc-palms-wrap" aria-hidden>
              <Palms className="hc-palms" />
            </motion.div>
            <div
              className="hc-frame"
              onClick={() => go(1)}
              onPointerDown={(e) => (swipe.current = e.clientX)}
              onPointerUp={(e) => {
                const dx = e.clientX - swipe.current;
                if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1);
              }}
              data-cursor="Next"
            >
              <AnimatePresence initial={false}>
                <motion.img
                  key={s.photo}
                  src={speakerPhoto(s.photo)}
                  alt={`${s.first} ${s.last}, ${s.label}`}
                  draggable={false}
                  initial={{ opacity: 0, scale: 1.08 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, transition: { duration: 0.6, delay: 0.3 } }}
                  transition={{ opacity: { duration: 0.9, ease: "easeOut" }, scale: { duration: 2.4, ease: EASE_OUT } }}
                />
              </AnimatePresence>
              <Torn side="bottom" seed={5} className="hc-torn" />
            </div>
            <div className="hc-caption" aria-live="polite">
              <AnimatePresence mode="wait" initial={false}>
                <motion.div key={s.photo} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.4, ease: EASE_OUT }}>
                  <span className="script">Meet Our {s.label}</span>
                  <PosterName first={s.first} last={s.last} />
                </motion.div>
              </AnimatePresence>
              <div className="hc-progress" role="tablist" aria-label="Speakers">
                {SPEAKERS.map((x, i) => (
                  <button
                    key={x.photo}
                    role="tab"
                    aria-selected={i === current}
                    aria-label={`${x.first} ${x.last}`}
                    className={i === current ? "is-on" : i < current ? "is-done" : ""}
                    onClick={() => setCurrent(i)}
                  >
                    <i key={i === current ? `on-${current}` : "off"} />
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        </div>

        <motion.div className="hero-count" initial={{ opacity: 0, y: 30 }} animate={ready ? { opacity: 1, y: 0 } : undefined} transition={{ delay: 1.3, duration: 1.1, ease: EASE_OUT }} aria-label={`${days} days, ${hours} hours, ${minutes} minutes until TEDx Thyna`}>
          <span className="mono hero-count-label">Countdown to curtain-up</span>
          <div className="hero-count-units" aria-hidden>
            {[
              [days, "Days"],
              [hours, "Hrs"],
              [minutes, "Min"],
              [seconds, "Sec"],
            ].map(([v, l]) => (
              <div key={l as string}>
                <RollingNumber value={v as number} />
                <small className="mono">{l}</small>
              </div>
            ))}
          </div>
        </motion.div>
      </motion.div>

      <div className="hero-foot mono">
        <span>
          <MapPin size={12} /> {EVENT.venue} · {EVENT.address}
        </span>
        <span className="hero-scroll">
          <i /> Scroll
        </span>
      </div>
    </section>
  );
}

/* ───────────────────────── 02 · CROSSED TAPES ───────────────────────── */

function Tapes() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const shift = useTransform(scrollYProgress, [0, 1], [0, -200]);
  const shift2 = useTransform(scrollYProgress, [0, 1], [-200, 0]);
  const items = ["15.11.2026", "Break the pattern", "Complexe Culturel Mohamed Jamoussi", "Ideas worth spreading", "Sfax"];
  return (
    <div ref={ref} className="tapes" aria-hidden>
      <motion.div className="tape is-red" style={{ x: shift }}>
        <Marquee items={items} speed={38} />
      </motion.div>
      <motion.div className="tape is-paper" style={{ x: shift2 }}>
        <Marquee items={["Sharing ideas", "Shaping perspectives", "Multiple voices", "One direction", "TEDx Thyna Youth"]} reverse speed={44} />
      </motion.div>
    </div>
  );
}

/* ───────────────────────── 03 · THE BRIEF ───────────────────────── */

function Brief() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const rotate = useTransform(scrollYProgress, [0, 1], [-60, 120]);
  const imgY = useTransform(scrollYProgress, [0, 1], ["-12%", "12%"]);
  return (
    <section ref={ref} id="brief" className="brief section theme-paper">
      <div className="brief-head">
        <Kicker code="01">The brief</Kicker>
      </div>
      <ScrollWords
        className="brief-text"
        text="Every pattern we live by was once somebody's new idea. This November, Sfax gathers to question them — and invites the curious, the restless and the bold to break a few, together."
        highlight={["pattern", "new", "idea", "curious", "restless", "bold", "break"]}
      />
      <div className="brief-foot">
        <div className="brief-photo">
          <motion.img src={img("dossier", 1000)} alt="A sealed case file, photographs and a microphone on a desk" style={{ y: imgY }} loading="lazy" />
          <span className="stamp">Break the<br />pattern</span>
        </div>
        <div className="brief-side">
          <Reveal className="brief-copy">
            <p>
              TEDx Thyna is more than a stage. It is a gathering of minds, ideas and people capable of changing the way we see the world — a youth-led event built in Sfax, for anyone who refuses to stop asking why.
            </p>
            <Link href="/mission" className="btn-link mono" data-cursor="Open">
              Read the mission <ArrowUpRight size={14} />
            </Link>
          </Reveal>
          <div className="brief-stats">
            {[
              ["06", "Speakers"],
              ["03", "Panelists"],
              ["02", "Moderators"],
            ].map(([n, l], i) => (
              <Reveal key={l} delay={i * 0.1} className="brief-stat">
                <b>{n}</b>
                <span className="mono">{l}</span>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ───────────────────────── 04 · EVIDENCE BOARD (horizontal) ───────────────────────── */

function FileCard({ file, index }: { file: (typeof FILES)[number]; index: number }) {
  return (
    <Link href={file.href} className="file-card" data-cursor="Open file" style={{ "--i": index } as CSSProperties}>
      <span className="file-pin" aria-hidden />
      <div className="file-img">
        <img src={img(file.image, 1000)} alt="" loading="lazy" />
        <span className="file-code">{file.code}</span>
      </div>
      <div className="file-body">
        <span className="mono red">Evidence / {file.tag}</span>
        <h3>{file.title}</h3>
        <p>{file.question}</p>
        <span className="file-open mono">
          Open file <ArrowUpRight size={14} />
        </span>
      </div>
    </Link>
  );
}

function EvidenceBoard() {
  const desktop = useMedia("(min-width: 900px)");
  const reduce = useReducedMotion();
  const pin = desktop && !reduce;
  const section = useRef<HTMLElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const [distance, setDistance] = useState(0);
  const { scrollYProgress } = useScroll({ target: section, offset: ["start start", "end end"] });
  const smooth = useSpring(scrollYProgress, { stiffness: 120, damping: 30, mass: 0.3 });
  const x = useTransform(smooth, [0, 1], [0, -distance]);
  const thread = useTransform(smooth, [0, 1], [0, 1]);
  const [active, setActive] = useState(0);
  useMotionValueEvent(scrollYProgress, "change", (v) => setActive(Math.min(FILES.length - 1, Math.floor(v * FILES.length))));

  useLayoutEffect(() => {
    if (!pin || !track.current) return;
    const measure = () => track.current && setDistance(track.current.scrollWidth - window.innerWidth);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(track.current);
    window.addEventListener("resize", measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [pin]);

  return (
    <section ref={section} className={`board ${pin ? "is-pinned" : ""}`} style={pin ? { height: `calc(100vh + ${distance}px)` } : undefined}>
      <div className="board-sticky">
        <div className="board-bg" aria-hidden>
          <img src={img("board", 1000)} alt="" loading="lazy" />
        </div>
        <motion.div ref={track} className="board-track" style={pin ? { x } : undefined}>
          <div className="board-intro">
            <Kicker code="02">The evidence board</Kicker>
            <Lines as="h2" className="display">
              {["Five files."]}
              {["One "]}
              {[<em key="s">story.</em>]}
            </Lines>
            <p>Every file answers a question. Pull the thread and follow it to the stage.</p>
            {pin && (
              <span className="mono board-hint">
                Keep scrolling <ArrowDownRight size={13} style={{ transform: "rotate(-45deg)" }} />
              </span>
            )}
          </div>
          <svg className="board-thread" viewBox="0 0 1000 40" preserveAspectRatio="none" aria-hidden>
            <motion.path d="M0 20 Q 125 4 250 20 T 500 20 T 750 20 T 1000 20" style={pin ? { pathLength: thread } : { pathLength: 1 }} />
          </svg>
          {FILES.map((f, i) => (
            <FileCard key={f.code} file={f} index={i} />
          ))}
          <div className="board-end">
            <span className="mono">End of board</span>
            <a href={EVENT.registerUrl} className="board-end-link" data-cursor="Join">
              Join the<br />
              <em>operation</em>
              <ArrowUpRight />
            </a>
          </div>
        </motion.div>
        {pin && (
          <div className="board-progress mono" aria-hidden>
            <span className="red">{String(active + 1).padStart(2, "0")}</span> / {String(FILES.length).padStart(2, "0")}
            <motion.i style={{ scaleX: smooth }} />
          </div>
        )}
      </div>
    </section>
  );
}

/* ───────────────────────── 05 · VOICES TEASER ───────────────────────── */

function VoicesTeaser() {
  return (
    <section className="teaser section theme-paper">
      <div className="teaser-head">
        <div>
          <span className="script lineup-script">Meet Our</span>
          <Lines as="h2" className="display lineup-title">
            <span>Eleven voices,</span>
            <em>one stage.</em>
          </Lines>
        </div>
        <Reveal className="teaser-side">
          <p>Six speakers, three panelists and two moderators. Each one has a story that breaks a pattern — discover them one by one.</p>
          <Magnetic>
            <Link href="/speakers" className="btn btn-red" data-cursor="Meet">
              <span className="btn-fill" />
              <span className="btn-label">Discover the speakers</span>
              <ArrowUpRight size={16} />
            </Link>
          </Magnetic>
        </Reveal>
      </div>
      <ul className="credits">
        {SPEAKERS.map((x, i) => (
          <Reveal as="li" key={x.photo} delay={(i % 5) * 0.05}>
            <Link href={`/speakers#${speakerSlug(x)}`} className="credit" data-cursor="Read">
              <span className="credit-name">
                <i>{x.first}</i> {x.last}
              </span>
              <small className="mono">{x.label}</small>
            </Link>
          </Reveal>
        ))}
      </ul>
      <Torn side="under" seed={21} />
    </section>
  );
}

/* ───────────────────────── 06 · THE SCENE (zoom reveal) ───────────────────────── */

function Scene() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  const clip = useTransform(scrollYProgress, [0, 0.55], ["inset(36% 24% 8% 24% round 4px)", "inset(0% 0% 0% 0% round 0px)"]);
  const scale = useTransform(scrollYProgress, [0, 0.6], [1.35, 1]);
  const titleOpacity = useTransform(scrollYProgress, [0.35, 0.6], [0, 1]);
  const titleY = useTransform(scrollYProgress, [0.35, 0.65], [60, 0]);
  const preOpacity = useTransform(scrollYProgress, [0, 0.25], [1, 0]);
  return (
    <section ref={ref} className="scene">
      <div className="scene-sticky">
        <motion.div className="scene-pre" style={{ opacity: preOpacity }}>
          <Kicker code="04">The scene</Kicker>
          <p className="scene-pre-title">
            Where ideas <em>arrive.</em>
          </p>
        </motion.div>
        <motion.div className="scene-frame" style={{ clipPath: clip }}>
          <motion.img src={img("stage")} srcSet={srcSet("stage")} sizes="100vw" alt="A theatre stage under a red spotlight" style={{ scale }} loading="lazy" />
          <div className="scene-shade" />
        </motion.div>
        <motion.div className="scene-copy" style={{ opacity: titleOpacity, y: titleY }}>
          <span className="mono red">Venue / confirmed</span>
          <h2>
            Complexe <em>Culturel</em>
            <br />
            Mohamed Jamoussi
          </h2>
          <div className="scene-data">
            <div>
              <span className="mono">Date</span>
              <b>{EVENT.dateLabel}</b>
            </div>
            <div>
              <span className="mono">Address</span>
              <b>{EVENT.address}</b>
            </div>
            <a href={EVENT.mapsUrl} target="_blank" rel="noreferrer" className="btn-link mono" data-cursor="Map">
              Open location <ArrowUpRight size={14} />
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

/* ───────────────────────── 07 · CLOCK ───────────────────────── */

function Clock() {
  const { days, hours, minutes, seconds, done } = useCountdown(EVENT.dateISO);
  return (
    <section className="clock section theme-paper">
      <Torn side="top" seed={33} />
      <Kicker code="05">The clock is running</Kicker>
      <div className="clock-grid" aria-label={done ? "TEDx Thyna is live" : `${days} days, ${hours} hours, ${minutes} minutes and ${seconds} seconds to go`}>
        {[
          [days, "Days"],
          [hours, "Hours"],
          [minutes, "Minutes"],
          [seconds, "Seconds"],
        ].map(([v, l], i) => (
          <Reveal key={l} delay={i * 0.08} className="clock-unit">
            <span className="clock-num" aria-hidden>
              <RollingNumber value={v as number} />
            </span>
            <span className="mono">{l}</span>
          </Reveal>
        ))}
      </div>
      <Reveal className="clock-foot">
        <p>Doors open on {EVENT.dateLabel}. Seats are limited — registration closes when the hall is full.</p>
      </Reveal>
      <Torn side="under" seed={41} />
    </section>
  );
}

/* ───────────────────────── 08 · FINAL CALL ───────────────────────── */

function FinalCall() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end end"] });
  const glow = useTransform(scrollYProgress, [0, 1], [0.1, 0.65]);
  const ringText = "Register now · Join the operation · ";
  return (
    <section ref={ref} className="final section">
      <motion.div className="final-glow" style={{ opacity: glow }} aria-hidden />
      <Kicker code="06">The next move</Kicker>
      <Lines as="h2" className="final-title">
        {["Are you ready"]}
        {["to uncover"]}
        {[
          <span key="s">
            the <em>story?</em>
          </span>,
        ]}
      </Lines>
      <div className="final-row">
        <Reveal className="final-copy">
          <p>Registration opens soon. Leave a signal and the team will contact you the moment seats are released.</p>
          <Link href="/contact" className="btn-link mono">
            Ask a question <ArrowUpRight size={14} />
          </Link>
        </Reveal>
        <Magnetic strength={0.4}>
          <a href={EVENT.registerUrl} className="ring-btn" data-cursor="Join" aria-label="Register for TEDx Thyna">
            <svg viewBox="0 0 200 200" className="ring-text" aria-hidden>
              <defs>
                <path id="ring-path" d="M100,100 m-78,0 a78,78 0 1,1 156,0 a78,78 0 1,1 -156,0" />
              </defs>
              <text>
                <textPath href="#ring-path" textLength="488" lengthAdjust="spacing">
                  {ringText}
                </textPath>
              </text>
            </svg>
            <span className="ring-core">
              <ArrowUpRight size={34} />
            </span>
          </a>
        </Magnetic>
      </div>
    </section>
  );
}

export default function Home() {
  return (
    <Page title="TEDx Thyna Youth 2026 — Break The Pattern · 15.11.2026, Sfax">
      <main>
        <Hero />
        <Tapes />
        <Brief />
        <VoicesTeaser />
        <EvidenceBoard />
        <Scene />
        <Clock />
        <FinalCall />
      </main>
    </Page>
  );
}
