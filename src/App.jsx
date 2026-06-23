import { useState, useEffect, useRef, Fragment } from "react";

// Transforme les URL d'un texte en liens cliquables ENTIERS (jamais d'astérisque).
// Version écran (renvoie du JSX).
const linkify = (text) => {
  const parts = String(text || "").split(/(https?:\/\/[^\s)]+)/g);
  return parts.map((part, i) => {
    if (/^https?:\/\//.test(part)) {
      // Retire la ponctuation finale collée à l'URL (virgule, point, etc.) qui casse le lien
      const m = part.match(/^(.*?)([.,;:!?）)\]]*)$/);
      const url = m ? m[1] : part;
      const trail = m ? m[2] : "";
      return <span key={i}><a href={url} target="_blank" rel="noopener noreferrer" style={{ color: "#0a58ca", wordBreak: "break-all" }}>{url}</a>{trail}</span>;
    }
    return part;
  });
};
// Version PDF : prend du texte DÉJÀ échappé et enrobe les URL dans des <a> (ponctuation finale exclue).
const linkifyHtml = (escaped) =>
  String(escaped).replace(/(https?:\/\/[^\s)<]*?)([.,;:!?）)\]]*)(?=\s|<|$)/g, '<a href="$1" style="color:#0a58ca;word-break:break-all;">$1</a>$2');

// ─── CONSTANTES ───────────────────────────────────────────────────────────────

const FIRST_QUESTION = {
  label: "01",
  bloc: "TON PROJET",
  question: "Qu'est-ce que tu veux créer ?",
  placeholder: "Ex: une barber shop dans mon quartier, une boutique en ligne de vêtements, un service de livraison de repas healthy...",
  examples: ["Une barber shop", "Un restaurant", "Une boutique en ligne", "Un service à domicile"]
};

const TOTAL_QUESTIONS = 10;
const BLOCS = ["TON PROJET", "TON PROJET", "TON PROJET", "TOI", "TOI", "TOI", "TON MARCHÉ", "TON MARCHÉ", "TON AMBITION", "TON AMBITION"];
const MAX_INPUT_LENGTH = 500;

const IMAGES = [
  "/hero-1.jpeg",
  "/hero-2.jpeg",
  "/hero-3.jpeg",
];

// Photo de couverture du business plan généré (homme pensif, ambiance sombre/chaude)
const COVER_IMAGE = "data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%20viewBox%3D%220%200%201400%201000%22%20preserveAspectRatio%3D%22xMidYMid%20slice%22%3E%3Cdefs%3E%3ClinearGradient%20id%3D%22sky%22%20x1%3D%220%22%20y1%3D%220%22%20x2%3D%220.6%22%20y2%3D%221%22%3E%3Cstop%20offset%3D%220%22%20stop-color%3D%22%233a3f4a%22/%3E%3Cstop%20offset%3D%220.55%22%20stop-color%3D%22%23262a33%22/%3E%3Cstop%20offset%3D%221%22%20stop-color%3D%22%2315171c%22/%3E%3C/linearGradient%3E%3CradialGradient%20id%3D%22warm%22%20cx%3D%220.7%22%20cy%3D%220.28%22%20r%3D%220.6%22%3E%3Cstop%20offset%3D%220%22%20stop-color%3D%22%23ff9d3d%22%20stop-opacity%3D%220.55%22/%3E%3Cstop%20offset%3D%220.4%22%20stop-color%3D%22%23ff7a2e%22%20stop-opacity%3D%220.18%22/%3E%3Cstop%20offset%3D%221%22%20stop-color%3D%22%23ff7a2e%22%20stop-opacity%3D%220%22/%3E%3C/radialGradient%3E%3ClinearGradient%20id%3D%22desk%22%20x1%3D%220%22%20y1%3D%220%22%20x2%3D%220%22%20y2%3D%221%22%3E%3Cstop%20offset%3D%220%22%20stop-color%3D%22%232c2f37%22/%3E%3Cstop%20offset%3D%221%22%20stop-color%3D%22%231a1c22%22/%3E%3C/linearGradient%3E%3ClinearGradient%20id%3D%22screenglow%22%20x1%3D%220%22%20y1%3D%220%22%20x2%3D%220%22%20y2%3D%221%22%3E%3Cstop%20offset%3D%220%22%20stop-color%3D%22%23ffb066%22/%3E%3Cstop%20offset%3D%221%22%20stop-color%3D%22%23ff7a2e%22/%3E%3C/linearGradient%3E%3C/defs%3E%3C%21--%20background%20--%3E%3Crect%20width%3D%221400%22%20height%3D%221000%22%20fill%3D%22url%28%23sky%29%22/%3E%3Crect%20width%3D%221400%22%20height%3D%221000%22%20fill%3D%22url%28%23warm%29%22/%3E%3C%21--%20window%20light%20streaks%20--%3E%3Cg%20opacity%3D%220.10%22%20fill%3D%22%23ffffff%22%3E%3Cpolygon%20points%3D%22900%2C0%201080%2C0%20760%2C1000%20600%2C1000%22/%3E%3Cpolygon%20points%3D%221140%2C0%201240%2C0%20980%2C1000%20870%2C1000%22/%3E%3C/g%3E%3C%21--%20desk%20--%3E%3Crect%20x%3D%220%22%20y%3D%22730%22%20width%3D%221400%22%20height%3D%22270%22%20fill%3D%22url%28%23desk%29%22/%3E%3Cline%20x1%3D%220%22%20y1%3D%22730%22%20x2%3D%221400%22%20y2%3D%22730%22%20stroke%3D%22%23454a55%22%20stroke-width%3D%223%22/%3E%3C%21--%20person%20silhouette%20%28lighter%2C%20with%20rim%20light%29%20--%3E%3Cg%3E%3Ccircle%20cx%3D%22520%22%20cy%3D%22430%22%20r%3D%2278%22%20fill%3D%22%233c424d%22/%3E%3Cpath%20d%3D%22M372%20730%20Q372%20558%20520%20536%20Q668%20558%20668%20730%20Z%22%20fill%3D%22%233c424d%22/%3E%3C%21--%20rim%20light%20--%3E%3Cpath%20d%3D%22M448%20478%20Q470%20405%20520%20396%22%20fill%3D%22none%22%20stroke%3D%22%237a8492%22%20stroke-width%3D%225%22%20stroke-linecap%3D%22round%22%20opacity%3D%220.8%22/%3E%3Cpath%20d%3D%22M642%20730%20Q662%20560%20560%20540%22%20fill%3D%22none%22%20stroke%3D%22%235a626f%22%20stroke-width%3D%225%22%20stroke-linecap%3D%22round%22%20opacity%3D%220.7%22/%3E%3C/g%3E%3C%21--%20laptop%20%28clear%2C%20glowing%29%20--%3E%3Cg%3E%3Cpath%20d%3D%22M452%20726%20L452%20604%20Q452%20592%20464%20592%20L596%20592%20Q608%20592%20608%20604%20L608%20726%20Z%22%20fill%3D%22%230f1013%22%20stroke%3D%22%235a626f%22%20stroke-width%3D%223%22/%3E%3Crect%20x%3D%22466%22%20y%3D%22606%22%20width%3D%22128%22%20height%3D%22104%22%20rx%3D%224%22%20fill%3D%22%231b1d24%22/%3E%3Crect%20x%3D%22480%22%20y%3D%22620%22%20width%3D%2284%22%20height%3D%229%22%20rx%3D%224.5%22%20fill%3D%22url%28%23screenglow%29%22/%3E%3Crect%20x%3D%22480%22%20y%3D%22638%22%20width%3D%22100%22%20height%3D%226%22%20rx%3D%223%22%20fill%3D%22%235a626f%22/%3E%3Crect%20x%3D%22480%22%20y%3D%22652%22%20width%3D%2286%22%20height%3D%226%22%20rx%3D%223%22%20fill%3D%22%235a626f%22/%3E%3Crect%20x%3D%22480%22%20y%3D%22666%22%20width%3D%22100%22%20height%3D%226%22%20rx%3D%223%22%20fill%3D%22%23444b57%22/%3E%3Crect%20x%3D%22480%22%20y%3D%22680%22%20width%3D%2264%22%20height%3D%226%22%20rx%3D%223%22%20fill%3D%22%23444b57%22/%3E%3Cpath%20d%3D%22M430%20726%20L630%20726%20L648%20746%20L412%20746%20Z%22%20fill%3D%22%2323252d%22%20stroke%3D%22%235a626f%22%20stroke-width%3D%223%22/%3E%3C%21--%20screen%20light%20spill%20--%3E%3Cellipse%20cx%3D%22530%22%20cy%3D%22700%22%20rx%3D%22150%22%20ry%3D%2240%22%20fill%3D%22%23ff7a2e%22%20opacity%3D%220.10%22/%3E%3C/g%3E%3C%21--%20coffee%20cup%20--%3E%3Cg%3E%3Cellipse%20cx%3D%22800%22%20cy%3D%22712%22%20rx%3D%2240%22%20ry%3D%2212%22%20fill%3D%22%2315171c%22/%3E%3Cpath%20d%3D%22M765%20706%20Q765%20662%20800%20662%20Q835%20662%20835%20706%20Z%22%20fill%3D%22%232a2d35%22%20stroke%3D%22%23565d68%22%20stroke-width%3D%223%22/%3E%3Cpath%20d%3D%22M835%20676%20Q860%20676%20860%20692%20Q860%20706%20838%20706%22%20fill%3D%22none%22%20stroke%3D%22%23565d68%22%20stroke-width%3D%224%22/%3E%3Cellipse%20cx%3D%22800%22%20cy%3D%22668%22%20rx%3D%2230%22%20ry%3D%228%22%20fill%3D%22%2315171c%22/%3E%3C%21--%20steam%20--%3E%3Cpath%20d%3D%22M792%20650%20Q786%20636%20794%20624%20Q800%20614%20794%20602%22%20fill%3D%22none%22%20stroke%3D%22%238a929e%22%20stroke-width%3D%222.5%22%20opacity%3D%220.4%22%20stroke-linecap%3D%22round%22/%3E%3Cpath%20d%3D%22M810%20650%20Q804%20636%20812%20624%22%20fill%3D%22none%22%20stroke%3D%22%238a929e%22%20stroke-width%3D%222.5%22%20opacity%3D%220.3%22%20stroke-linecap%3D%22round%22/%3E%3C/g%3E%3C%21--%20notebook%20%2B%20pen%20--%3E%3Cg%20transform%3D%22rotate%28-5%20960%20706%29%22%3E%3Crect%20x%3D%22880%22%20y%3D%22684%22%20width%3D%22160%22%20height%3D%2246%22%20rx%3D%225%22%20fill%3D%22%2333363f%22%20stroke%3D%22%23565d68%22%20stroke-width%3D%223%22/%3E%3Cline%20x1%3D%22900%22%20y1%3D%22698%22%20x2%3D%221018%22%20y2%3D%22698%22%20stroke%3D%22%234a505b%22%20stroke-width%3D%222.5%22/%3E%3Cline%20x1%3D%22900%22%20y1%3D%22710%22%20x2%3D%221018%22%20y2%3D%22710%22%20stroke%3D%22%234a505b%22%20stroke-width%3D%222.5%22/%3E%3Crect%20x%3D%221030%22%20y%3D%22676%22%20width%3D%2270%22%20height%3D%229%22%20rx%3D%224%22%20fill%3D%22%23ff7a2e%22%20opacity%3D%220.9%22/%3E%3C/g%3E%3C%21--%20plant%20--%3E%3Cg%3E%3Crect%20x%3D%22116%22%20y%3D%22700%22%20width%3D%2248%22%20height%3D%2234%22%20rx%3D%224%22%20fill%3D%22%232a2d35%22%20stroke%3D%22%234a505b%22%20stroke-width%3D%222%22/%3E%3Cpath%20d%3D%22M140%20700%20L140%20640%22%20stroke%3D%22%233f5a48%22%20stroke-width%3D%224%22/%3E%3Cpath%20d%3D%22M140%20660%20Q108%20628%2092%20652%20Q120%20664%20140%20678%22%20fill%3D%22%233a5644%22/%3E%3Cpath%20d%3D%22M140%20656%20Q172%20624%20190%20648%20Q160%20662%20140%20678%22%20fill%3D%22%23436149%22/%3E%3C/g%3E%3C/svg%3E";




