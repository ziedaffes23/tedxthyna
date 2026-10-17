import { AnimatePresence, motion, useMotionValueEvent, useScroll } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { EVENT, NAV, img } from "@/data/site";
import { EASE, EASE_OUT } from "./motion";

const MENU_IMAGES: Record<string, string> = {
  "/mission": "gather",
  "/speakers": "voices",
  "/organization": "board",
  "/scene": "stage",
  "/agenda": "desk",
  "/contact": "sfax",
};

function SfaxClock() {
  const [time, setTime] = useState("");
  useEffect(() => {
    const fmt = new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit", timeZone: "Africa/Tunis" });
    const update = () => setTime(fmt.format(new Date()));
    update();
    const t = window.setInterval(update, 1000);
    return () => window.clearInterval(t);
  }, []);
  return <span className="nav-clock mono"><i className="blink-dot" /> Sfax {time}</span>;
}

export function Nav() {
  const [open, setOpen] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [solid, setSolid] = useState(false);
  const [hover, setHover] = useState<string>("/mission");
  const [location] = useLocation();
  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, "change", (y) => {
    const prev = scrollY.getPrevious() ?? 0;
    setSolid(y > 40);
    setHidden(y > 300 && y > prev && !open);
  });

  useEffect(() => setOpen(false), [location]);
  useEffect(() => {
    document.documentElement.classList.toggle("is-locked", open);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <motion.header
        className={`nav ${solid ? "is-solid" : ""} ${open ? "is-open" : ""} ${["/", "/contact"].includes(location) ? "on-paper" : ""}`}
        animate={{ y: hidden ? "-110%" : "0%" }}
        transition={{ duration: 0.5, ease: EASE }}
      >
        <Link href="/" className="nav-brand" aria-label="TEDx Thyna Youth — home">
          <img className="is-light-mark" src="/media/wordmark-light.png" alt="TEDx Thyna Youth" width={160} height={27} />
          <img className="is-dark-mark" src="/tedx-thyna-wordmark.png" alt="" aria-hidden width={160} height={27} />
        </Link>
        <SfaxClock />
        <div className="nav-actions">
          <a href={EVENT.registerUrl} className="nav-register" data-cursor="Join">
            <span>Register</span>
            <ArrowUpRight size={15} />
          </a>
          <button className="nav-burger" onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-controls="site-menu" aria-label={open ? "Close menu" : "Open menu"}>
            <span className="mono">{open ? "Close" : "Menu"}</span>
            <span className="burger-lines">
              <i />
              <i />
            </span>
          </button>
        </div>
      </motion.header>

      <AnimatePresence>
        {open && (
          <motion.div
            id="site-menu"
            className="menu"
            initial={{ clipPath: "inset(0 0 100% 0)" }}
            animate={{ clipPath: "inset(0 0 0% 0)" }}
            exit={{ clipPath: "inset(0 0 100% 0)" }}
            transition={{ duration: 0.9, ease: EASE }}
          >
            <div className="menu-visual" aria-hidden>
              <AnimatePresence mode="popLayout">
                <motion.img
                  key={hover}
                  src={img(MENU_IMAGES[hover] ?? "stage", 1000)}
                  alt=""
                  initial={{ opacity: 0, scale: 1.15 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.8, ease: EASE_OUT }}
                />
              </AnimatePresence>
              <span className="menu-visual-tag mono">Evidence / {NAV.find((n) => n.href === hover)?.code ?? "00"}</span>
            </div>
            <nav className="menu-links" aria-label="Primary">
              <span className="mono menu-kicker">Case index / {EVENT.caseNo}</span>
              {NAV.map((item, i) => (
                <div className="menu-link-mask" key={item.href}>
                  <motion.div
                    initial={{ y: "110%" }}
                    animate={{ y: "0%" }}
                    exit={{ y: "110%" }}
                    transition={{ duration: 0.9, delay: 0.25 + i * 0.06, ease: EASE_OUT }}
                  >
                    <Link
                      href={item.href}
                      className={`menu-link ${location === item.href ? "is-current" : ""}`}
                      onPointerEnter={() => setHover(item.href)}
                      onFocus={() => setHover(item.href)}
                    >
                      <small className="mono">{item.code}</small>
                      <span>{item.label}</span>
                      <ArrowUpRight className="menu-arrow" />
                    </Link>
                  </motion.div>
                </div>
              ))}
              <motion.div className="menu-foot" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ delay: 0.7 }}>
                <span className="mono">{EVENT.dateLabel} — {EVENT.venue}</span>
                <span className="menu-socials">
                  <a href={EVENT.instagram} target="_blank" rel="noreferrer">Instagram</a>
                  <a href={EVENT.linkedin} target="_blank" rel="noreferrer">LinkedIn</a>
                  <a href={`mailto:${EVENT.email}`}>Email</a>
                </span>
              </motion.div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
