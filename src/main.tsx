import React, { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  levels,
  targets,
  FINAL_CODE,
  FORMS_URL,
  type TargetId,
} from "./levels";
import { chime } from "./sound";
import { masters, loadMasters, spriteContains } from "./sprites";
import { WorldTargets } from "./WorldTargets";
import "./style.css";

type Save = { level: number; found: TargetId[][]; complete: boolean };
const fresh = (): Save => ({
  level: 0,
  found: [[], [], [], []],
  complete: false,
});
const KEY = "find-santa-v1";
function restore(): Save {
  try {
    const s = JSON.parse(localStorage.getItem(KEY) || "null");
    if (
      s &&
      Number.isInteger(s.level) &&
      s.level >= 0 &&
      s.level < 4 &&
      Array.isArray(s.found) &&
      s.found.length === 4 &&
      s.found.every(
        (a: unknown) =>
          Array.isArray(a) &&
          new Set(a).size === a.length &&
          a.every((id) => targets.some((t) => t.id === id)),
      ) &&
      s.found.slice(0, s.level).every((a: string[]) => a.length === 4) &&
      (!s.complete || s.found.every((a: string[]) => a.length === 4))
    )
      return s;
  } catch {}
  return fresh();
}
function Icon({ id }: { id: TargetId }) {
  return (
    <span className={"icon " + id} aria-hidden="true">
      <img src={masters[id]} alt="" draggable={false} />
    </span>
  );
}
function Snow() {
  return (
    <div className="snow" aria-hidden="true">
      {Array.from({ length: 26 }, (_, i) => (
        <i
          key={i}
          style={{
            left: `${i * 3.9}%`,
            animationDelay: `-${i * 0.71}s`,
            animationDuration: `${9 + (i % 6)}s`,
            opacity: 0.2 + (i % 4) * 0.15,
          }}
        />
      ))}
    </div>
  );
}
function App() {
  const sound = true;
  const [save, setSave] = useState<Save>(restore),
    [screen, setScreen] = useState<
      "intro" | "brief" | "card" | "game" | "finish"
    >("intro"),
    [notice, setNotice] = useState(""),
    [copied, setCopied] = useState(false),
    [seconds, setSeconds] = useState(0),
    [cooldown, setCooldown] = useState(0),
    [hint, setHint] = useState<TargetId | null>(null),
    [homeLoaded, setHomeLoaded] = useState(false);
  const [mastersReady, setMastersReady] = useState(false),
    [objectError, setObjectError] = useState(false),
    [sceneWidth, setSceneWidth] = useState(0),
    [paused, setPaused] = useState(false);
  const [zoom, setZoom] = useState(1),
    [pan, setPan] = useState({ x: 0, y: 0 }),
    [loaded, setLoaded] = useState(false),
    [imageError, setImageError] = useState(false),
    [burst, setBurst] = useState<{
      x: number;
      y: number;
      good: boolean;
    } | null>(null);
  const viewport = useRef<HTMLDivElement>(null),
    image = useRef<HTMLImageElement>(null),
    points = useRef(new Map<number, { x: number; y: number }>()),
    gesture = useRef({
      x: 0,
      y: 0,
      px: 0,
      py: 0,
      distance: 0,
      zoom: 1,
      moved: false,
    });
  const current = levels[save.level],
    found = save.found[save.level],
    done = found.length === 4,
    total = save.found.flat().length;
  const debug =
    import.meta.env.DEV && new URLSearchParams(location.search).has("debug");
  useEffect(() => {
    void loadMasters()
      .then(() => setMastersReady(true))
      .catch(() => setObjectError(true));
  }, []);
  useEffect(() => {
    const el = viewport.current;
    if (screen !== "game" || !el) return;
    const resize = () => {
      const r = el.getBoundingClientRect();
      setSceneWidth(Math.max(r.width, r.height * 1.5));
      setZoom(1);
      setPan({ x: 0, y: 0 });
    };
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(el);
    return () => observer.disconnect();
  }, [screen]);
  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(save));
    } catch {}
  }, [save]);
  useEffect(() => {
    if (screen !== "game" || paused || document.hidden) return;
    const timer = window.setInterval(() => {
      if (!document.hidden) {
        setSeconds((s) => s + 1);
        setCooldown((s) => Math.max(0, s - 1));
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [screen, paused]);
  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(() => setNotice(""), 1100);
    return () => clearTimeout(t);
  }, [notice]);
  useEffect(() => {
    if (!hint) return;
    const t = setTimeout(() => setHint(null), 2000);
    return () => clearTimeout(t);
  }, [hint]);
  useEffect(() => {
    if (!burst) return;
    const t = setTimeout(() => setBurst(null), 900);
    return () => clearTimeout(t);
  }, [burst]);
  useEffect(() => {
    const reset = () => {
      setZoom(1);
      setPan({ x: 0, y: 0 });
    };
    window.addEventListener("resize", reset);
    return () => window.removeEventListener("resize", reset);
  }, []);
  useEffect(() => {
    const el = viewport.current;
    if (!el || screen !== "game") return;
    const wheel = (e: WheelEvent) => {
      e.preventDefault();
      changeZoom(zoom * Math.exp(-e.deltaY * 0.002), e.clientX, e.clientY);
    };
    el.addEventListener("wheel", wheel, { passive: false });
    return () => el.removeEventListener("wheel", wheel);
  }, [screen, zoom, pan]);
  function start(reset = false) {
    setNotice("");
    setBurst(null);
    if (reset) setSave(fresh());
    setScreen("card");
    setSeconds(0);
    setCooldown(0);
    chime(sound);
  }
  function enter() {
    setScreen("game");
    setLoaded(false);
    setImageError(false);
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }
  function changeZoom(value: number, cx?: number, cy?: number) {
    const next = Math.max(1, Math.min(8, value));
    const r = viewport.current?.getBoundingClientRect();
    if (r) {
      const ax = cx === undefined ? 0 : cx - r.left - r.width / 2,
        ay = cy === undefined ? 0 : cy - r.top - r.height / 2;
      setPan(
        clampPan(
          ax - ((ax - pan.x) * next) / zoom,
          ay - ((ay - pan.y) * next) / zoom,
          next,
        ),
      );
    }
    setZoom(next);
  }
  function clampPan(x: number, y: number, scale: number) {
    const r = viewport.current?.getBoundingClientRect();
    if (!r || !image.current) return { x: 0, y: 0 };
    const maxX = Math.max(0, (image.current.offsetWidth * scale - r.width) / 2);
    const maxY = Math.max(
      0,
      (image.current.offsetHeight * scale - r.height) / 2,
    );
    return {
      x: Math.max(-maxX, Math.min(maxX, x)),
      y: Math.max(-maxY, Math.min(maxY, y)),
    };
  }
  function award(id: TargetId) {
    if (found.includes(id) || done || !loaded || !mastersReady || paused)
      return;
    const b = current.boxes[id];
    setSave((s) => ({
      ...s,
      found: s.found.map((f, i) => (i === s.level ? [...f, id] : f)),
    }));
    setBurst({ x: b.x + b.w / 2, y: b.y + b.h / 2, good: true });
    setNotice(`${targets.find((t) => t.id === id)!.name.toUpperCase()} FOUND!`);
    chime(sound, found.length === 3);
    if (navigator.vibrate) navigator.vibrate(25);
  }
  function locate(e: React.PointerEvent) {
    if (!image.current || gesture.current.moved || !loaded || done) return;
    const r = image.current.getBoundingClientRect(),
      x = (e.clientX - r.left) / r.width,
      y = (e.clientY - r.top) / r.height;
    if (x < 0 || x > 1 || y < 0 || y > 1) return;
    const target = targets.find((t) =>
      spriteContains(t.id, current.boxes[t.id], x, y),
    );
    if (target) award(target.id);
    else setBurst({ x, y, good: false });
  }
  function down(e: React.PointerEvent) {
    if (e.button !== 0 || paused) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    points.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const all = [...points.current.values()];
    gesture.current = {
      x: e.clientX,
      y: e.clientY,
      px: pan.x,
      py: pan.y,
      distance:
        all.length === 2
          ? Math.hypot(all[0].x - all[1].x, all[0].y - all[1].y)
          : 0,
      zoom,
      moved: all.length > 1,
    };
  }
  function move(e: React.PointerEvent) {
    if (!points.current.has(e.pointerId)) return;
    points.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const g = gesture.current,
      all = [...points.current.values()];
    if (all.length === 2) {
      g.moved = true;
      const d = Math.hypot(all[0].x - all[1].x, all[0].y - all[1].y);
      if (g.distance)
        changeZoom(
          (g.zoom * d) / g.distance,
          (all[0].x + all[1].x) / 2,
          (all[0].y + all[1].y) / 2,
        );
      return;
    }
    const dx = e.clientX - g.x,
      dy = e.clientY - g.y;
    if (Math.hypot(dx, dy) > 6) g.moved = true;
    if (g.moved && zoom >= 1) {
      setPan(clampPan(g.px + dx, g.py + dy, zoom));
    }
  }
  function up(e: React.PointerEvent) {
    if (points.current.size === 1) locate(e);
    points.current.delete(e.pointerId);
    if (points.current.size === 1) {
      const remaining = [...points.current.values()][0];
      gesture.current = {
        ...gesture.current,
        x: remaining.x,
        y: remaining.y,
        px: pan.x,
        py: pan.y,
        distance: 0,
        moved: true,
      };
    }
  }
  function next() {
    if (!done) return;
    setNotice("");
    setBurst(null);
    setHint(null);
    if (save.level === 3) {
      setSave((s) => ({ ...s, complete: true }));
      setScreen("finish");
      chime(sound, true);
    } else {
      setSave((s) => ({ ...s, level: s.level + 1 }));
      setSeconds(0);
      setCooldown(0);
      setHint(null);
      setScreen("card");
    }
  }
  function giveHint() {
    if (seconds < 30 || cooldown || done || !loaded) return;
    const id = targets.find((t) => !found.includes(t.id))!.id,
      b = current.boxes[id];
    const x = Math.floor((b.x + b.w / 2) * 4) / 4 + 0.125,
      y = Math.floor((b.y + b.h / 2) * 4) / 4 + 0.125;
    setZoom(1);
    setPan(
      clampPan(
        (0.5 - x) * (image.current?.offsetWidth || 0),
        (0.5 - y) * (image.current?.offsetHeight || 0),
        1,
      ),
    );
    setHint(id);
    setCooldown(10);
  }
  async function copy() {
    try {
      await navigator.clipboard.writeText(FINAL_CODE);
      setCopied(true);
    } catch {
      setNotice(
        "Select the code and copy it using your device’s copy command.",
      );
    }
  }
  return (
    <div className={`app screen-${screen}`}>
      <Snow />
      <div className="fairy-lights" aria-hidden="true">
        {Array.from({ length: 20 }, (_, i) => (
          <i key={i} style={{ "--i": i } as React.CSSProperties} />
        ))}
      </div>
      {screen === "intro" && (
        <main className="home-landing">
          <picture className="home-picture">
            <source
              media="(max-aspect-ratio: 1/1)"
              srcSet="/home/christmas-search-portrait.png"
            />
            <img
              className="home-backdrop"
              src="/home/christmas-search.png"
              alt=""
              onLoad={() => setHomeLoaded(true)}
            />
          </picture>
          <div className={`home-content ${homeLoaded ? "art-ready" : ""}`}>
            <div className="home-title">
              <h1>OPERATION:</h1>
              <div className="ribbon">THE CHRISTMAS SEARCH</div>
              <p>THE FESTIVE HIDDEN OBJECT GAME</p>
            </div>
            <section className="home-mission parchment">
              <span className="secret-stamp" aria-hidden="true">
                TOP
                <br />
                SECRET<span>★</span>
              </span>
              <div className="home-ornament" aria-hidden="true">
                ─ ✦ ♠ ✦ ─
              </div>
              <h2>Santa has gone missing!</h2>
              <p className="home-description">
                Search four festive locations to find four hidden items at each
                one. Can you find them all and complete the mission?
              </p>
              <div className="home-targets">
                {targets.map((t) => (
                  <div key={t.id}>
                    <Icon id={t.id} />
                    <strong>
                      {t.id === "santa"
                        ? "SANTA"
                        : t.id === "reindeer"
                          ? "REINDEER"
                          : t.id === "tag"
                            ? "TOLL TAG"
                            : "DKV CARD"}
                    </strong>
                  </div>
                ))}
              </div>
              <button
                className="primary home-begin"
                onClick={() =>
                  save.complete
                    ? setScreen("finish")
                    : total
                      ? start()
                      : setScreen("brief")
                }
              >
                <span aria-hidden="true">▶</span>
                {total && !save.complete
                  ? "Resume mission"
                  : "BEGIN THE SEARCH"}
              </button>
              {total > 0 && (
                <button className="text-button" onClick={() => start(true)}>
                  Start over
                </button>
              )}
            </section>
          </div>
        </main>
      )}

      {screen === "brief" && (
        <main
          className="briefing"
          style={{ backgroundImage: `url(${levels[0].image})` }}
        >
          <section className="parchment">
            <div className="ribbon">YOUR CHRISTMAS MISSION</div>
            <h1>Santa’s taking the scenic route!</h1>
            <p>
              Search four wonderfully busy locations. Find these same four
              little travellers in every scene.
            </p>
            <div className="brief-targets">
              {targets.map((t) => (
                <div key={t.id}>
                  <Icon id={t.id} />
                  <strong>{t.name}</strong>
                </div>
              ))}
            </div>
            <div className="destination-list">
              {levels.map((l, i) => (
                <div key={l.id}>
                  <img src={l.image} alt="" />
                  <span>
                    {i + 1}. {l.title}
                  </span>
                </div>
              ))}
            </div>
            <p>
              Zoom in for the tiny details. Drag to explore. A hint is always on
              its way.
            </p>
            <button className="primary" onClick={() => start()}>
              Start mission ➜
            </button>
          </section>
        </main>
      )}
      {screen === "card" && (
        <main
          className="location-card"
          style={{ backgroundImage: `url(${current.image})` }}
        >
          <section className="wood-sign">
            <p className="eyebrow">LOCATION {save.level + 1} OF 4</p>
            <h1>{current.title}</h1>
            <p>{current.subtitle}</p>
            <div className="brief-targets">
              {targets.map((t) => (
                <Icon key={t.id} id={t.id} />
              ))}
            </div>
            <p>Find all four. Look closely — they’re little!</p>
            <button className="primary" onClick={enter}>
              Explore location ➜
            </button>
          </section>
        </main>
      )}
      {screen === "game" && (
        <main className="mission">
          <header className="game-header">
            <div className="game-logo">
              <small>OPERATION</small>
              <strong>FIND SANTA</strong>
            </div>
            <aside className="target-panel">
              <div className="panel-title">
                <strong>FIND THESE FOUR</strong>
                <span>{found.length}/4 found</span>
              </div>
              <div className="target-list">
                {targets.map((t) => (
                  <div
                    key={t.id}
                    className={`target-tile ${found.includes(t.id) ? "is-found" : ""}`}
                  >
                    <Icon id={t.id} />
                    <strong>{t.short}</strong>
                    <b
                      aria-label={found.includes(t.id) ? "Found" : "Not found"}
                    >
                      {found.includes(t.id) ? "✓" : "○"}
                    </b>
                  </div>
                ))}
              </div>
            </aside>
          </header>
          <section className="scene-shell">
            <div className="location-plaque wood-sign">
              <small>LOCATION {save.level + 1} / 4</small>
              <h1>{current.title}</h1>
            </div>
            <div
              ref={viewport}
              className="viewport"
              onPointerDown={down}
              onPointerMove={move}
              onPointerUp={up}
              onPointerCancel={(e) => {
                points.current.delete(e.pointerId);
                gesture.current.moved = true;
              }}
            >
              <div
                className="scene-transform"
                style={{
                  width: sceneWidth || "100%",
                  transform: `translate(${pan.x}px,${pan.y}px) scale(${zoom})`,
                }}
              >
                <div
                  className="image-space"
                  style={{ "--scene-zoom": zoom } as React.CSSProperties}
                >
                  <img
                    ref={image}
                    className="scene"
                    src={current.image}
                    alt={`${current.title}. Drag to explore the whole scene, zoom into the tiny details,`}
                    draggable={false}
                    onLoad={() => setLoaded(true)}
                    onError={() => {
                      setImageError(true);
                      setLoaded(false);
                    }}
                  />
                  <WorldTargets
                    boxes={current.boxes}
                    background={current.image}
                  />
                  {debug &&
                    targets.map((t) => {
                      const b = current.boxes[t.id];
                      return (
                        <div
                          className="debug-box"
                          key={t.id}
                          style={{
                            left: `${b.x * 100}%`,
                            top: `${b.y * 100}%`,
                            width: `${b.w * 100}%`,
                            height: `${b.h * 100}%`,
                          }}
                        >
                          {t.id}
                        </div>
                      );
                    })}
                  {found.map((id) => {
                    const b = current.boxes[id];
                    return (
                      <span
                        key={id}
                        className="found-marker"
                        style={{
                          left: `${(b.x + b.w / 2) * 100}%`,
                          top: `${(b.y + b.h / 2) * 100}%`,
                        }}
                      >
                        ✓
                      </span>
                    );
                  })}
                  {hint && (
                    <span
                      className="hint-ring"
                      style={{
                        left: `${(Math.floor((current.boxes[hint].x + current.boxes[hint].w / 2) * 4) / 4 + 0.125) * 100}%`,
                        top: `${(Math.floor((current.boxes[hint].y + current.boxes[hint].h / 2) * 4) / 4 + 0.125) * 100}%`,
                      }}
                    />
                  )}
                  {burst && (
                    <span
                      className={`burst ${burst.good ? "good" : ""}`}
                      style={{
                        left: `${burst.x * 100}%`,
                        top: `${burst.y * 100}%`,
                      }}
                    >
                      {burst.good ? "✧" : ""}
                    </span>
                  )}
                </div>
              </div>
            </div>
            {(!loaded || !mastersReady) && !imageError && !objectError && (
              <div className="loading">
                ✦ Preparing a little Christmas magic…
              </div>
            )}
            {(imageError || objectError) && (
              <div className="loading error">
                {objectError
                  ? "Canonical target artwork failed to load."
                  : `Scene artwork is missing: ${current.image}`}
                <button onClick={() => location.reload()}>Retry loading</button>
              </div>
            )}
            <div className="search-tip">
              Drag to explore · Scroll or pinch to zoom
            </div>
            {done && (
              <section className="level-done">
                <div className="ribbon">✦ LOCATION COMPLETE ✦</div>
                <div className="completion-ticks">✓ ✓ ✓ ✓</div>
                <h2>Christmas magic, recovered!</h2>
                <p>
                  {save.level === 3
                    ? "Your final surprise is waiting."
                    : `Next stop: ${levels[save.level + 1].title}`}
                </p>
                <button className="primary" onClick={next}>
                  {save.level === 3 ? "Complete mission" : "Next location"} ➜
                </button>
              </section>
            )}
          </section>
          <footer className="game-controls">
            <div className="journey">
              <span>
                {total}/16 <small>FOUND</small>
              </span>
              {levels.map((l, i) => (
                <b
                  key={l.id}
                  className={i <= save.level ? "active" : ""}
                  title={l.title}
                >
                  {i < save.level ? "✓" : i + 1}
                </b>
              ))}
            </div>
            <div className="zoom-controls">
              <button
                onClick={() => changeZoom(zoom / 1.4)}
                aria-label="Zoom out"
              >
                −
              </button>
              <span>{Math.round(zoom * 100)}%</span>
              <button
                onClick={() => changeZoom(zoom * 1.4)}
                aria-label="Zoom in"
              >
                +
              </button>
              <button
                onClick={() => {
                  setZoom(1);
                  setPan({ x: 0, y: 0 });
                }}
                aria-label="Fit scene to screen"
                title="Reset view; drag to explore the edges"
              >
                ⛶
              </button>
            </div>
            <button
              className="hint-button"
              disabled={
                seconds < 30 || !!cooldown || done || !loaded || !mastersReady
              }
              onClick={giveHint}
            >
              ✧{" "}
              {seconds < 30
                ? `Hint in ${30 - seconds}s`
                : cooldown
                  ? `Next hint in ${cooldown}s`
                  : "A little helping hand"}
            </button>
            <div className="utility-controls">
              <button
                onClick={() => setPaused(true)}
                aria-label="Pause mission"
              >
                Ⅱ
              </button>
            </div>
          </footer>
          {paused && (
            <div className="modal-backdrop">
              <section
                className="wood-sign pause-panel"
                role="dialog"
                aria-modal="true"
                aria-label="Mission paused"
              >
                <div className="ribbon">A LITTLE COCOA BREAK</div>
                <h2>Mission paused</h2>
                <p>
                  Your discoveries are saved.
                  <br />
                  Christmas can wait a moment.
                </p>
                <button
                  className="primary"
                  autoFocus
                  onClick={() => setPaused(false)}
                >
                  Resume search ➜
                </button>
                <button
                  className="text-button"
                  onClick={() => {
                    setPaused(false);
                    setScreen("intro");
                  }}
                >
                  Save & return to opening
                </button>
              </section>
            </div>
          )}
        </main>
      )}
      {screen === "finish" && (
        <main
          className="finish"
          style={{ backgroundImage: `url(${levels[0].image})` }}
        >
          <div className="winter-shade" />
          <div className="aurora" />
          <section className="final-parchment parchment">
            <div className="ribbon">✦ MISSION COMPLETE ✦</div>
            <div className="gold-stars">★ ★ ★</div>
            <h1>
              You found the
              <br />
              <em>Christmas magic!</em>
            </h1>
            <p>16 of 16 discoveries. One very merry mission.</p>
            <div className="completed-locations">
              {levels.map((l) => (
                <div key={l.id}>
                  <img src={l.image} alt="" />
                  <span>✓ {l.title}</span>
                </div>
              ))}
            </div>
            <div className="code-card">
              <span>YOUR COMPETITION CODE</span>
              <strong>{FINAL_CODE}</strong>
              <button className="primary copy-button" onClick={copy}>
                {copied ? "✓ Code copied" : "COPY CODE"} ⧉
              </button>
              <p>
                Enter this code into the competition’s Microsoft Forms entry.
              </p>
              {FORMS_URL && /^https:\/\//.test(FORMS_URL) && (
                <a
                  href={FORMS_URL}
                  className="forms-link"
                  target="_blank"
                  rel="noreferrer"
                >
                  Open Microsoft Forms ↗
                </a>
              )}
            </div>
            <button className="text-button" onClick={() => start(true)}>
              ↻ PLAY AGAIN
            </button>
          </section>
        </main>
      )}
      <div
        className={`toast ${notice ? "visible" : ""}`}
        role="status"
        aria-live="polite"
      >
        {notice && (
          <>
            <span>✦</span>
            {notice}
            <span>✦</span>
          </>
        )}
      </div>
    </div>
  );
}

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { error: boolean }
> {
  state = { error: false };
  static getDerivedStateFromError() {
    return { error: true };
  }
  render() {
    return this.state.error ? (
      <main className="fallback">
        <h1>A small detour.</h1>
        <p>Your saved mission is safe. Reload to try again.</p>
        <button onClick={() => location.reload()}>Reload game</button>
      </main>
    ) : (
      this.props.children
    );
  }
}
createRoot(document.getElementById("root")!).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>,
);
