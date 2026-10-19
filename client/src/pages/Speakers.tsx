import { AnimatePresence, motion, useScroll, useTransform } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { EVENT, ROLE_TAGLINE, speakerPhoto, speakerSlug, SPEAKERS } from "@/data/site";
import { EASE_OUT, Lines, Reveal } from "@/components/site/motion";
import { NextFile, Page, PageHero } from "@/components/site/Page";
import { Bio, Palms, PosterName, Torn, type Speaker } from "@/components/site/Poster";
import { useLenis } from "@/components/site/SmoothScroll";

const FILTERS = ["All", "Speaker", "Panelist", "Moderator"] as const;
type Filter = (typeof FILTERS)[number];

function Tagline({ s }: { s: Speaker }) {
  const [a, b] = ROLE_TAGLINE[s.role];
  const split = (t: string) => {
    const [first, ...rest] = t.split(" ");
    return (
      <>
        {first} <em>{rest.join(" ")}</em>
      </>
    );
  };
  return (
    <p className="sp-tagline">
      {split(a)}
      <br />
      {split(b)}
    </p>
  );
}

function SpeakerFeature({ s, index, total }: { s: Speaker; index: number; total: number }) {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const photoY = useTransform(scrollYProgress, [0, 1], ["-6%", "6%"]);
  const redY = useTransform(scrollYProgress, [0, 1], [40, -40]);
  const darkY = useTransform(scrollYProgress, [0, 1], [-20, 20]);
  const flip = index % 2 === 1;

  return (
    <article ref={ref} id={speakerSlug(s)} className={`sp ${flip ? "is-flip" : ""}`}>
      <div className="sp-collage">
        <motion.span className="sp-block is-dark" style={{ y: darkY }} aria-hidden />
        <motion.span className="sp-block is-red" style={{ y: redY }} aria-hidden />
        <Palms className="sp-palms" />
        <motion.div
          className="sp-photo"
          initial={{ clipPath: "inset(100% 0% 0% 0%)" }}
          whileInView={{ clipPath: "inset(0% 0% 0% 0%)" }}
          viewport={{ once: true, margin: "-12% 0px" }}
          transition={{ duration: 1.3, ease: EASE_OUT }}
        >
          <motion.img src={speakerPhoto(s.photo)} alt={`${s.first} ${s.last}`} style={{ y: photoY }} loading={index < 2 ? "eager" : "lazy"} />
          <Torn side="bottom" seed={index * 5 + 3} className="sp-torn" />
        </motion.div>
        <span className="sp-num" aria-hidden>
          {String(index + 1).padStart(2, "0")}
        </span>
      </div>

      <div className="sp-copy">
        <Reveal>
          <span className="mono sp-count">
            {String(index + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
          </span>
          <span className="script sp-role">
            Meet Our <b>{s.label}</b>
          </span>
        </Reveal>
        <h2 className="sp-name">
          <Lines as="span" className="sp-name-lines">
            <span className="pn-first">{s.first}</span>
            <span className="pn-last">{s.last}</span>
          </Lines>
        </h2>
        <Reveal delay={0.15}>
          <p className="sp-bio">
            <Bio text={s.bio} />
          </p>
          <Tagline s={s} />
          <span className="sp-sig">
            <b>
              TED<sup>x</sup>
            </b>
            ThynaYouth · {EVENT.dateShort}
          </span>
        </Reveal>
      </div>
    </article>
  );
}

export default function Speakers() {
  const [filter, setFilter] = useState<Filter>("All");
  const lenis = useLenis();
  const list = SPEAKERS.filter((s) => filter === "All" || s.role === filter);
  const count = (f: Filter) => (f === "All" ? SPEAKERS.length : SPEAKERS.filter((s) => s.role === f).length);

  // honour /speakers#name links from the home page
  useEffect(() => {
    const id = window.location.hash.slice(1);
    if (!id) return;
    const t = window.setTimeout(() => {
      const el = document.getElementById(id);
      if (!el) return;
      if (lenis) lenis.scrollTo(el, { offset: -90, duration: 1.6 });
      else el.scrollIntoView({ behavior: "smooth" });
    }, 900);
    return () => window.clearTimeout(t);
  }, [lenis]);

  return (
    <Page title="Speakers — TEDx Thyna Youth 2026 · Break The Pattern">
      <PageHero
        code="03"
        label="The speakers"
        image="curtain"
        title={[
          <span key="a">Thirteen voices.</span>,
          <span key="b">
            One <em>stage.</em>
          </span>,
        ]}
        lead="Seven speakers sharing ideas, four panelists in one conversation, and two moderators connecting it all."
        meta={[
          ["Speakers", "06"],
          ["Panelists", "03"],
          ["Moderators", "02"],
        ]}
      />
      <main className="speakers theme-paper">
        <Torn side="top" seed={8} />
        <div className="sp-filter">
          <span className="script">Meet Our</span>
          <div className="chips" role="tablist" aria-label="Filter speakers">
            {FILTERS.map((f) => (
              <button key={f} role="tab" aria-selected={filter === f} className={`chip ${filter === f ? "is-on" : ""}`} onClick={() => setFilter(f)}>
                {f === "All" ? "All voices" : `${f}s`}
                <small>{count(f)}</small>
              </button>
            ))}
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div key={filter} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.5, ease: EASE_OUT }} className="sp-list">
            {list.map((s, i) => (
              <SpeakerFeature key={s.photo} s={s} index={i} total={list.length} />
            ))}
          </motion.div>
        </AnimatePresence>

        <section className="sp-cta">
          <PosterName first="Be in" last="the room" className="sp-cta-name" />
          <p>Seats at the Complexe Culturel Mohamed Jamoussi are limited. Secure your pass for 15 November.</p>
          <a className="btn btn-red" href={EVENT.registerUrl} data-cursor="Join">
            <span className="btn-fill" />
            <span className="btn-label">Get your ticket</span>
            <ArrowUpRight size={16} />
          </a>
        </section>
        <Torn side="under" seed={13} />
      </main>
      <NextFile current="/speakers" />
    </Page>
  );
}