const LOADING_STEPS = [
  { label: "LECTURE DE TES RÉPONSES", duration: 6000 },
  { label: "RECHERCHE DE DONNÉES RÉELLES", duration: 32000 },
  { label: "ANALYSE DU MARCHÉ", duration: 22000 },
  { label: "CALCUL DU MODÈLE ÉCONOMIQUE", duration: 22000 },
  { label: "CONSTRUCTION DE TA STRATÉGIE", duration: 18000 },
  { label: "RÉDACTION DU PLAN D'ACTION", duration: 18000 },
  { label: "DÉMARCHES LÉGALES & RISQUES", duration: 22000 },
  { label: "FINALISATION DU DOSSIER", duration: 10000 },
];

// Messages qui défilent — décrivent le VRAI travail effectué, sans rien inventer.
const ROTATING_MESSAGES = [
  "On lit attentivement tes réponses…",
  "On recherche des données réelles sur le web…",
  "On vérifie les aides et seuils légaux à jour…",
  "On analyse ton marché et tes concurrents…",
  "On calcule ton modèle économique…",
  "On construit ta stratégie marketing…",
  "On rédige ton plan d'action sur mesure…",
  "On rassemble les démarches légales…",
  "On met en forme ton dossier…",
];

// ─── LOADING SCREEN ────────────────────────────────────────────────────────────

function LoadingScreen({ isOrange }) {
  const [stepIndex, setStepIndex] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [msgIndex, setMsgIndex] = useState(0);
  const isMobile = window.innerWidth < 768;
  const ACC = isOrange ? "#ff7a2e" : "#fff";
  const ACC_GRAD = isOrange ? "linear-gradient(90deg,#ff9d3d,#ff5e3a)" : "#fff";

  useEffect(() => {
    const timer = setInterval(() => setElapsed(e => e + 1), 1000);
    const msgTimer = setInterval(() => setMsgIndex(i => (i + 1) % ROTATING_MESSAGES.length), 6000);
    let cumulative = 0;
    const timers = LOADING_STEPS.slice(0, -1).map((step, i) => {
      cumulative += step.duration;
      return setTimeout(() => setStepIndex(i + 1), cumulative);
    });
    return () => { clearInterval(timer); clearInterval(msgTimer); timers.forEach(clearTimeout); };
  }, []);

  // Progression asymptotique : avance vite au début puis ralentit, sans jamais
  // se figer ni atteindre 100%. Elle ne ment pas sur un temps précis — c'est la
  // vraie fin de génération (loading=false) qui fait disparaître cet écran.
  // ~63% à 60s, ~86% à 150s, tend vers 96% sans l'atteindre.
  const globalProgress = Math.min(96 * (1 - Math.exp(-elapsed / 75)), 96);
  const formatTime = s => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  return (
    <div style={{ minHeight: "100vh", background: "#222227", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "0 32px" }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse3 { 0%,100%{opacity:1} 50%{opacity:0.3} }
      `}</style>

      <div style={{ width: "100%", maxWidth: 520, border: "1px solid rgba(255,255,255,0.12)", borderRadius: 12, background: "rgba(255,255,255,0.025)", padding: isMobile ? "40px 24px" : "52px 48px", display: "flex", flexDirection: "column", alignItems: "center" }}>

      <div style={{ marginBottom: 48, textAlign: "center" }}>
        <div style={{ fontSize: 10, letterSpacing: "0.3em", color: "rgba(255,255,255,0.25)", marginBottom: 8, fontWeight: 900 }}>PLANSTART</div>
        <div style={{ fontSize: isMobile ? 13 : 15, letterSpacing: "0.15em", color: "rgba(255,255,255,0.5)", fontWeight: 900 }}>GÉNÉRATION DE TON BUSINESS PLAN</div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 40 }}>
        <div style={{ width: 32, height: 32, border: "3px solid rgba(255,255,255,0.1)", borderTop: `3px solid ${ACC}`, borderRadius: "50%", animation: "spin 0.8s linear infinite", flexShrink: 0 }} />
        <div>
          <div style={{ fontSize: isMobile ? 13 : 16, fontWeight: 900, color: "#fff", letterSpacing: "0.05em" }}>{LOADING_STEPS[stepIndex].label}</div>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", marginTop: 4, fontFamily: "Arial, sans-serif" }}>Étape {stepIndex + 1} sur {LOADING_STEPS.length}</div>
        </div>
      </div>

      <div style={{ width: "100%", maxWidth: 440, marginBottom: 32 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
          <span style={{ fontSize: 10, fontWeight: 900, color: "rgba(255,255,255,0.3)", letterSpacing: "0.1em" }}>PROGRESSION</span>
          <span style={{ fontSize: 10, fontWeight: 900, color: isOrange ? "#ff7a2e" : "rgba(255,255,255,0.3)" }}>{Math.round(globalProgress)}%</span>
        </div>
        <div style={{ height: 3, background: "rgba(255,255,255,0.08)", borderRadius: 2 }}>
          <div style={{ height: "100%", width: `${globalProgress}%`, background: ACC_GRAD, borderRadius: 2, transition: "width 1s ease" }} />
        </div>
      </div>

      <div style={{ width: "100%", maxWidth: 440 }}>
        {LOADING_STEPS.map((step, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 14, padding: "9px 0", borderBottom: i < LOADING_STEPS.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none", opacity: i > stepIndex ? 0.2 : 1, transition: "opacity 0.3s" }}>
            <div style={{ width: 18, height: 18, borderRadius: "50%", flexShrink: 0, background: i < stepIndex ? ACC : "transparent", border: i < stepIndex ? "none" : i === stepIndex ? `2px solid ${ACC}` : "2px solid rgba(255,255,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              {i < stepIndex && <span style={{ fontSize: 9, color: isOrange ? "#fff" : "#000", fontWeight: 900 }}>✓</span>}
              {i === stepIndex && <div style={{ width: 5, height: 5, borderRadius: "50%", background: ACC, animation: "pulse3 1.2s infinite" }} />}
            </div>
            <span style={{ fontSize: 11, fontWeight: 900, color: i <= stepIndex ? "#fff" : "rgba(255,255,255,0.2)", letterSpacing: "0.08em" }}>{step.label}</span>
          </div>
        ))}
      </div>

      {/* Message vivant qui défile */}
      <div style={{ marginTop: 36, minHeight: 20, fontSize: isMobile ? 13 : 14, color: "rgba(255,255,255,0.6)", fontFamily: "Arial, sans-serif", textAlign: "center", transition: "opacity 0.4s" }}>
        {ROTATING_MESSAGES[msgIndex]}
      </div>

      {/* Temps bien visible */}
      <div style={{ marginTop: 20, textAlign: "center" }}>
        <div style={{ fontSize: isMobile ? 32 : 40, fontWeight: 900, color: "#fff", letterSpacing: "0.02em", lineHeight: 1 }}>{formatTime(elapsed)}</div>
        <div style={{ fontSize: 10, fontWeight: 900, letterSpacing: "0.18em", color: "rgba(255,255,255,0.35)", marginTop: 6 }}>TEMPS ÉCOULÉ</div>
      </div>

      {/* Mention honnête : pourquoi c'est long */}
      <div style={{ marginTop: 24, fontSize: 11, color: "rgba(255,255,255,0.3)", fontFamily: "Arial, sans-serif", textAlign: "center", lineHeight: 1.5, maxWidth: 380 }}>
        La génération prend environ 2 minutes : on recherche de vraies données sur le web pour ton projet. Ne quitte pas cette page.
      </div>

      </div>
    </div>
  );
}

// ─── APP PRINCIPAL ─────────────────────────────────────────────────────────────

export default function App() {
  const [screen, setScreen] = useState("home");
  const [menuOpen, setMenuOpen] = useState(false); // menu déroulant Basic/Business
  const [theme, setTheme] = useState("bw"); // "bw" (noir/blanc) ou "orange"
  const [introStep, setIntroStep] = useState(0);
  const [introLetters, setIntroLetters] = useState("");
  const [slideIndex, setSlideIndex] = useState(0);
  const [qIndex, setQIndex] = useState(0);
  const [questions, setQuestions] = useState([FIRST_QUESTION]);
  const [answers, setAnswers] = useState({});
  const [current, setCurrent] = useState("");
  const [blocTransition, setBlocTransition] = useState(false);
  const [showBloc, setShowBloc] = useState("");
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [loading, setLoading] = useState(false);
  const [loadingQuestion, setLoadingQuestion] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [showIosHint, setShowIosHint] = useState(false);
  const [shareToast, setShareToast] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [navMenuOpen, setNavMenuOpen] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  const inputRef = useRef(null);

  // ─── THÈME : accent orange ou noir/blanc ───
  const isOrange = theme === "orange";
  const ACCENT = isOrange ? "#ff7a2e" : "#000";
  const ACCENT_GRAD = isOrange ? "linear-gradient(90deg,#ff9d3d,#ff5e3a)" : "#fff";
  const NOW_COLOR = isOrange ? "#ff7a2e" : "rgba(255,255,255,0.72)";
  const ACCENT_ON_DARK = isOrange ? "#ff7a2e" : "#fff"; // accents sur fond sombre (quiz)
  const CREAM = "#fcfcfc";        // blanc doux principal (neutre, sans teinte beige)
  const CREAM_ALT = "#f6f6f7";    // blanc doux secondaire (sections / cartes décalées)
  const DARK = "#222227";         // gris foncé pour les grands blocs (au lieu du noir pur)


  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Sauvegarder les réponses dans sessionStorage
  useEffect(() => {
    if (Object.keys(answers).length > 0) {
      sessionStorage.setItem("planstart_answers", JSON.stringify(answers));
      sessionStorage.setItem("planstart_questions", JSON.stringify(questions));
    }
  }, [answers, questions]);

  useEffect(() => {
    if (screen !== "intro") return;
    const word = "PLANSTART";
    let i = 0;
    const t = setInterval(() => { i++; setIntroLetters(word.slice(0, i)); if (i >= word.length) clearInterval(t); }, 100);
    const timers = [
      setTimeout(() => setIntroStep(1), 100),
      setTimeout(() => setIntroStep(2), 1200),
      setTimeout(() => setIntroStep(3), 1900),
      setTimeout(() => setIntroStep(4), 2600),
    ];
    return () => { clearInterval(t); timers.forEach(clearTimeout); };
  }, [screen]);

  useEffect(() => {
    if (screen !== "home" && screen !== "quiz") return;
    const t = setInterval(() => setSlideIndex(i => (i + 1) % IMAGES.length), 5000);
    return () => clearInterval(t);
  }, [screen]);

  useEffect(() => {
    if (screen === "quiz" && inputRef.current) inputRef.current.focus();
  }, [screen, qIndex]);

  // ─── API CALLS (vers le backend sécurisé) ────────────────────────────────────

  const generateNextQuestion = async (currentAnswers, currentQuestions) => {
    setLoadingQuestion(true);
    try {
      const history = currentQuestions.map((q, i) => ({
        question: q.question,
        reponse: (currentAnswers[i] || "").slice(0, MAX_INPUT_LENGTH),
      })).filter(q => q.reponse);

      const nextNum = currentQuestions.length + 1;
      const bloc = BLOCS[currentQuestions.length] || "TON AMBITION";

      const response = await fetch("/api/question", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ history, nextNum, bloc }),
      });

      if (!response.ok) throw new Error("API error");
      const parsed = await response.json();

      setQuestions(prev => [...prev, {
        label: String(nextNum).padStart(2, "0"),
        bloc,
        question: parsed.question,
        placeholder: parsed.placeholder,
        examples: parsed.examples || [],
      }]);
    } catch (err) {
      console.error(err);
      const fallbacks = [
        { question: "Quel problème concret tu règles pour tes clients ?", placeholder: "Ex: il n'y a pas de service adapté dans ma ville..." },
        { question: "Qu'est-ce qui rend ton projet différent de ce qui existe ?", placeholder: "Ex: je propose quelque chose que personne ne fait encore..." },
        { question: "Parle-moi de ton parcours et tes compétences", placeholder: "Ex: 5 ans d'expérience dans ce domaine..." },
        { question: "Quelle est ta situation actuelle et pourquoi tu veux te lancer ?", placeholder: "Ex: je suis salarié mais je veux mon indépendance..." },
        { question: "Quelles ressources as-tu disponibles ?", placeholder: "Ex: 5000€ d'économies, je peux y consacrer mes weekends..." },
        { question: "Décris précisément tes clients idéaux", placeholder: "Ex: des hommes de 25-45 ans dans ma ville..." },
        { question: "Qui sont tes concurrents et quelles sont leurs faiblesses ?", placeholder: "Ex: 3 concurrents mais ils sont chers et peu accueillants..." },
        { question: "Quel est ton budget de départ et comment tu peux le financer ?", placeholder: "Ex: 3000€ d'économies + prêt famille de 5000€..." },
        { question: "Dans 12 mois, à quoi ressemble le succès pour toi ?", placeholder: "Ex: 2500€ nets par mois et avoir quitté mon emploi..." },
      ];
      const fallback = fallbacks[Math.min(questions.length - 1, fallbacks.length - 1)];
      setQuestions(prev => [...prev, {
        label: String(prev.length + 1).padStart(2, "0"),
        bloc: BLOCS[prev.length] || "TON AMBITION",
        question: fallback.question,
        placeholder: fallback.placeholder,
        examples: [],
      }]);
    } finally {
      setLoadingQuestion(false);
    }
  };

  const generatePlan = async (finalAnswers) => {
    setLoading(true);
    setScreen("result");
    setError(null);
    try {
      const sanitized = {};
      for (const [k, v] of Object.entries(finalAnswers)) {
        sanitized[k] = (v || "").slice(0, MAX_INPUT_LENGTH);
      }

      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          answers: sanitized,
          questions: questions.map(q => ({ question: q.question })),
        }),
      });

      if (response.status === 429) {
        throw new Error("Trop de générations. Réessaie dans 1 heure.");
      }
      if (!response.ok) throw new Error("Erreur lors de la génération");

      const parsed = await response.json();
      setResult(parsed);
      sessionStorage.removeItem("planstart_answers");
      sessionStorage.removeItem("planstart_questions");
    } catch (err) {
      console.error(err);
      setError(err.message || "Une erreur est survenue. Réessaie.");
    } finally {
      setLoading(false);
    }
  };

  // ─── NAVIGATION ───────────────────────────────────────────────────────────────

  const handleNext = async () => {
    const newAnswers = { ...answers, [qIndex]: current.slice(0, MAX_INPUT_LENGTH) };
    setAnswers(newAnswers);
    const nextIndex = qIndex + 1;

    if (nextIndex >= TOTAL_QUESTIONS) {
      generatePlan(newAnswers);
      return;
    }

    const currentBloc = questions[qIndex]?.bloc;
    const nextBloc = BLOCS[nextIndex];
    if (nextBloc !== currentBloc) {
      setBlocTransition(true);
      setShowBloc(nextBloc);
      setTimeout(() => setBlocTransition(false), 1800);
    }

    if (!questions[nextIndex]) {
      await generateNextQuestion(newAnswers, questions);
    }

    setCurrent(answers[nextIndex] || "");
    setQIndex(nextIndex);
  };

  const handleBack = () => {
    if (qIndex > 0) { setAnswers({ ...answers, [qIndex]: current }); setQIndex(qIndex - 1); setCurrent(answers[qIndex - 1] || ""); }
    else setScreen("home");
  };

  const restart = () => {
    setScreen("home"); setQIndex(0); setAnswers({}); setCurrent("");
    setBlocTransition(false); setQuestions([FIRST_QUESTION]); setResult(null); setError(null);
  };

  // ─── SHARE ────────────────────────────────────────────────────────────────────

  const handleShare = () => {
    const text = `J'ai généré le business plan de mon projet "${result?.nom}" avec PLANSTART 🚀 Génère le tien gratuitement → planstart.fr`;
    if (navigator.share) {
      navigator.share({ title: "Mon Business Plan PLANSTART", text, url: "https://planstart.fr" });
    } else {
      navigator.clipboard.writeText(text);
      setShareToast(true);
      setTimeout(() => setShareToast(false), 3000);
    }
  };

  // ─── PDF ──────────────────────────────────────────────────────────────────────

  const downloadPDF = async (data) => {
    const date = new Date().toLocaleDateString("fr-FR");
    const escape = str => (str || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    const sections = data.sections || [];
    // Thème du document : suit le thème actif du site (à brancher plus tard). Défaut = N&B.
    const themeClass = theme === "orange" ? "theme-orange" : "";

    const html = `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<title>Business Plan — ${escape(data.nom)}</title>
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family:Arial,sans-serif; color:#1a1a1a; background:#fff; font-size:13px; line-height:1.6; word-wrap:break-word; overflow-wrap:break-word; }
  @page { size:A4; margin:0; }
  @media print {
    html, body { margin:0 !important; padding:0 !important; }
    body { -webkit-print-color-adjust:exact; print-color-adjust:exact; }
    .cover { page-break-after:always; break-after:page; }
    .toc { page-break-after:always; break-after:page; }
    .section { page-break-before:always; break-before:page; }
    .point { page-break-inside:avoid; break-inside:avoid; }
    .section-title, .section-intro, .section-num { page-break-after:avoid; break-after:avoid; }
    .section { padding-top:60px; }
  }
  .theme-orange .section-title { border-bottom-color:#ff7a2e; }
  .theme-orange .section-intro { border-left-color:#ff7a2e; }
  .theme-orange .section-num { color:#ff7a2e; }
  .theme-orange .toc-num { color:#ff7a2e; }
  a { color:#0a58ca; word-break:break-all; }

  /* COUVERTURE */
  .cover { position:relative; min-height:297mm; background:#000; color:#fff; display:flex; flex-direction:column; justify-content:space-between; padding:60px; box-sizing:border-box; overflow:hidden; }
  .cover-photo { position:absolute; inset:0; background-image:url("${COVER_IMAGE}"); background-size:cover; background-position:72% center; z-index:0; }
  .cover-veil { position:absolute; inset:0; z-index:1; background:linear-gradient(90deg, rgba(0,0,0,0.86) 0%, rgba(0,0,0,0.66) 48%, rgba(0,0,0,0.32) 74%, rgba(0,0,0,0.12) 100%); }
  .cover > div { position:relative; z-index:2; }
  .cover-brand { font-size:15px; font-weight:900; letter-spacing:0.04em; color:#fff; margin-bottom:4px; }
  .cover-brand .s { color:#fff; }
  .cover-label { font-size:10px; font-weight:900; letter-spacing:0.22em; color:rgba(255,255,255,0.55); margin-bottom:18px; }
  .cover-bar { width:42px; height:4px; background:#fff; margin-bottom:44px; }
  .cover-activite { font-size:46px; font-weight:900; letter-spacing:-0.02em; line-height:1.0; margin-bottom:18px; color:#fff; text-transform:uppercase; }
  .cover-now { color:#9a9a9a; font-style:italic; }
  .cover-expl { max-width:480px; color:rgba(255,255,255,0.6); font-size:13px; line-height:1.7; margin-bottom:30px; padding-left:16px; border-left:3px solid rgba(255,255,255,0.25); }
  .cover-crit-lbl { font-size:12px; font-weight:900; letter-spacing:0.04em; color:#fff; margin-bottom:14px; }
  .cover-crit-box { border:1px solid rgba(255,255,255,0.2); border-radius:10px; padding:18px 22px; width:480px; max-width:62%; background:rgba(0,0,0,0.35); margin-bottom:30px; }
  .cover-crit-inner-lbl { font-size:8px; font-weight:900; letter-spacing:0.14em; color:rgba(255,255,255,0.5); margin-bottom:12px; }
  .cover-crit-table { border-collapse:collapse; width:100%; table-layout:fixed; }
  .cover-crit-table td { padding:7px 0; font-size:11px; vertical-align:middle; }
  .cover-crit-table td:first-child { color:rgba(255,255,255,0.75); width:120px; }
  .cover-crit-bar-bg { width:100%; height:5px; background:rgba(255,255,255,0.14); border-radius:3px; }
  .cover-crit-bar { height:5px; border-radius:3px; }
  .cover-crit-table td:last-child { font-weight:900; color:#fff; text-align:right; padding-left:14px; width:42px; }
  .cover-crit-row { display:flex; justify-content:space-between; margin-bottom:26px; gap:0; }
  .cover-crit-cell { flex:1; text-align:center; padding:0 4px; border-left:1px solid rgba(255,255,255,0.18); }
  .cover-crit-cell:first-child { border-left:none; }
  .cover-crit-cell .cl { font-size:8px; font-weight:900; letter-spacing:0.05em; color:rgba(255,255,255,0.6); }
  .cover-crit-cell .cv { font-size:15px; font-weight:900; color:#fff; margin-top:4px; }
  .cover-disclaimer { font-size:10px; color:rgba(255,255,255,0.3); line-height:1.55; max-width:480px; padding-top:18px; border-top:1px solid rgba(255,255,255,0.12); margin-bottom:24px; }
  .cover-footer { display:flex; justify-content:space-between; align-items:flex-end; border-top:1px solid rgba(255,255,255,0.15); padding-top:18px; font-size:11px; color:rgba(255,255,255,0.45); }
  .cover-footer .web { color:#fff; font-weight:900; }

  /* ACCENTS ORANGE (si thème orange) */
  .theme-orange .cover-brand .s { color:#ff7a2e; }
  .theme-orange .cover-bar { background:#ff7a2e; }
  .theme-orange .cover-now { color:#ff7a2e; }
  .theme-orange .cover-crit-box { border-color:#ff7a2e; }
  .theme-orange .cover-crit-cell .cv { color:#ff7a2e; }
  .theme-orange .cover-footer .web { color:#ff7a2e; }
  .theme-orange .cover-footer { border-top-color:rgba(255,122,46,0.5); }

  /* SOMMAIRE */
  .toc { padding:60px; }
  .toc-title { font-size:9px; font-weight:900; letter-spacing:0.25em; color:rgba(0,0,0,0.25); margin-bottom:36px; }
  .toc-item { display:flex; justify-content:space-between; align-items:center; padding:14px 0; border-bottom:1px solid #f0f0f0; }
  .toc-num { font-size:10px; font-weight:900; color:rgba(0,0,0,0.2); min-width:28px; }
  .toc-name { font-size:14px; font-weight:900; flex:1; }
  .toc-pg { font-size:11px; color:rgba(0,0,0,0.3); }

  /* SECTIONS */
  .section { padding:56px 52px; }
  .section-num { font-size:9px; font-weight:900; letter-spacing:0.2em; color:rgba(0,0,0,0.2); margin-bottom:6px; }
  .section-title { font-size:22px; font-weight:900; letter-spacing:-0.01em; border-bottom:3px solid #000; padding-bottom:14px; margin-bottom:20px; }
  .section-intro { font-size:13px; color:rgba(0,0,0,0.55); font-style:italic; line-height:1.6; margin-bottom:28px; border-left:3px solid #000; padding-left:14px; }
  .point { display:flex; flex-wrap:wrap; gap:8px 16px; padding:13px 0; border-bottom:1px solid #f5f5f5; page-break-inside:avoid; }
  .point-label { font-size:12px; font-weight:900; min-width:140px; max-width:180px; color:#000; flex-shrink:0; word-break:break-word; }
  .point-text { font-size:13px; color:rgba(0,0,0,0.65); line-height:1.65; flex:1; min-width:200px; overflow-wrap:break-word; word-break:break-word; }

  /* FOOTER */
  .pg-footer { text-align:center; font-size:9px; color:rgba(0,0,0,0.2); font-weight:900; letter-spacing:0.1em; border-top:1px solid #e5e5e5; padding-top:14px; margin-top:36px; }
</style>
</head>
<body class="${themeClass}">

<div class="cover">
  <div class="cover-photo"></div>
  <div class="cover-veil"></div>
  <div>
    <div class="cover-brand">PLAN<span class="s">START</span></div>
    <div class="cover-label">BUSINESS PLAN PROFESSIONNEL</div>
    <div class="cover-bar"></div>
    <div class="cover-activite">${escape(data.titre || data.nom || data.activite || "Mon projet")}<br><span class="cover-now">Maintenant.</span></div>
    <div class="cover-disclaimer">Ce business plan a été généré par intelligence artificielle à partir de tes réponses. Il est fourni à titre indicatif et peut contenir des erreurs ou imprécisions. Les montants chiffrés (loyers, charges, projections) sont des estimations à confirmer auprès de sources officielles avant de te lancer.</div>
  </div>
  <div class="cover-footer">
    <div>Document confidentiel<br>Généré le ${date}</div>
    <div style="text-align:right" class="web">planstart.fr</div>
  </div>
</div>

<div class="toc">
  <div class="toc-title">SOMMAIRE</div>
  ${sections.map((s, i) => `
  <div class="toc-item">
    <span class="toc-num">${String(i + 1).padStart(2, "0")}</span>
    <span class="toc-name">${escape(s.titre)}</span>
    <span class="toc-pg">Page ${i + 3}</span>
  </div>`).join("")}
</div>

${sections.map((s, i) => {
  const points = s.points || [];
  return `
<div class="section">
  <div class="section-num">SECTION ${String(i + 1).padStart(2, "0")} / ${String(sections.length).padStart(2, "0")}</div>
  <div class="section-title">${escape(s.titre)}</div>
  ${s.intro ? `<div class="section-intro">${escape(s.intro)}</div>` : ""}
  ${points.map(p => {
    const m = (p || "").match(/^\*\*(.+?)\*\*\s*:?\s*([\s\S]*)/);
    if (m) return `<div class="point"><div class="point-label">${escape(m[1])}</div><div class="point-text">${linkifyHtml(escape(m[2].replace(/\*\*/g, "")))}</div></div>`;
    return `<div class="point"><div class="point-text">${linkifyHtml(escape(p.replace(/\*\*/g, "")))}</div></div>`;
  }).join("")}
  <div class="pg-footer">PLANSTART — ${escape(data.nom)} — Page ${i + 3}</div>
</div>`;
}).join("")}

</body>
</html>`;

    const filename = `${(data.titre || data.nom || "BusinessPlan").replace(/[^\wÀ-ÿ]+/g, "_").replace(/^_+|_+$/g, "")}_PLANSTART.html`;
    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);

    const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent) ||
      (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

    if (isIOS) {
      // Sur iOS, Safari ignore l'attribut "download". On ouvre le fichier dans un
      // nouvel onglet : l'utilisateur fait Partager → "Enregistrer dans Fichiers".
      setShowIosHint(true);
      window.open(url, "_blank");
      setTimeout(() => URL.revokeObjectURL(url), 60000);
      return;
    }

    // PC / Android : téléchargement direct du fichier HTML.
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  // ─── STYLES ───────────────────────────────────────────────────────────────────

  const sectionPad = isMobile ? "32px 20px" : "44px 60px";

  // ─── HOME (reproduction maquette) : orange unique + helper d'icônes ───
  const OR = "#FF5A1F";
  const BK = "#161616";
  const Ic = ({ s = 22, c = OR, sw = 2, fill = "none", children }) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill={fill} stroke={c} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">{children}</svg>
  );
  const navLight = screen === "home" && !scrolled;

  return (
    <div style={{ background: CREAM, minHeight: "100vh", fontFamily: "'Arial Black', Arial, sans-serif", color: "#000", overflowX: "hidden" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&display=swap');
        @keyframes fadeIn { from{opacity:0} to{opacity:1} }
        @keyframes slideUp { from{opacity:0;transform:translateY(40px)} to{opacity:1;transform:translateY(0)} }
        @keyframes slideDown { from{opacity:0;transform:translateY(-20px)} to{opacity:1;transform:translateY(0)} }
        @keyframes barGrow { from{width:0} to{width:100%} }
        @keyframes scaleIn { from{opacity:0;transform:scale(0.95)} to{opacity:1;transform:scale(1)} }
        @keyframes pulse2 { 0%,100%{opacity:1} 50%{opacity:0.3} }
        @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.6;transform:scale(0.9)} }
        @keyframes spinQ { to{transform:rotate(360deg)} }
        * { box-sizing:border-box; margin:0; padding:0; }
        textarea,input { outline:none; }
        button { cursor:pointer; font-family:'Arial Black',Arial,sans-serif; }
        ::placeholder { color:rgba(255,255,255,0.3); font-family:Arial,sans-serif; font-weight:400; }
        .input-light::placeholder { color:rgba(0,0,0,0.3); }
        .example-pill:hover { border-color:#fff!important; color:#fff!important; }
        .feature-card-sep { border-right:1px solid #ededed; }
      `}</style>

      {/* ── INTRO ── */}
      {screen === "intro" && (
        <div style={{ position: "fixed", inset: 0, zIndex: 1000, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", overflow: "hidden" }}>
          <div style={{ position: "absolute", inset: 0, backgroundImage: `url(${IMAGES[0]})`, backgroundSize: "cover", backgroundPosition: "center", opacity: introStep >= 1 ? 1 : 0, transition: "opacity 1.2s ease", filter: "brightness(0.35)" }} />
          <div style={{ position: "relative", textAlign: "center", padding: "0 32px" }}>
            <div style={{ fontSize: isMobile ? "clamp(64px,18vw,100px)" : "clamp(80px,12vw,140px)", fontWeight: 900, color: "#fff", letterSpacing: "-0.03em", lineHeight: 0.85, marginBottom: 32 }}>
              {introLetters.slice(0, 4)}{introLetters.length > 4 && <br />}{introLetters.slice(4)}
            </div>
            <div style={{ marginBottom: 48 }}>
              {[{ text: "TON IDÉE MÉRITE D'EXISTER.", step: 2 }, { text: "ON T'AIDE À LA STRUCTURER.", step: 3 }].map((line, i) => (
                <div key={i} style={{ fontSize: isMobile ? 13 : 15, color: "rgba(255,255,255,0.75)", fontWeight: 900, letterSpacing: "0.08em", marginBottom: 8, opacity: introStep >= line.step ? 1 : 0, transform: introStep >= line.step ? "translateY(0)" : "translateY(10px)", transition: `all 0.6s ease ${i * 0.2}s` }}>{line.text}</div>
              ))}
            </div>
            <button onClick={() => setScreen("home")} style={{ opacity: introStep >= 4 ? 1 : 0, transform: introStep >= 4 ? "translateY(0)" : "translateY(10px)", transition: "all 0.6s ease", background: "#fff", color: "#000", border: "none", padding: isMobile ? "16px 48px" : "18px 56px", fontSize: 13, fontWeight: 900, letterSpacing: "0.15em" }}>ENTRER →</button>
          </div>
        </div>
      )}

      {/* ── NAV ── */}
      {screen !== "intro" && (
        <nav style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 100, background: (screen === "quiz") ? "rgba(11,10,20,0.92)" : (navLight ? "transparent" : "rgba(252,252,252,0.97)"), backdropFilter: navLight ? "none" : "blur(10px)", borderBottom: navLight ? "1px solid transparent" : `1px solid ${(screen === "quiz") ? "rgba(255,122,46,0.15)" : "#ededed"}`, padding: `0 ${isMobile ? "16px" : "60px"}`, height: 64, display: "flex", justifyContent: "space-between", alignItems: "center", animation: "fadeIn 0.4s ease both", transition: "background 0.3s ease, border-color 0.3s ease" }}>
          {(() => {
            const lightTxt = screen === "quiz" || navLight;   // texte/logo blancs
            const txt = lightTxt ? "#fff" : "#000";
            const muted = lightTxt ? "rgba(255,255,255,0.55)" : "rgba(0,0,0,0.4)";
            const chev = lightTxt ? "rgba(255,255,255,0.6)" : "rgba(0,0,0,0.5)";
            return (
          <>
          <div style={{ position: "relative" }}>
            <button onClick={() => setMenuOpen(o => !o)} style={{ background: "none", border: "none", display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
              <div style={{ width: 34, height: 34, borderRadius: "50%", background: lightTxt ? "#fff" : "#000", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <span style={{ color: lightTxt ? "#000" : "#fff", fontSize: 11, fontWeight: 900 }}>PS</span>
              </div>
              <span style={{ fontSize: isMobile ? 15 : 18, fontWeight: 900, color: txt }}>PLAN<span style={{ color: OR }}>START</span></span>
              {(screen === "home" || screen === "quiz") && (
                <span style={{ fontSize: isMobile ? 13 : 16, fontWeight: 900, letterSpacing: "0.02em", color: muted, marginLeft: 4 }}>BASIC</span>
              )}
              <span style={{ fontSize: 9, color: chev, marginLeft: 2, transform: menuOpen ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}>▼</span>
            </button>

            {/* MENU DÉROULANT Basic */}
            {menuOpen && (
              <>
                <div onClick={() => setMenuOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 110 }} />
                <div style={{ position: "absolute", top: 48, left: 0, zIndex: 120, background: "#fff", borderRadius: 16, boxShadow: "0 16px 40px rgba(0,0,0,0.18)", border: "1px solid #eee", overflow: "hidden", width: 320, animation: "slideDown 0.2s ease both" }}>
                  <div style={{ display: "flex", alignItems: "center", borderBottom: "1px solid #efefef", background: "#f6f6f7" }}>
                    <button onClick={() => { setMenuOpen(false); restart(); }} style={{ flex: 1, textAlign: "left", background: "transparent", border: "none", padding: "16px 18px", display: "flex", flexDirection: "column", gap: 3, cursor: "pointer" }}>
                      <span style={{ fontSize: 14, fontWeight: 900, color: "#000" }}>PLANSTART BASIC</span>
                      <span style={{ fontSize: 11, color: "rgba(0,0,0,0.5)", fontFamily: "Arial, sans-serif" }}>Génère ton business plan</span>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* DROITE : desktop = liens + bouton · mobile = hamburger */}
          {screen !== "quiz" && (!isMobile ? (
            <div style={{ display: "flex", gap: 30, alignItems: "center" }}>
              {screen === "home" && (<>
                <a href="#comment" style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.08em", color: txt, textDecoration: "none", whiteSpace: "nowrap" }}>COMMENT ÇA MARCHE</a>
                <a href="#apropos" style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.08em", color: txt, textDecoration: "none", whiteSpace: "nowrap" }}>À PROPOS</a>
                <button onClick={() => setScreen("quiz")} style={{ background: OR, color: "#fff", border: "none", padding: "11px 22px", fontSize: 11, fontWeight: 800, letterSpacing: "0.06em", borderRadius: 10, cursor: "pointer", whiteSpace: "nowrap" }}>CRÉER MON PLAN →</button>
              </>)}
            </div>
          ) : (
            screen === "home" && (
              <div style={{ position: "relative" }}>
                <button onClick={() => setNavMenuOpen(o => !o)} aria-label="Menu" style={{ background: "none", border: "none", display: "flex", flexDirection: "column", gap: 5, padding: 6, cursor: "pointer" }}>
                  <span style={{ width: 24, height: 2.5, borderRadius: 2, background: txt, transition: "background 0.3s" }} />
                  <span style={{ width: 24, height: 2.5, borderRadius: 2, background: txt, transition: "background 0.3s" }} />
                  <span style={{ width: 24, height: 2.5, borderRadius: 2, background: txt, transition: "background 0.3s" }} />
                </button>
                {navMenuOpen && (
                  <>
                    <div onClick={() => setNavMenuOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 110 }} />
                    <div style={{ position: "absolute", top: 44, right: 0, zIndex: 120, background: "#fff", borderRadius: 14, boxShadow: "0 16px 40px rgba(0,0,0,0.18)", border: "1px solid #eee", overflow: "hidden", width: 230, animation: "slideDown 0.2s ease both" }}>
                      <a href="#comment" onClick={() => setNavMenuOpen(false)} style={{ display: "block", padding: "15px 18px", fontSize: 12, fontWeight: 800, letterSpacing: "0.05em", color: "#161616", textDecoration: "none", borderBottom: "1px solid #f0f0f0" }}>COMMENT ÇA MARCHE</a>
                      <a href="#apropos" onClick={() => setNavMenuOpen(false)} style={{ display: "block", padding: "15px 18px", fontSize: 12, fontWeight: 800, letterSpacing: "0.05em", color: "#161616", textDecoration: "none", borderBottom: "1px solid #f0f0f0" }}>À PROPOS</a>
                      <button onClick={() => { setNavMenuOpen(false); setScreen("quiz"); }} style={{ width: "100%", textAlign: "left", background: OR, color: "#fff", border: "none", padding: "15px 18px", fontSize: 12, fontWeight: 800, letterSpacing: "0.05em", cursor: "pointer" }}>CRÉER MON PLAN →</button>
                    </div>
                  </>
                )}
              </div>
            )
          ))}
          </>
            );
          })()}
        </nav>
      )}

      {/* ── HOME ── */}
      {screen === "home" && (
        <div style={{ animation: "fadeIn 0.5s ease both", fontFamily: "'Manrope', sans-serif", letterSpacing: "-0.01em", color: "#18181B" }}>

          {/* ════════ HERO ════════ */}
          <div style={{ position: "relative", minHeight: isMobile ? "92vh" : "94vh", overflow: "hidden" }}>
            {IMAGES.map((img, i) => (
              <div key={i} style={{ position: "absolute", inset: 0, backgroundImage: `url(${img})`, backgroundSize: "cover", backgroundPosition: "center", opacity: i === slideIndex ? 1 : 0, transition: "opacity 1.6s ease" }} />
            ))}
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(90deg, rgba(10,9,8,0.86) 0%, rgba(10,9,8,0.62) 48%, rgba(10,9,8,0.40) 100%)" }} />
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, rgba(10,9,8,0.35), rgba(10,9,8,0) 30%, rgba(10,9,8,0.55))" }} />
            <div style={{ position: "relative", zIndex: 2, maxWidth: 1240, margin: "0 auto", minHeight: isMobile ? "92vh" : "94vh", display: "flex", flexDirection: "column", justifyContent: "center", padding: isMobile ? "90px 24px 120px" : "100px 60px 150px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 20 }}>
                <span style={{ width: 9, height: 9, borderRadius: "50%", background: OR, flexShrink: 0 }} />
                <span style={{ fontSize: isMobile ? 13 : 14, color: "rgba(255,255,255,0.82)", fontWeight: 600 }}>Ton idée mérite d'exister. On t'aide à la structurer.</span>
              </div>
              <h1 style={{ fontSize: isMobile ? "clamp(40px,11vw,56px)" : "clamp(60px,7vw,92px)", fontWeight: 800, lineHeight: 0.98, letterSpacing: "-0.03em", color: "#fff", textTransform: "uppercase", marginBottom: 22 }}>
                Ton idée.<br />Ton plan.<br /><span style={{ color: OR }}>Maintenant.</span>
              </h1>
              <p style={{ fontSize: isMobile ? 15 : 17, color: "rgba(255,255,255,0.78)", fontWeight: 500, lineHeight: 1.6, maxWidth: 480, marginBottom: 32 }}>Réponds à 10 questions et obtiens un business plan personnalisé en quelques minutes. Gratuit et sans compte.</p>
              <div>
                <button onClick={() => setScreen("quiz")} style={{ background: OR, color: "#fff", border: "none", padding: isMobile ? "16px 34px" : "17px 40px", fontSize: 13, fontWeight: 700, letterSpacing: "0.08em", borderRadius: 12, boxShadow: "0 12px 32px rgba(255,90,31,0.4)" }}>CRÉER MON PLAN →</button>
              </div>
              <div style={{ display: "flex", gap: 8, marginTop: 30 }}>
                {IMAGES.map((_, i) => (<div key={i} onClick={() => setSlideIndex(i)} style={{ width: i === slideIndex ? 30 : 14, height: 4, borderRadius: 2, background: i === slideIndex ? OR : "rgba(255,255,255,0.35)", cursor: "pointer", transition: "all 0.4s ease" }} />))}
              </div>
            </div>
          </div>

          {/* ════════ 3 CARTES (chevauchent le hero) ════════ */}
          <div style={{ background: CREAM, padding: isMobile ? "0 16px" : "0 60px" }}>
            <div style={{ maxWidth: 1240, margin: "0 auto", marginTop: isMobile ? -70 : -66, position: "relative", zIndex: 5, display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: isMobile ? 8 : 18 }}>
              {[
                { t: "BUSINESS PLAN COMPLET", s: "7 sections détaillées", icon: (<Ic s={isMobile ? 20 : 26}><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" /></Ic>) },
                { t: "10 QUESTIONS", s: "Personnalisées pour toi", icon: (<Ic s={isMobile ? 20 : 26}><rect x="5" y="4" width="14" height="17" rx="2" /><rect x="9" y="2.5" width="6" height="3.4" rx="1" /><path d="M8.5 12.5l1.6 1.6 3.2-3.4" /></Ic>) },
                { t: "100% GRATUIT", s: "Sans inscription", icon: (<Ic s={isMobile ? 20 : 26}><path d="M12 3l8 3v6c0 5-4 8-8 9-4-1-8-4-8-9V6l8-3z" /><path d="M9 12l2 2 4-4" /></Ic>) },
              ].map((c, i) => (
                <div key={i} style={{ background: BK, borderRadius: 16, padding: isMobile ? "16px 12px" : "26px 28px", display: "flex", flexDirection: isMobile ? "column" : "row", alignItems: isMobile ? "flex-start" : "center", gap: isMobile ? 8 : 18, boxShadow: "0 14px 36px rgba(0,0,0,0.18)" }}>
                  <div style={{ flexShrink: 0 }}>{c.icon}</div>
                  <div>
                    <div style={{ color: "#fff", fontWeight: 700, fontSize: isMobile ? 12.5 : 16, lineHeight: 1.15 }}>{c.t}</div>
                    <div style={{ color: "rgba(255,255,255,0.55)", fontWeight: 500, fontSize: isMobile ? 10.5 : 13.5, marginTop: 5 }}>{c.s}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ════════ CE QUE TU OBTIENS ════════ */}
          <div style={{ background: CREAM, padding: isMobile ? "46px 16px" : "80px 60px" }}>
            <div style={{ maxWidth: 1180, margin: "0 auto" }}>
              <div style={{ fontSize: 12.5, letterSpacing: "0.16em", color: OR, fontWeight: 700, marginBottom: 16 }}>CE QUE TU OBTIENS</div>
              <h2 style={{ fontSize: isMobile ? 25 : 38, fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 1.08, marginBottom: 18 }}>Un vrai dossier,<br />pas un résumé vague.</h2>
              <div style={{ width: 54, height: 4, background: OR, borderRadius: 2, marginBottom: isMobile ? 26 : 34 }} />
              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1.05fr 0.95fr" : "1fr 1fr", gap: isMobile ? 14 : 64, alignItems: "center" }}>
                <div>
                  <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: isMobile ? "11px 0" : "16px 28px" }}>
                    {["Analyse de marché", "Projections financières", "Stratégie marketing", "Plan d'action 90 jours", "Démarches légales", "Gestion des risques"].map((it, i) => (
                      <div key={i} style={{ display: "flex", alignItems: "center", gap: isMobile ? 9 : 11 }}>
                        <span style={{ width: isMobile ? 19 : 22, height: isMobile ? 19 : 22, borderRadius: "50%", background: OR, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}><Ic s={isMobile ? 11 : 13} c="#fff" sw={3}><path d="M5 12l4 4 10-10" /></Ic></span>
                        <span style={{ fontSize: isMobile ? 13 : 15, fontWeight: 600, lineHeight: 1.25 }}>{it}</span>
                      </div>
                    ))}
                  </div>
                  {!isMobile && <p style={{ fontSize: 13, color: "rgba(0,0,0,0.45)", fontWeight: 500, lineHeight: 1.5, maxWidth: 340, marginTop: 24 }}>Exemple de plan généré — chaque dossier est unique, adapté à ton projet.</p>}
                </div>
                <div style={{ display: "flex", justifyContent: "center" }}>
                  <div style={{ position: "relative", width: isMobile ? "100%" : 420, height: isMobile ? 270 : 420 }}>
                    <div style={{ position: "absolute", inset: 0, borderRadius: 14, background: "#EFEEEB", transform: isMobile ? "rotate(3deg) translate(8px,4px)" : "rotate(4deg) translate(18px,6px)", boxShadow: "0 16px 40px rgba(0,0,0,0.08)" }} />
                    <div style={{ position: "absolute", inset: 0, borderRadius: 14, background: "#F7F6F4", transform: isMobile ? "rotate(1.5deg) translate(4px,2px)" : "rotate(2deg) translate(9px,3px)", boxShadow: "0 16px 40px rgba(0,0,0,0.08)" }} />
                    <div style={{ position: "absolute", inset: 0, borderRadius: 14, background: "#fff", boxShadow: "0 24px 60px rgba(0,0,0,0.14)", padding: isMobile ? "14px 13px" : "28px 28px", display: "flex", flexDirection: "column" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: isMobile ? 13 : 22 }}>
                        <div>
                          <div style={{ fontSize: isMobile ? 8 : 10, fontWeight: 700, letterSpacing: "0.14em", color: OR }}>BUSINESS PLAN</div>
                          <div style={{ fontSize: isMobile ? 13 : 21, fontWeight: 800, letterSpacing: "-0.02em", marginTop: isMobile ? 3 : 5, lineHeight: 1.1 }}>Barbier — Paris 11e</div>
                        </div>
                        <div style={{ width: isMobile ? 24 : 34, height: isMobile ? 24 : 34, borderRadius: "50%", background: BK, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: isMobile ? 8 : 11, fontWeight: 800, flexShrink: 0 }}>PS</div>
                      </div>
                      <div style={{ fontSize: isMobile ? 9.5 : 12.5, fontWeight: 700, marginBottom: isMobile ? 7 : 10 }}>Analyse de marché</div>
                      <div style={{ display: "flex", flexDirection: "column", gap: isMobile ? 5 : 7, marginBottom: isMobile ? 14 : 24 }}>
                        <div style={{ height: isMobile ? 5 : 7, borderRadius: 4, background: "#ECEBE8", width: "100%" }} />
                        <div style={{ height: isMobile ? 5 : 7, borderRadius: 4, background: "#ECEBE8", width: "92%" }} />
                        <div style={{ height: isMobile ? 5 : 7, borderRadius: 4, background: "#ECEBE8", width: "74%" }} />
                      </div>
                      <div style={{ fontSize: isMobile ? 9.5 : 12.5, fontWeight: 700, marginBottom: isMobile ? 8 : 12 }}>Projections sur 12 mois</div>
                      <div style={{ display: "flex", alignItems: "flex-end", gap: isMobile ? 5 : 9, height: isMobile ? 78 : 130 }}>
                        {[{ h: 30, m: "JAN" }, { h: 44, m: "FEV" }, { h: 60, m: "MAR" }, { h: 70, m: "AVR" }, { h: 84, m: "MAI" }, { h: 100, m: "JUN" }].map((b, i) => (
                          <div key={i} style={{ flex: 1, height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-end", gap: isMobile ? 4 : 6 }}>
                            <div style={{ width: "100%", height: `${b.h}%`, background: OR, borderRadius: "3px 3px 0 0" }} />
                            <span style={{ fontSize: isMobile ? 7 : 9, color: "rgba(0,0,0,0.4)", fontWeight: 600 }}>{b.m}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              {isMobile && <p style={{ fontSize: 12, color: "rgba(0,0,0,0.45)", fontWeight: 500, lineHeight: 1.5, marginTop: 22 }}>Exemple de plan généré — chaque dossier est unique, adapté à ton projet.</p>}
            </div>
          </div>

          {/* ════════ POURQUOI TU PEUX T'Y FIER ════════ */}
          <div style={{ background: CREAM, padding: isMobile ? "46px 16px" : "76px 60px" }}>
            <div style={{ maxWidth: 1100, margin: "0 auto", textAlign: "center" }}>
              <div style={{ fontSize: 12.5, letterSpacing: "0.16em", color: OR, fontWeight: 700, marginBottom: 14 }}>POURQUOI TU PEUX T'Y FIER</div>
              <h2 style={{ fontSize: isMobile ? 27 : 38, fontWeight: 800, letterSpacing: "-0.03em", marginBottom: isMobile ? 30 : 42 }}>Fait pour t'être vraiment utile.</h2>
              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3,1fr)", gap: 16, textAlign: "left" }}>
                {[
                  { icon: (<Ic s={26}><path d="M9 3a3 3 0 0 0-3 3 3 3 0 0 0-1 5.8A3 3 0 0 0 7 17a2.7 2.7 0 0 0 5 1 2.7 2.7 0 0 0 5-1 3 3 0 0 0 2-5.2A3 3 0 0 0 18 6a3 3 0 0 0-3-3 2.7 2.7 0 0 0-3 1.4A2.7 2.7 0 0 0 9 3z" /></Ic>), t: "Adapté à ton projet", d: "Le plan parle de TON projet : ta ville, ton budget, ton métier." },
                  { icon: (<Ic s={26}><path d="M3 21h18" /><rect x="5" y="10" width="3.4" height="8" /><rect x="10.3" y="6" width="3.4" height="12" /><rect x="15.6" y="13" width="3.4" height="5" /></Ic>), t: "Sources réelles", d: "Des sources officielles (INSEE, URSSAF…), pas des chiffres inventés." },
                  { icon: (<Ic s={26}><path d="M10.3 3.9L1.8 18a2 2 0 0 0 1.7 3h16.9a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" /><path d="M12 9v4.5" /><path d="M12 17h.01" /></Ic>), t: "Analyse aussi les risques", d: "Il te dit aussi ce qui peut coincer, pas seulement le positif." },
                ].map((c, i) => (
                  <div key={i} style={{ background: BK, border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: 24 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                      <span style={{ flexShrink: 0 }}>{c.icon}</span>
                      <span style={{ fontSize: 16, fontWeight: 700, color: "#fff" }}>{c.t}</span>
                    </div>
                    <p style={{ fontSize: 14, color: "rgba(255,255,255,0.6)", fontWeight: 500, lineHeight: 1.55 }}>{c.d}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ════════ FAIT POUR TOI SI + COMMENT ÇA MARCHE ════════ */}
          <div style={{ background: CREAM, padding: isMobile ? "46px 16px" : "76px 60px" }}>
            <div style={{ maxWidth: 1180, margin: "0 auto", display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: isMobile ? 44 : 60 }}>
              <div>
                <div style={{ fontSize: 12.5, letterSpacing: "0.16em", color: OR, fontWeight: 700, marginBottom: 22 }}>FAIT POUR TOI SI —</div>
                <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 12 }}>
                  {[
                    { icon: (<Ic s={20}><path d="M9 18h6" /><path d="M10 22h4" /><path d="M12 2a7 7 0 0 0-4 12.7c.5.4 1 1.1 1 1.8v.5h6v-.5c0-.7.5-1.4 1-1.8A7 7 0 0 0 12 2z" /></Ic>), t: "Tu as une idée mais tu ne sais pas par où commencer" },
                    { icon: (<Ic s={20}><path d="M3 17l6-6 4 4 7-7" /><path d="M17 8h4v4" /></Ic>), t: "Tu veux savoir si ton idée est viable" },
                    { icon: (<Ic s={20}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></Ic>), t: "Tu veux structurer ton projet rapidement" },
                    { icon: (<Ic s={20}><rect x="3" y="7" width="18" height="13" rx="2" /><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></Ic>), t: "Tu veux te mettre à ton compte" },
                    { icon: (<Ic s={20}><rect x="5" y="4" width="14" height="17" rx="1" /><path d="M9 8h.01M14 8h.01M9 12h.01M14 12h.01M9 16h.01M14 16h.01" /></Ic>), t: "Tu veux créer ton entreprise avec un plan clair" },
                    { icon: (<Ic s={20}><rect x="6" y="4" width="12" height="17" rx="2" /><rect x="9" y="2.5" width="6" height="3.2" rx="1" /><path d="M9.5 12h5M9.5 16h5" /></Ic>), t: "Tu cherches un business plan simple et personnalisé" },
                  ].map((c, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, padding: isMobile ? "14px 14px" : "14px 16px", background: BK }}>
                      {isMobile && <span style={{ fontSize: 13, fontWeight: 800, color: OR, flexShrink: 0 }}>{String(i + 1).padStart(2, "0")}</span>}
                      <span style={{ flexShrink: 0 }}>{c.icon}</span>
                      <span style={{ fontSize: 16, fontWeight: 500, lineHeight: 1.3, color: "rgba(255,255,255,0.6)" }}>{c.t}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div id="comment">
                <div style={{ fontSize: 12.5, letterSpacing: "0.16em", color: OR, fontWeight: 700, marginBottom: 26 }}>COMMENT ÇA MARCHE</div>
                {(() => {
                  const steps = [
                    { n: "01", icon: (<Ic s={isMobile ? 18 : 20} c="#444"><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" /></Ic>), t: "Tu réponds", d: "Réponds à 10 questions simples sur ton projet, ton expérience et tes objectifs." },
                    { n: "02", icon: (<Ic s={isMobile ? 18 : 20} c="#444"><path d="M12 3l2 5.5L19.5 10 14 11.5 12 17l-2-5.5L4.5 10 10 8.5z" /></Ic>), t: "On construit ton plan", d: "À partir de tes réponses, notre IA structure ton projet et génère une analyse complète." },
                    { n: "03", icon: (<Ic s={isMobile ? 18 : 20} c="#444"><path d="M12 3v12" /><path d="M7 11l5 5 5-5" /><path d="M5 21h14" /></Ic>), t: "Tu télécharges", d: "Récupère un business plan complet, personnalisé et prêt à t'aider à lancer ton activité." },
                  ];
                  const al = (i) => i === 0 ? "left" : i === 1 ? "center" : "right";
                  const iconSz = isMobile ? 32 : 40;
                  return (
                    <>
                      {/* Numéros */}
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                        {steps.map((s, i) => (
                          <div key={i} style={{ width: "32%", textAlign: al(i), fontSize: isMobile ? 26 : 34, fontWeight: 800, color: OR, lineHeight: 1 }}>{s.n}</div>
                        ))}
                      </div>
                      {/* Icônes + connecteurs */}
                      <div style={{ display: "flex", alignItems: "center", marginBottom: 16 }}>
                        {steps.map((s, i) => (
                          <Fragment key={i}>
                            <span style={{ width: iconSz, height: iconSz, borderRadius: "50%", background: "#EFEFEF", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{s.icon}</span>
                            {i < 2 && (
                              <span style={{ flex: 1, display: "flex", alignItems: "center", margin: "0 7px" }}>
                                <span style={{ flex: 1, borderTop: `2px dashed ${OR}`, opacity: 0.55 }} />
                                <span style={{ width: 0, height: 0, borderTop: "4px solid transparent", borderBottom: "4px solid transparent", borderLeft: `6px solid ${OR}`, opacity: 0.7, marginLeft: 1 }} />
                              </span>
                            )}
                          </Fragment>
                        ))}
                      </div>
                      {/* Titres + descriptions */}
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        {steps.map((s, i) => (
                          <div key={i} style={{ width: "31%", textAlign: al(i) }}>
                            <div style={{ fontSize: isMobile ? 13 : 15, fontWeight: 700, marginBottom: 8 }}>{s.t}</div>
                            <div style={{ fontSize: isMobile ? 11 : 13, color: "rgba(0,0,0,0.5)", fontWeight: 500, lineHeight: 1.5 }}>{s.d}</div>
                          </div>
                        ))}
                      </div>
                    </>
                  );
                })()}
              </div>
            </div>
          </div>

          {/* ════════ BASÉ SUR DES DONNÉES RÉELLES ════════ */}
          <div style={{ background: CREAM, padding: isMobile ? "8px 16px 30px" : "16px 60px 52px" }}>
            <div style={{ maxWidth: 1180, margin: "0 auto", border: "1px solid #ECECEC", borderRadius: 16, padding: isMobile ? "16px 18px" : "26px 44px", display: "flex", flexDirection: isMobile ? "column" : "row", gap: isMobile ? 16 : 40, alignItems: "center" }}>
              <div style={{ flexShrink: 0, textAlign: isMobile ? "center" : "left" }}>
                <div style={{ fontSize: isMobile ? 11 : 12.5, letterSpacing: "0.14em", color: OR, fontWeight: 700, marginBottom: 8 }}>BASÉ SUR DES DONNÉES RÉELLES</div>
                <p style={{ fontSize: isMobile ? 13 : 14.5, color: "rgba(0,0,0,0.6)", fontWeight: 500, lineHeight: 1.45 }}>Nous nous appuyons sur des sources officielles et fiables pour construire ton plan.</p>
              </div>
              <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "space-around", gap: isMobile ? 10 : 28, flexWrap: "nowrap", opacity: 0.5, filter: "grayscale(1)" }}>
                <span style={{ fontWeight: 800, fontSize: isMobile ? 13 : 21, letterSpacing: "0.04em", color: "#2a2a2a" }}>INSEE</span>
                <span style={{ fontWeight: 700, fontSize: isMobile ? 14 : 23, color: "#2a2a2a" }}>Urssaf</span>
                <span style={{ fontWeight: 700, fontSize: isMobile ? 13 : 21, color: "#2a2a2a" }}>bpifrance</span>
                <span style={{ fontWeight: 800, fontSize: isMobile ? 7 : 11, color: "#2a2a2a", lineHeight: 1.15, textAlign: "center" }}>RÉPUBLIQUE<br />FRANÇAISE</span>
              </div>
            </div>
          </div>

          {/* ════════ LANCE TON PROJET (bloc noir) ════════ */}
          <div style={{ background: CREAM, padding: isMobile ? "8px 16px 24px" : "12px 60px 40px" }}>
            <div style={{ maxWidth: 1180, margin: "0 auto", background: BK, borderRadius: 22, padding: isMobile ? "22px 20px" : "54px 56px", display: "flex", flexDirection: "row", alignItems: "center", gap: isMobile ? 16 : 40 }}>
              <div style={{ width: isMobile ? 52 : 78, height: isMobile ? 52 : 78, borderRadius: "50%", border: `2px solid ${OR}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Ic s={isMobile ? 24 : 34}><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" /><path d="M12 15l-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" /><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0" /></Ic>
              </div>
              <div style={{ flex: 1, display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1.1fr 1fr", gap: isMobile ? 14 : 50, alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: isMobile ? 10.5 : 12, letterSpacing: "0.14em", color: OR, fontWeight: 700, marginBottom: isMobile ? 7 : 10 }}>LANCE TON PROJET AUJOURD'HUI</div>
                  <h2 style={{ fontSize: isMobile ? 20 : 34, fontWeight: 800, color: "#fff", lineHeight: 1.12, letterSpacing: "-0.02em" }}>Accède gratuitement, partage ton avis, influence la suite !</h2>
                </div>
                <div>
                  <p style={{ fontSize: isMobile ? 13 : 15, color: "rgba(255,255,255,0.6)", fontWeight: 500, lineHeight: 1.55, marginBottom: isMobile ? 16 : 24 }}>Génère ton business plan gratuitement et aide-nous à améliorer la plateforme. Ton avis nous aidera à rendre l'outil encore plus utile.</p>
                  <button onClick={() => setScreen("quiz")} style={{ background: OR, color: "#fff", border: "none", padding: isMobile ? "13px 26px" : "16px 36px", fontSize: isMobile ? 12 : 13, fontWeight: 700, letterSpacing: "0.08em", borderRadius: 12 }}>CRÉER MON PLAN →</button>
                </div>
              </div>
            </div>
          </div>

          {/* ════════ À PROPOS ════════ */}
          <div id="apropos" style={{ background: CREAM, padding: isMobile ? "32px 16px" : "44px 60px" }}>
            <div style={{ maxWidth: 1180, margin: "0 auto", display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1.4fr 1fr", gap: isMobile ? 24 : 56, alignItems: "center" }}>
              <div>
                <div style={{ fontSize: 12.5, letterSpacing: "0.16em", color: OR, fontWeight: 700, marginBottom: 14 }}>À PROPOS</div>
                <h2 style={{ fontSize: isMobile ? 24 : 28, fontWeight: 800, letterSpacing: "-0.02em", lineHeight: 1.12, marginBottom: 16 }}>Planstart c'est pour ceux qui passent à l'action.</h2>
                <p style={{ fontSize: 14, color: "rgba(0,0,0,0.6)", fontWeight: 500, lineHeight: 1.65, marginBottom: 12 }}>J'ai créé PLANSTART parce que beaucoup de personnes ont une idée de projet mais ne savent pas comment la transformer en quelque chose de concret.</p>
                <p style={{ fontSize: 14, color: "rgba(0,0,0,0.6)", fontWeight: 500, lineHeight: 1.65 }}>Mon objectif : rendre la création d'entreprise plus accessible à chacun, sans connaissances particulières et sans dépenser des milliers d'euros.</p>
              </div>
              <div style={{ background: BK, borderRadius: 18, padding: isMobile ? "10px 24px" : "14px 32px" }}>
                {[
                  { icon: (<Ic s={22}><rect x="3" y="8" width="18" height="13" rx="1" /><path d="M12 8v13M3 12.5h18" /><path d="M12 8S10.5 3.5 8 5s1.5 3 4 3M12 8s1.5-4.5 4-3-1.5 3-4 3" /></Ic>), t: "100% GRATUIT" },
                  { icon: (<Ic s={22}><path d="M4 6a2 2 0 0 1 2-2h3.5l2 3H18a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z" /></Ic>), t: "7 SECTIONS" },
                  { icon: (<Ic s={22}><circle cx="12" cy="12" r="9" /><path d="M9.6 9a2.4 2.4 0 0 1 4.7.6c0 1.6-2.4 2-2.4 3.4" /><path d="M12 17h.01" /></Ic>), t: "10 QUESTIONS" },
                ].map((r, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 16, padding: "18px 0", borderBottom: i < 2 ? "1px solid rgba(255,255,255,0.14)" : "none" }}>
                    <span style={{ flexShrink: 0 }}>{r.icon}</span>
                    <span style={{ fontSize: isMobile ? 16 : 18, fontWeight: 800, color: "#fff" }}>{r.t}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ════════ CTA FINAL (bloc noir) ════════ */}
          <div style={{ background: CREAM, padding: isMobile ? "12px 16px 28px" : "20px 60px 48px" }}>
            <div style={{ maxWidth: 1180, margin: "0 auto", background: BK, borderRadius: 22, padding: isMobile ? "22px 18px" : "52px 56px", display: "flex", flexDirection: "row", alignItems: "center", gap: isMobile ? 12 : 40 }}>
              <h2 style={{ fontSize: isMobile ? "clamp(19px,5.4vw,26px)" : "clamp(46px,5vw,72px)", fontWeight: 800, letterSpacing: "-0.03em", lineHeight: isMobile ? 1.0 : 0.92, color: "#fff", textTransform: "uppercase", flexShrink: 0 }}>Prêt à<br /><span style={{ color: OR }}>te lancer ?</span></h2>
              <p style={{ flex: 1, fontSize: isMobile ? 11.5 : 15, color: "rgba(255,255,255,0.6)", fontWeight: 500, lineHeight: 1.45 }}>Transforme ton idée en plan concret en moins de 5 minutes.</p>
              <button onClick={() => setScreen("quiz")} style={{ background: "#fff", color: "#000", border: "none", padding: isMobile ? "11px 16px" : "18px 40px", fontSize: isMobile ? 11 : 14, fontWeight: 700, letterSpacing: "0.08em", borderRadius: 11, whiteSpace: "nowrap", flexShrink: 0 }}>C'EST PARTI →</button>
            </div>
          </div>

          {/* ════════ FOOTER ════════ */}
          <div style={{ background: CREAM, borderTop: "1px solid #ededed", padding: isMobile ? "24px 20px 110px" : "24px 60px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
            <span style={{ fontSize: 12, color: "rgba(0,0,0,0.4)", fontWeight: 500 }}>© 2025-2026 PLANSTART — Tous droits réservés</span>
            <div style={{ display: "flex", gap: 24 }}>
              {[["Mentions légales", "/mentions-legales"], ["Confidentialité", "/confidentialite"], ["CGU", "/cgu"]].map(([label, href]) => (
                <a key={href} href={href} style={{ fontSize: 12, color: "rgba(0,0,0,0.5)", textDecoration: "none", fontWeight: 500 }}>{label}</a>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── QUIZ ── */}
      {screen === "quiz" && (
        <div style={{ minHeight: "100vh", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "fixed", inset: 0, background: "#0a0a0a" }} />
          {IMAGES.map((img, i) => (
            <div key={i} style={{ position: "fixed", inset: 0, backgroundImage: `url(${img})`, backgroundSize: "cover", backgroundPosition: "center", opacity: i === slideIndex ? 1 : 0, transition: "opacity 1.6s ease" }} />
          ))}
          <div style={{ position: "fixed", inset: 0, background: "linear-gradient(180deg, rgba(8,7,6,0.86) 0%, rgba(8,7,6,0.58) 38%, rgba(8,7,6,0.62) 64%, rgba(8,7,6,0.86) 100%)" }} />

          {blocTransition && (
            <div style={{ position: "fixed", inset: 0, zIndex: 200, background: "#000", display: "flex", alignItems: "center", justifyContent: "center", animation: "fadeIn 0.3s ease both" }}>
              <div style={{ textAlign: "center", animation: "scaleIn 0.5s ease both" }}>
                <div style={{ fontSize: 10, letterSpacing: "0.3em", color: isOrange ? "#ff7a2e" : "rgba(255,255,255,0.3)", marginBottom: 16, fontWeight: 900 }}>PARTIE SUIVANTE</div>
                <div style={{ fontSize: isMobile ? "clamp(40px,12vw,72px)" : "clamp(56px,8vw,96px)", fontWeight: 900, color: "#fff" }}>{showBloc}</div>
                <div style={{ width: 60, height: 4, background: isOrange ? "#ff7a2e" : "#fff", margin: "20px auto 0", borderRadius: 2 }} />
              </div>
            </div>
          )}

          <div style={{ position: "relative", zIndex: 2, minHeight: "100vh", display: "flex", flexDirection: "column", justifyContent: "center", padding: isMobile ? "90px 24px 60px" : "100px 60px 60px", maxWidth: 720, margin: "0 auto", animation: "slideUp 0.5s ease both" }}>

            {/* Blocs + Progress */}
            <div style={{ marginBottom: 48 }}>
              <div style={{ display: "flex", gap: isMobile ? 6 : 12, marginBottom: 16 }}>
                {["TON PROJET", "TOI", "TON MARCHÉ", "TON AMBITION"].map((bloc, i) => {
                  const currentBlocIndex = ["TON PROJET", "TOI", "TON MARCHÉ", "TON AMBITION"].indexOf(questions[qIndex]?.bloc || "TON PROJET");
                  const isActive = i === currentBlocIndex;
                  const isDone = i < currentBlocIndex;
                  return (
                    <div key={i} style={{ flex: 1 }}>
                      <div style={{ height: 3, background: isActive ? ACCENT_ON_DARK : isDone ? (isOrange ? "rgba(255,122,46,0.55)" : "rgba(255,255,255,0.6)") : "rgba(255,255,255,0.15)", marginBottom: 8, borderRadius: 2, transition: "background 0.3s" }} />
                      <div style={{ fontSize: isMobile ? 7 : 9, color: isActive ? "#fff" : isDone ? "rgba(255,255,255,0.5)" : "rgba(255,255,255,0.2)", fontWeight: 900, letterSpacing: "0.08em" }}>{bloc}</div>
                    </div>
                  );
                })}
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 12, fontWeight: 900, letterSpacing: "0.15em", color: isOrange ? "#ff7a2e" : "rgba(255,255,255,0.5)", background: "rgba(255,255,255,0.1)", padding: "4px 12px", borderRadius: 20 }}>
                  {questions[qIndex]?.label || "01"} / 10
                </span>
                <span style={{ fontSize: 12, fontWeight: 900, color: isOrange ? "#ff7a2e" : "rgba(255,255,255,0.4)" }}>
                  {Math.round(((qIndex + 1) / TOTAL_QUESTIONS) * 100)}%
                </span>
              </div>
            </div>

            {/* Question */}
            <h2 style={{ fontSize: isMobile ? "20px" : "28px", fontWeight: 800, letterSpacing: "-0.01em", lineHeight: 1.4, marginBottom: 32, color: "#fff", maxWidth: 650, animation: "slideDown 0.4s ease both" }}>
              {questions[qIndex]?.question || "Chargement..."}
            </h2>

            {/* Exemples cliquables — restent visibles même quand on écrit */}
            {questions[qIndex]?.examples?.length > 0 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 20 }}>
                {questions[qIndex].examples.slice(0, 4).map((ex, i) => {
                  const isPicked = current.toLowerCase().includes(ex.toLowerCase());
                  return (
                    <button key={i} className="example-pill" onClick={() => {
                      // Ajoute l'exemple à la réponse au lieu de l'écraser (permet d'en combiner)
                      setCurrent(prev => {
                        const base = prev.trim();
                        if (!base) return ex;
                        if (base.toLowerCase().includes(ex.toLowerCase())) return base;
                        return base + ", " + ex.charAt(0).toLowerCase() + ex.slice(1);
                      });
                      if (inputRef.current) inputRef.current.focus();
                    }} style={{ background: isPicked ? (isOrange ? "rgba(255,122,46,0.25)" : "rgba(255,255,255,0.25)") : "rgba(255,255,255,0.08)", border: `1px solid ${isPicked ? (isOrange ? "#ff7a2e" : "#fff") : "rgba(255,255,255,0.2)"}`, color: isPicked ? "#fff" : "rgba(255,255,255,0.7)", padding: "8px 16px", fontSize: 12, fontFamily: "Arial, sans-serif", borderRadius: 20, transition: "all 0.2s", cursor: "pointer" }}>
                      <span style={{ color: isOrange ? "#ff7a2e" : "inherit", fontWeight: 900 }}>{isPicked ? "✓" : "+"}</span> {ex}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Zone de saisie */}
            <div style={{ background: "rgba(255,255,255,0.08)", border: "2px solid rgba(255,255,255,0.2)", borderRadius: 4, padding: "20px", marginBottom: 16 }}>
              <textarea
                ref={inputRef}
                value={current}
                onChange={e => setCurrent(e.target.value.slice(0, MAX_INPUT_LENGTH))}
                onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey && current.trim() && !loadingQuestion) { e.preventDefault(); handleNext(); } }}
                placeholder={questions[qIndex]?.placeholder || "Décris ta réponse..."}
                rows={2}
                style={{ width: "100%", background: "transparent", border: "none", fontSize: 16, fontFamily: "Arial, sans-serif", color: "#fff", resize: "none", lineHeight: 1.6 }}
              />
              <div style={{ textAlign: "right", fontSize: 10, color: current.length > MAX_INPUT_LENGTH * 0.8 ? "rgba(255,200,100,0.7)" : "rgba(255,255,255,0.2)", marginTop: 4 }}>
                {current.length}/{MAX_INPUT_LENGTH}
              </div>
            </div>

            {/* Encourage des réponses détaillées */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16, fontSize: isMobile ? 11 : 12, color: "rgba(255,255,255,0.45)", fontFamily: "Arial, sans-serif", lineHeight: 1.5 }}>
              <span style={{ fontSize: 13, flexShrink: 0, color: isOrange ? "#ff7a2e" : "inherit" }}>✦</span>
              <span>Plus ta réponse est précise et détaillée, plus ton business plan sera personnalisé et pertinent.</span>
            </div>

            {/* Loading question */}
            {loadingQuestion && (
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12, color: "rgba(255,255,255,0.5)" }}>
                <div style={{ width: 14, height: 14, border: "2px solid rgba(255,255,255,0.2)", borderTop: "2px solid #fff", borderRadius: "50%", animation: "spinQ 0.8s linear infinite", flexShrink: 0 }} />
                <span style={{ fontSize: 11, fontWeight: 900, letterSpacing: "0.08em" }}>ANALYSE DE TA RÉPONSE...</span>
              </div>
            )}

            {/* Boutons */}
            <div style={{ display: "flex", gap: 12 }}>
              <button onClick={handleBack} style={{ flex: 1, background: "rgba(255,255,255,0.08)", border: `2px solid ${isOrange ? "rgba(255,122,46,0.6)" : "rgba(255,255,255,0.2)"}`, color: isOrange ? "#ff7a2e" : "#fff", fontSize: 12, fontWeight: 900, letterSpacing: "0.12em", padding: "16px", borderRadius: 10, cursor: "pointer" }}>← RETOUR</button>
              <button onClick={handleNext} disabled={!current.trim() || loadingQuestion} style={{ flex: 2, background: current.trim() && !loadingQuestion ? (isOrange ? "linear-gradient(90deg,#ff9d3d,#ff5e3a)" : "#fff") : "rgba(255,255,255,0.08)", border: `2px solid ${current.trim() && !loadingQuestion ? (isOrange ? "transparent" : "#fff") : "rgba(255,255,255,0.2)"}`, color: current.trim() && !loadingQuestion ? (isOrange ? "#fff" : "#000") : "rgba(255,255,255,0.3)", fontSize: 12, fontWeight: 900, letterSpacing: "0.12em", padding: "16px", borderRadius: 10, transition: "all 0.2s", cursor: current.trim() && !loadingQuestion ? "pointer" : "not-allowed" }}>
                {loadingQuestion ? "..." : qIndex === TOTAL_QUESTIONS - 1 ? "GÉNÉRER MON PLAN →" : "SUIVANT →"}
              </button>
            </div>

            {!isMobile && <p style={{ marginTop: 12, fontSize: 10, color: "rgba(255,255,255,0.2)", textAlign: "right", letterSpacing: "0.05em" }}>ENTRÉE POUR CONTINUER</p>}
          </div>
        </div>
      )}

      {/* ── RESULT ── */}
      {screen === "result" && (
        <div style={{ animation: "fadeIn 0.6s ease both" }}>

          {loading && <LoadingScreen isOrange={isOrange} />}

          {!loading && error && (
            <div style={{ minHeight: "100vh", background: "#222227", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", padding: "0 40px" }}>
              <div style={{ fontSize: 40, marginBottom: 24 }}>⚠️</div>
              <h2 style={{ color: "#fff", fontWeight: 900, fontSize: 24, marginBottom: 16 }}>Une erreur est survenue</h2>
              <p style={{ color: "rgba(255,255,255,0.5)", fontFamily: "Arial, sans-serif", marginBottom: 32, maxWidth: 400 }}>{error}</p>
              <button onClick={restart} style={{ background: "#fff", color: "#000", border: "none", padding: "16px 40px", fontSize: 13, fontWeight: 900, letterSpacing: "0.1em" }}>← RECOMMENCER</button>
            </div>
          )}

          {!loading && result && (
            <>
              {/* Header résultat — cover (identique à la maquette) */}
              <div style={{ position: "relative", background: "#000", padding: isMobile ? "92px 22px 44px" : "110px 60px 56px", overflow: "hidden" }}>
                <div style={{ position: "absolute", inset: 0, backgroundImage: `url("${COVER_IMAGE}")`, backgroundSize: "cover", backgroundPosition: "72% center" }} />
                <div style={{ position: "absolute", inset: 0, background: "linear-gradient(90deg, rgba(0,0,0,0.86) 0%, rgba(0,0,0,0.66) 48%, rgba(0,0,0,0.32) 74%, rgba(0,0,0,0.12) 100%)" }} />
                <div style={{ position: "relative", zIndex: 2, maxWidth: 1400, margin: "0 auto" }}>

                  {/* En-tête marque */}
                  <div style={{ fontSize: isMobile ? 15 : 18, fontWeight: 900, letterSpacing: "0.04em", color: "#fff" }}>PLAN<span style={{ color: isOrange ? "#ff7a2e" : "#fff" }}>START</span></div>
                  <div style={{ fontSize: 10, fontWeight: 900, letterSpacing: "0.22em", color: "rgba(255,255,255,0.55)", marginTop: 4 }}>BUSINESS PLAN PROFESSIONNEL</div>
                  <div style={{ width: 42, height: 4, background: isOrange ? "#ff7a2e" : "#fff", margin: "18px 0 32px" }} />

                  {/* Titre projet + Maintenant */}
                  <h1 style={{ fontSize: isMobile ? "clamp(34px,10vw,52px)" : "clamp(48px,6vw,72px)", fontWeight: 900, letterSpacing: "-0.02em", lineHeight: 0.98, color: "#fff", marginBottom: 16, textTransform: "uppercase" }}>
                    {result.titre || result.nom || result.activite || "Ton business plan"}<br />
                    <span style={{ color: isOrange ? "#ff7a2e" : "rgba(255,255,255,0.4)", fontStyle: "italic" }}>Maintenant.</span>
                  </h1>

                  <div style={{ maxWidth: 540, padding: "16px 0 0", borderTop: `1px solid ${isOrange ? "rgba(255,122,46,0.4)" : "rgba(255,255,255,0.1)"}` }}>
                    <p style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", fontFamily: "Arial, sans-serif", lineHeight: 1.55 }}>
                      Ce plan est généré par IA à titre indicatif. Les montants chiffrés sont des estimations à confirmer auprès de sources officielles avant de te lancer.
                    </p>
                  </div>
                </div>
              </div>

              {/* Sections */}
              <div style={{ maxWidth: 800, margin: "0 auto", padding: isMobile ? "32px 16px 60px" : "48px 40px 80px", background: CREAM_ALT }}>
                {(result.sections || []).map((s, i) => (
                  <div key={i} style={{ background: "#ffffff", borderRadius: 20, boxShadow: "0 4px 24px rgba(0,0,0,0.08)", padding: isMobile ? "28px 22px" : "48px 44px", marginBottom: isMobile ? 20 : 28 }}>
                    <div style={{ fontSize: 10, fontWeight: 900, letterSpacing: "0.2em", color: isOrange ? "#ff7a2e" : "rgba(0,0,0,0.3)", marginBottom: 10 }}>SECTION {String(i + 1).padStart(2, "0")} / {String((result.sections || []).length).padStart(2, "0")}</div>
                    <div style={{ display: "flex", gap: 16, marginBottom: 16, alignItems: "baseline", borderBottom: `3px solid ${isOrange ? "#ff7a2e" : "#000"}`, paddingBottom: 14 }}>
                      <span style={{ fontSize: 13, fontWeight: 900, color: isOrange ? "#ff7a2e" : "rgba(0,0,0,0.25)", minWidth: 24 }}>{String(i + 1).padStart(2, "0")}</span>
                      <h3 style={{ fontSize: isMobile ? 17 : 22, fontWeight: 900, letterSpacing: "-0.01em" }}>{s.titre}</h3>
                    </div>
                    {s.intro && (
                      <p style={{ fontSize: 14, color: "rgba(0,0,0,0.5)", fontStyle: "italic", lineHeight: 1.6, marginBottom: 20, paddingLeft: 16, borderLeft: `3px solid ${isOrange ? "#ff7a2e" : "#000"}` }}>{s.intro}</p>
                    )}
                    <div style={{ paddingLeft: 0 }}>
                      {(s.points || []).map((point, j) => {
                        const m = (point || "").match(/^\*\*(.+?)\*\*\s*:?\s*([\s\S]*)/);
                        return (
                          <div key={j} style={{ display: "flex", padding: "12px 0", borderBottom: "1px solid #f5f5f5", flexDirection: isMobile && m ? "column" : "row", gap: isMobile && m ? 4 : 16 }}>
                            {m ? (
                              <>
                                <span style={{ fontSize: 13, fontWeight: 900, minWidth: isMobile ? "auto" : 180, color: "#000", flexShrink: 0 }}>{m[1]}</span>
                                <span style={{ fontSize: 14, color: "rgba(0,0,0,0.65)", lineHeight: 1.65, fontFamily: "Arial, sans-serif" }}>{linkify(m[2].replace(/\*\*/g, ""))}</span>
                              </>
                            ) : (
                              <span style={{ fontSize: 14, color: "rgba(0,0,0,0.65)", lineHeight: 1.65, fontFamily: "Arial, sans-serif" }}>{linkify(point.replace(/\*\*/g, ""))}</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}

                {/* CTA PDF */}
                <div style={{ marginTop: 48, padding: isMobile ? 32 : 48, background: DARK, textAlign: "center", borderRadius: 20 }}>
                  <p style={{ fontSize: 10, fontWeight: 900, letterSpacing: "0.2em", color: "rgba(255,255,255,0.4)", marginBottom: 16 }}>BUSINESS PLAN COMPLET</p>
                  <h3 style={{ fontSize: isMobile ? 18 : 24, fontWeight: 900, color: "#fff", marginBottom: 12, lineHeight: 1.2 }}>TÉLÉCHARGER MON PLAN</h3>
                  <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 13, marginBottom: 28, fontFamily: "Arial, sans-serif" }}>
                    Analyse de marché · Modèle économique · Plan marketing · Plan d'action
                  </p>
                  <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
                    <button onClick={() => downloadPDF(result)} style={{ background: "#fff", color: "#000", border: "none", padding: isMobile ? "14px 28px" : "16px 40px", fontSize: 13, fontWeight: 900, letterSpacing: "0.1em", cursor: "pointer" }}>
                      ↓ TÉLÉCHARGER MON PLAN
                    </button>
                  </div>
                  {showIosHint && (
                    <div style={{ marginTop: 20, padding: "14px 18px", background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 8, maxWidth: 420, margin: "20px auto 0" }}>
                      <p style={{ color: "rgba(255,255,255,0.85)", fontSize: 13, fontFamily: "Arial, sans-serif", lineHeight: 1.5 }}>
                        📄 Ton plan s'est ouvert dans un nouvel onglet.<br />
                        Pour l'enregistrer : appuie sur <strong>Partager</strong> <span style={{ fontFamily: "Arial" }}>(en bas)</span> → <strong>Enregistrer dans Fichiers</strong>.
                      </p>
                    </div>
                  )}
                </div>

                <button onClick={restart} style={{ background: "transparent", border: "none", color: "rgba(0,0,0,0.3)", fontSize: 11, fontWeight: 900, letterSpacing: "0.1em", marginTop: 32, padding: 0, cursor: "pointer" }}>← NOUVELLE IDÉE</button>
              </div>

              {/* Footer */}
              <div style={{ background: CREAM, borderTop: "1px solid #ededed", padding: isMobile ? "24px 20px" : "24px 40px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
                <span style={{ fontSize: 11, color: "rgba(0,0,0,0.3)", fontFamily: "Arial, sans-serif" }}>© 2025-2026 PLANSTART</span>
                <div style={{ display: "flex", gap: 24 }}>
                  {[["Mentions légales", "/mentions-legales"], ["Confidentialité", "/confidentialite"], ["CGU", "/cgu"]].map(([label, href]) => (
                    <a key={href} href={href} style={{ fontSize: 11, color: "rgba(0,0,0,0.4)", textDecoration: "none", fontFamily: "Arial, sans-serif" }}>{label}</a>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
