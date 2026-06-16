import { useState, useEffect, useRef } from "react";

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
  "https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?w=1200&q=80",
  "https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=1200&q=80",
  "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=1200&q=80",
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
  const inputRef = useRef(null);

  // ─── PLANSTART IDEA ───
  const [ideaPreview, setIdeaPreview] = useState(() => {
    try { return localStorage.getItem("ideaPreview") === "true"; } catch { return false; }
  });
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewPwd, setPreviewPwd] = useState("");
  const [previewError, setPreviewError] = useState(false);
  const [logoClicks, setLogoClicks] = useState(0);
  const [ideaStep, setIdeaStep] = useState(0);
  const [ideaAnswers, setIdeaAnswers] = useState({});
  const [ideaLoading, setIdeaLoading] = useState(false);
  const [ideaResults, setIdeaResults] = useState(null);
  const [ideaError, setIdeaError] = useState(null);
  const [ideaLoadStep, setIdeaLoadStep] = useState(0);
  const [chosenIdea, setChosenIdea] = useState(null);
  const [expandedCard, setExpandedCard] = useState(null);
  const [transferStep, setTransferStep] = useState(0);
  const [fromIdea, setFromIdea] = useState(false);

  // ─── THÈME : accent orange ou noir/blanc ───
  const isOrange = theme === "orange";
  const ACCENT = isOrange ? "#ff7a2e" : "#000";
  const ACCENT_GRAD = isOrange ? "linear-gradient(90deg,#ff9d3d,#ff5e3a)" : "#fff";
  const NOW_COLOR = isOrange ? "#ff7a2e" : "rgba(255,255,255,0.72)";
  const ACCENT_ON_DARK = isOrange ? "#ff7a2e" : "#fff"; // accents sur fond sombre (quiz)
  const CREAM = "#fcfcfc";        // blanc doux principal (neutre, sans teinte beige)
  const CREAM_ALT = "#f6f6f7";    // blanc doux secondaire (sections / cartes décalées)
  const DARK = "#222227";         // gris foncé pour les grands blocs (au lieu du noir pur)

  // ─── COULEURS PLANSTART IDEA ───
  const IDEA_BG = "#15122B";
  const IDEA_SURFACE = "#221C3D";
  const IDEA_VIOLET = "#B79BFF";
  const IDEA_VIOLET_ACCENT = "#8D6EFF";
  const IDEA_TEXT2 = "#B8B8C7";

  // ─── QUESTIONS DU QUIZ IDEA ───
  const IDEA_QUESTIONS = [
    { key: "objectif", q: "Quel est ton objectif principal ?", opts: ["Gagner un revenu complémentaire", "Remplacer mon salaire", "Créer une entreprise scalable", "Générer des revenus passifs"] },
    { key: "budget", q: "Quel budget peux-tu investir ?", opts: ["0 €", "1 à 500 €", "500 à 2 000 €", "2 000 €+"] },
    { key: "temps", q: "Combien de temps par semaine ?", opts: ["Moins de 5h", "5 à 10h", "10 à 20h", "20h+"] },
    { key: "interet", q: "Qu'est-ce qui t'intéresse le plus ?", opts: ["Tech / IA", "Création de contenu", "E-commerce", "Services", "Immobilier", "Je suis ouvert à tout"] },
    { key: "niveau", q: "Quel est ton niveau ?", opts: ["Débutant", "Intermédiaire", "Avancé"] },
    { key: "type", q: "Quel type de business préfères-tu ?", opts: ["En ligne uniquement", "Local", "Mixte", "Peu importe"] },
  ];

  // Question dynamique selon l'intérêt choisi (Q4)
  const IDEA_DYNAMIC = {
    "Tech / IA": { q: "Dans la tech, tu préfères :", opts: ["Vendre un service", "Créer un logiciel", "Créer du contenu", "Peu importe"] },
    "Création de contenu": { q: "Quel format te parle le plus ?", opts: ["Vidéo court", "Écrit / newsletter", "Audio / podcast", "Peu importe"] },
    "E-commerce": { q: "Tu te vois plutôt :", opts: ["Vendre tes produits", "Revendre des produits", "Produits digitaux", "Peu importe"] },
    "Services": { q: "Tu préfères servir :", opts: ["Des particuliers", "Des entreprises", "Les deux", "Peu importe"] },
    "Immobilier": { q: "Quel angle immobilier ?", opts: ["Location", "Sous-location", "Conciergerie", "Peu importe"] },
    "Je suis ouvert à tout": { q: "Tu préfères un business :", opts: ["Rapide à lancer", "Fort potentiel", "Passion avant tout", "Peu importe"] },
  };

  const IDEA_LOAD_STEPS = [
    "Analyse de ton profil...",
    "Identification de tes contraintes...",
    "Recherche des opportunités compatibles...",
    "Préparation de tes recommandations...",
  ];

  const TRANSFER_STEPS = [
    "Concept validé",
    "Marché identifié",
    "Modèle économique construit",
    "Business plan en préparation",
  ];

  // total étapes du quiz idea (6 fixes + 1 dynamique)
  const ideaTotalSteps = IDEA_QUESTIONS.length + 1;

  // Vérification mot de passe preview
  const checkPreviewPassword = async () => {
    setPreviewError(false);
    try {
      const r = await fetch("/api/preview-auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: previewPwd }),
      });
      if (r.ok) {
        try { localStorage.setItem("ideaPreview", "true"); } catch {}
        setIdeaPreview(true);
        setShowPreviewModal(false);
        setPreviewPwd("");
      } else {
        setPreviewError(true);
      }
    } catch {
      setPreviewError(true);
    }
  };

  // Triple clic sur "IDEA" dans la nav
  const handleIdeaLogoClick = () => {
    if (ideaPreview) { startIdeaQuiz(); return; }
    const next = logoClicks + 1;
    setLogoClicks(next);
    if (next >= 3) { setShowPreviewModal(true); setLogoClicks(0); }
    setTimeout(() => setLogoClicks(0), 1200);
  };

  // Démarrer le quiz idea
  const startIdeaQuiz = () => {
    setIdeaStep(0); setIdeaAnswers({}); setIdeaResults(null); setIdeaError(null);
    setChosenIdea(null); setExpandedCard(null);
    setScreen("idea-quiz");
  };

  // Répondre à une question du quiz idea
  const answerIdea = (key, value) => {
    const updated = { ...ideaAnswers, [key]: value };
    setIdeaAnswers(updated);
    const isLastFixed = ideaStep === IDEA_QUESTIONS.length - 1;
    const isDynamic = ideaStep === IDEA_QUESTIONS.length;
    if (isDynamic) { launchIdeaGeneration(updated); return; }
    if (isLastFixed) {
      // s'il y a une question dynamique pour cet intérêt → on l'affiche, sinon on génère
      const interet = updated.interet;
      if (IDEA_DYNAMIC[interet]) { setIdeaStep(ideaStep + 1); }
      else { launchIdeaGeneration(updated); }
      return;
    }
    setIdeaStep(ideaStep + 1);
  };

  // Lancer la génération des idées via l'API
  const launchIdeaGeneration = async (allAnswers) => {
    setScreen("idea-loading");
    setIdeaLoading(true);
    setIdeaError(null);
    setIdeaLoadStep(0);

    const payload = {
      objectif: allAnswers.objectif || "",
      budget: allAnswers.budget || "",
      temps: allAnswers.temps || "",
      interet: allAnswers.interet || "",
      niveau: allAnswers.niveau || "",
      type: allAnswers.type || "",
      dynamique: allAnswers.dynamique || "",
    };

    // Animation des étapes de chargement
    let step = 0;
    const loadTimer = setInterval(() => {
      step++;
      if (step < IDEA_LOAD_STEPS.length) setIdeaLoadStep(step);
    }, 1100);

    try {
      const r = await fetch("/api/ideas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await r.json();
      clearInterval(loadTimer);
      if (!r.ok || !data.ideas) {
        setIdeaError("Une erreur est survenue. Réessaie dans un instant.");
        setIdeaLoading(false);
        setScreen("idea-results");
        return;
      }
      // garantir un minimum de temps de chargement pour l'effet
      setIdeaLoadStep(IDEA_LOAD_STEPS.length - 1);
      setTimeout(() => {
        setIdeaResults(data);
        setIdeaLoading(false);
        setScreen("idea-results");
      }, 600);
    } catch {
      clearInterval(loadTimer);
      setIdeaError("Connexion impossible. Vérifie ta connexion et réessaie.");
      setIdeaLoading(false);
      setScreen("idea-results");
    }
  };

  // Choisir une idée → écran de transition
  const chooseIdea = (idea) => {
    setChosenIdea(idea);
    setTransferStep(0);
    setScreen("idea-transfer");
  };

  // Lancer le transfert vers Basic avec le profil pré-rempli
  const launchBasicFromIdea = async () => {
    // On stocke le profil idea (utilisé pour le bandeau + le contexte)
    try {
      localStorage.setItem("ideaProfile", JSON.stringify(chosenIdea));
    } catch {}
    setFromIdea(true);

    // Pré-remplir la Q1 avec l'idée choisie
    const firstAnswer = chosenIdea.name + (chosenIdea.pitch ? " — " + chosenIdea.pitch : "");
    const newAnswers = { 0: firstAnswer };
    setAnswers(newAnswers);
    setResult(null); setError(null);
    setQuestions([FIRST_QUESTION]);

    // Aller au quiz et générer la Q2 directement
    setScreen("quiz");
    setBlocTransition(false);
    setQIndex(1);
    setCurrent("");
    await generateNextQuestion(newAnswers, [FIRST_QUESTION]);
  };

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
    if (screen !== "home") return;
    const t = setInterval(() => setSlideIndex(i => (i + 1) % IMAGES.length), 5000);
    return () => clearInterval(t);
  }, [screen]);

  useEffect(() => {
    if (screen === "quiz" && inputRef.current) inputRef.current.focus();
  }, [screen, qIndex]);

  // Animation des étapes de l'écran de transfert IDEA → Basic
  useEffect(() => {
    if (screen !== "idea-transfer") return;
    setTransferStep(0);
    const t = setInterval(() => {
      setTransferStep((s) => {
        if (s >= TRANSFER_STEPS.length - 1) { clearInterval(t); return s; }
        return s + 1;
      });
    }, 800);
    return () => clearInterval(t);
  }, [screen]);

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

      // Si on vient de PlanStart Idea, on transmet le profil + raisonnement
      let ideaContext = null;
      if (fromIdea) {
        try {
          const stored = localStorage.getItem("ideaProfile");
          if (stored) {
            const idea = JSON.parse(stored);
            ideaContext = {
              idea: idea.name,
              pitch: idea.pitch,
              profile: idea.userProfile,
              reasoning: idea.reasoning,
              businessModel: idea.businessModel,
            };
          }
        } catch {}
      }

      const response = await fetch("/api/question", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ history, nextNum, bloc, ideaContext }),
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
    setFromIdea(false);
  };

  // ─── SHARE ────────────────────────────────────────────────────────────────────

  const handleShare = () => {
    const text = `J'ai obtenu ${result?.score}/100 sur mon projet "${result?.nom}" avec PLANSTART 🚀 Génère ton business plan gratuitement → planstart.fr`;
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
    const CRIT_FR = { Experience: "Expérience", Marche: "Marché", Differenciation: "Différenciation", Budget: "Budget", Clarte: "Clarté", Timing: "Timing" };
    const critHTML = (data.scoreCriteres || []).map(c => {
      const m = c.match(/^(.+?):\s*(\d+)\/10/);
      if (!m) return "";
      const label = CRIT_FR[m[1].trim()] || m[1].trim();
      const n = parseInt(m[2]);
      const col = n >= 7 ? "#4ade80" : n >= 5 ? "#facc15" : "#f87171";
      return `<tr><td>${label}</td><td style="padding-left:14px;padding-right:14px;"><div class="cover-crit-bar-bg"><div class="cover-crit-bar" style="width:${n * 10}%;background:${col};"></div></div></td><td>${n}/10</td></tr>`;
    }).join("");

    // Ligne des 6 critères en bas de couverture (cellules)
    const critCellsHTML = (data.scoreCriteres || []).map(c => {
      const m = c.match(/^(.+?):\s*(\d+)\/10/);
      if (!m) return "";
      const label = (CRIT_FR[m[1].trim()] || m[1].trim()).toUpperCase();
      const n = parseInt(m[2]);
      return `<div class="cover-crit-cell"><div class="cl">${label}</div><div class="cv">${n}/10</div></div>`;
    }).join("");
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
    ${data.scoreExplication ? `<div class="cover-expl">${escape(data.scoreExplication)}</div>` : ""}
    ${critHTML ? `<div class="cover-crit-lbl">POTENTIEL DU PROJET</div><div class="cover-crit-box"><div class="cover-crit-inner-lbl">ANALYSE DE TON PROJET</div><table class="cover-crit-table">${critHTML}</table></div>` : ""}
    ${critCellsHTML ? `<div class="cover-crit-row">${critCellsHTML}</div>` : ""}
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

  return (
    <div style={{ background: CREAM, minHeight: "100vh", fontFamily: "'Arial Black', Arial, sans-serif", color: "#000", overflowX: "hidden" }}>
      <style>{`
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
        <nav style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 100, background: (screen === "quiz" || screen === "idea-quiz" || screen === "idea-loading" || screen === "idea-results" || screen === "idea-transfer") ? "rgba(11,10,20,0.92)" : screen === "idea" ? "rgba(248,247,255,0.95)" : "rgba(252,252,252,0.97)", backdropFilter: "blur(10px)", borderBottom: `1px solid ${(screen === "quiz" || screen === "idea-quiz" || screen === "idea-loading" || screen === "idea-results" || screen === "idea-transfer") ? "rgba(183,155,255,0.15)" : screen === "idea" ? "#e8e3ff" : "#ededed"}`, padding: `0 ${isMobile ? "14px" : "60px"}`, height: 60, display: "flex", justifyContent: "space-between", alignItems: "center", animation: "fadeIn 0.4s ease both" }}>
          <div style={{ position: "relative" }}>
            <button onClick={() => setMenuOpen(o => !o)} style={{ background: "none", border: "none", display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 34, height: 34, borderRadius: "50%", background: (screen === "quiz" || screen === "idea-quiz" || screen === "idea-loading" || screen === "idea-results" || screen === "idea-transfer") ? "#fff" : "#000", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <span style={{ color: (screen === "quiz" || screen === "idea-quiz" || screen === "idea-loading" || screen === "idea-results" || screen === "idea-transfer") ? "#000" : "#fff", fontSize: 11, fontWeight: 900 }}>PS</span>
              </div>
              <span style={{ fontSize: isMobile ? 15 : 18, fontWeight: 900, color: (screen === "quiz" || screen === "idea-quiz" || screen === "idea-loading" || screen === "idea-results" || screen === "idea-transfer") ? "#fff" : "#000" }}>PLAN<span style={{ color: String(screen).startsWith("idea") ? "#b79bff" : isOrange ? "#ff7a2e" : (screen === "quiz" ? "#fff" : "#000") }}>START</span></span>
              {String(screen).startsWith("idea") && (
                <span onClick={(e) => { e.stopPropagation(); handleIdeaLogoClick(); }} style={{ fontSize: isMobile ? 13 : 16, fontWeight: 900, letterSpacing: "0.02em", color: "#b79bff", marginLeft: 4, cursor: "pointer" }}>IDEA</span>
              )}
              {(screen === "home" || screen === "quiz") && (
                <span style={{ fontSize: isMobile ? 13 : 16, fontWeight: 900, letterSpacing: "0.02em", color: screen === "quiz" ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.4)", marginLeft: 4 }}>BASIC</span>
              )}
              <span style={{ fontSize: 9, color: (screen === "quiz" || screen === "idea-quiz" || screen === "idea-loading" || screen === "idea-results" || screen === "idea-transfer") ? "rgba(255,255,255,0.6)" : "rgba(0,0,0,0.5)", marginLeft: 2, marginRight: isMobile ? 10 : 0, transform: menuOpen ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}>▼</span>
            </button>

            {/* MENU DÉROULANT Basic / Business */}
            {menuOpen && (
              <>
                <div onClick={() => setMenuOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 110 }} />
                <div style={{ position: "absolute", top: 48, left: 0, zIndex: 120, background: "#fff", borderRadius: 16, boxShadow: "0 16px 40px rgba(0,0,0,0.18)", border: "1px solid #eee", overflow: "hidden", width: 320, animation: "slideDown 0.2s ease both" }}>
                  <div style={{ display: "flex", alignItems: "center", borderBottom: "1px solid #efefef", background: screen !== "idea" ? "#f6f6f7" : "#fff" }}>
                    <button onClick={() => { setMenuOpen(false); restart(); }} style={{ flex: 1, textAlign: "left", background: "transparent", border: "none", padding: "16px 14px 16px 18px", display: "flex", flexDirection: "column", gap: 3, cursor: "pointer" }}>
                      <span style={{ fontSize: 14, fontWeight: 900, color: "#000" }}>PLANSTART BASIC</span>
                      <span style={{ fontSize: 11, color: "rgba(0,0,0,0.5)", fontFamily: "Arial, sans-serif" }}>Génère ton business plan</span>
                    </button>
                    <div style={{ display: "flex", flexDirection: "column", gap: 5, padding: "0 14px 0 0", flexShrink: 0 }}>
                      <button onClick={() => setTheme("bw")} style={{ fontFamily: "Arial, sans-serif", fontWeight: 700, fontSize: 9, letterSpacing: "0.03em", padding: "6px 10px", borderRadius: 20, border: "1px solid #e5e5e5", background: !isOrange ? "#000" : "#fff", color: !isOrange ? "#fff" : "#000", whiteSpace: "nowrap", cursor: "pointer" }}>NOIR / BLANC</button>
                      <button onClick={() => setTheme("orange")} style={{ fontFamily: "Arial, sans-serif", fontWeight: 700, fontSize: 9, letterSpacing: "0.03em", padding: "6px 10px", borderRadius: 20, border: "1px solid #e5e5e5", background: isOrange ? "linear-gradient(90deg,#ff9d3d,#ff5e3a)" : "#fff", color: isOrange ? "#fff" : "#000", whiteSpace: "nowrap", cursor: "pointer" }}>ORANGE / NOIR</button>
                    </div>
                  </div>
                  <button onClick={() => { setMenuOpen(false); setScreen("idea"); }} style={{ width: "100%", textAlign: "left", background: screen === "idea" ? "#f3f0ff" : "#fff", border: "none", padding: "16px 18px", display: "flex", flexDirection: "column", gap: 3 }}>
                    <span style={{ fontSize: 14, fontWeight: 900, color: "#6c47ff", display: "flex", alignItems: "center", gap: 7 }}>PLANSTART IDEA <span style={{ fontSize: 8, background: "linear-gradient(90deg,#7c5cff,#5b8cff)", color: "#fff", padding: "2px 7px", borderRadius: 20, letterSpacing: "0.08em" }}>BIENTÔT</span></span>
                    <span style={{ fontSize: 11, color: "rgba(108,71,255,0.7)", fontFamily: "Arial, sans-serif" }}>Trouve l'idée qui te ressemble</span>
                  </button>
                </div>
              </>
            )}
          </div>
          {screen !== "quiz" && !String(screen).startsWith("idea") && (
            <div style={{ display: "flex", gap: isMobile ? 10 : 32, alignItems: "center" }}>
              <a href="#comment" style={{ fontSize: isMobile ? 9 : 11, fontWeight: 900, letterSpacing: isMobile ? "0.04em" : "0.08em", color: "rgba(0,0,0,0.5)", textDecoration: "none", whiteSpace: "nowrap" }}>COMMENT ÇA MARCHE</a>
              <a href="#apropos" style={{ fontSize: isMobile ? 9 : 11, fontWeight: 900, letterSpacing: isMobile ? "0.04em" : "0.08em", color: "rgba(0,0,0,0.5)", textDecoration: "none", whiteSpace: "nowrap" }}>À PROPOS</a>
            </div>
          )}
        </nav>
      )}

      {/* ── HOME ── */}
      {screen === "home" && (
        <div style={{ animation: "fadeIn 0.5s ease both" }}>

          {/* HERO */}
          <div style={{ height: "100vh", position: "relative", overflow: "hidden" }}>
            {IMAGES.map((img, i) => (
              <div key={i} style={{ position: "absolute", inset: 0, backgroundImage: `url(${img})`, backgroundSize: "cover", backgroundPosition: "center", opacity: i === slideIndex ? 1 : 0, transition: "opacity 1.5s ease" }} />
            ))}
            <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.52)" }} />
            <div style={{ position: "absolute", inset: 0, zIndex: 2, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", textAlign: "center", padding: isMobile ? "80px 24px 40px" : "100px 60px 60px", animation: "slideUp 0.8s ease 0.2s both" }}>
              <div style={{ fontSize: isMobile ? 12 : 14, color: "rgba(255,255,255,0.7)", fontWeight: 900, letterSpacing: "0.06em", marginBottom: 18, fontFamily: "Arial, sans-serif" }}>Ton idée mérite d'exister. On t'aide à la structurer.</div>
              <h1 style={{ fontSize: isMobile ? "clamp(44px,13vw,72px)" : "clamp(72px,9vw,120px)", fontWeight: 900, lineHeight: 0.9, letterSpacing: "-0.03em", color: "#fff", marginBottom: 20, textTransform: "uppercase" }}>
                TON PROJET.<br />TON PLAN.<br /><span style={{ color: NOW_COLOR, fontStyle: "italic" }}>MAINTENANT.</span>
              </h1>
              <p style={{ fontSize: isMobile ? 14 : 16, color: "rgba(255,255,255,0.6)", fontWeight: 400, marginBottom: 36, fontFamily: "Arial, sans-serif", maxWidth: 500 }}>Tu as une idée d'entreprise ? Réponds à 10 questions et obtiens un business plan personnalisé en quelques minutes. Gratuit et sans compte.</p>
              <button onClick={() => setScreen("quiz")} style={{ background: ACCENT_GRAD, color: isOrange ? "#fff" : "#000", border: "none", padding: isMobile ? "16px 40px" : "18px 48px", fontSize: 13, fontWeight: 900, letterSpacing: "0.12em", borderRadius: 14, boxShadow: isOrange ? "0 10px 30px rgba(255,94,58,0.35)" : "none" }}>CRÉER MON PLAN →</button>
            </div>
            <div style={{ position: "absolute", bottom: 20, left: "50%", transform: "translateX(-50%)", display: "flex", gap: 8, zIndex: 1 }}>
              {IMAGES.map((_, i) => (<div key={i} onClick={() => setSlideIndex(i)} style={{ width: i === slideIndex ? 32 : 8, height: 2, background: i === slideIndex ? (isOrange ? "#ff7a2e" : "#fff") : "rgba(255,255,255,0.3)", cursor: "pointer", transition: "all 0.4s ease" }} />))}
            </div>
            <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 2, background: "rgba(255,255,255,0.1)", zIndex: 1 }}>
              <div key={slideIndex} style={{ height: "100%", background: isOrange ? "#ff7a2e" : "#fff", animation: "barGrow 5s linear both" }} />
            </div>
          </div>

          {/* STATS — 3 blocs gris foncé arrondis, côte à côte, avec touche orange */}
          <div style={{ background: CREAM, padding: isMobile ? "14px 0px 8px" : "40px 0px 20px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: isMobile ? 8 : 20, alignItems: "stretch" }}>
              {[{ n: "SIMPLE ET RAPIDE", label: "Pour structurer ton projet" }, { n: "10 QUESTIONS", label: "Personnalisées pour toi" }, { n: "SANS COMPTE", label: "Aucune inscription" }].map((s, i) => (
                <div key={i} style={{ position: "relative", background: DARK, borderRadius: 18, padding: isMobile ? "14px 10px" : "26px 28px", boxShadow: "0 6px 22px rgba(0,0,0,0.12)", overflow: "hidden", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center" }}>
                  {/* touche orange : barre latérale */}
                  <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 5, background: isOrange ? "linear-gradient(180deg,#ff9d3d,#ff5e3a)" : "rgba(255,255,255,0.25)" }} />
                  <div style={{ fontSize: isMobile ? "clamp(11px,2.8vw,13px)" : "clamp(17px,2vw,22px)", fontWeight: 900, lineHeight: 1.15, color: "#fff", letterSpacing: "0.01em" }}>{s.n}</div>
                  <div style={{ fontSize: isMobile ? 9 : 13, color: "rgba(255,255,255,0.5)", fontFamily: "Arial, sans-serif", lineHeight: 1.3, marginTop: 7 }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* CE QUE TU OBTIENS */}
          <div style={{ padding: isMobile ? "10px 0px" : "20px 0px" }}>
            <div style={{ borderRadius: 24, overflow: "hidden", boxShadow: "0 8px 30px rgba(0,0,0,0.08)" }}>
            {isMobile ? (
              <div>
                <div style={{ height: 220, backgroundImage: "url(https://images.unsplash.com/photo-1664575602276-acd073f104c1?w=800&q=80)", backgroundSize: "cover", backgroundPosition: "center" }} />
                <div style={{ background: DARK, color: "#fff", padding: "48px 24px" }}>
                  <div style={{ fontSize: 13, letterSpacing: "0.2em", color: isOrange ? "#ff7a2e" : "rgba(255,255,255,0.5)", marginBottom: 32, fontWeight: 900 }}>CE QUE TU OBTIENS</div>
                  {["ANALYSE DE MARCHÉ", "PROJECTIONS FINANCIÈRES", "STRATÉGIE MARKETING", "PLAN D'ACTION 90 JOURS", "DÉMARCHES LÉGALES", "GESTION DES RISQUES"].map((item, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 16, padding: "14px 0", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
                      <span style={{ fontSize: 13, color: isOrange ? "#ff7a2e" : "#fff", minWidth: 28, fontWeight: 900, opacity: isOrange ? 1 : 0.4 }}>{String(i + 1).padStart(2, "0")}</span>
                      <span style={{ fontSize: 14, fontWeight: 900 }}>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", minHeight: 500 }}>
                <div style={{ backgroundImage: "url(https://images.unsplash.com/photo-1664575602276-acd073f104c1?w=800&q=80)", backgroundSize: "cover", backgroundPosition: "center" }} />
                <div style={{ background: DARK, color: "#fff", padding: "60px 48px", display: "flex", flexDirection: "column", justifyContent: "center" }}>
                  <div style={{ fontSize: 13, letterSpacing: "0.2em", color: isOrange ? "#ff7a2e" : "rgba(255,255,255,0.5)", marginBottom: 36, fontWeight: 900 }}>CE QUE TU OBTIENS</div>
                  {["ANALYSE DE MARCHÉ", "PROJECTIONS FINANCIÈRES", "STRATÉGIE MARKETING", "PLAN D'ACTION 90 JOURS", "DÉMARCHES LÉGALES", "GESTION DES RISQUES"].map((item, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 20, padding: "16px 0", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
                      <span style={{ fontSize: 13, color: isOrange ? "#ff7a2e" : "#fff", minWidth: 32, fontWeight: 900, opacity: isOrange ? 1 : 0.4 }}>{String(i + 1).padStart(2, "0")}</span>
                      <span style={{ fontSize: 15, fontWeight: 900 }}>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            </div>
          </div>

          {/* POUR QUI */}
          <div style={{ background: CREAM, padding: sectionPad }}>
            <div style={{ maxWidth: 1400, margin: "0 auto" }}>
              <div style={{ fontSize: 13, letterSpacing: "0.2em", color: isOrange ? "#ff7a2e" : "#000", marginBottom: isMobile ? 24 : 28, fontWeight: 900 }}>FAIT POUR TOI SI —</div>
              {["TU AS UNE IDÉE MAIS TU NE SAIS PAS PAR OÙ COMMENCER", "TU VEUX SAVOIR SI TON IDÉE EST VIABLE", "TU VEUX STRUCTURER TON PROJET RAPIDEMENT", "TU VEUX TE METTRE À TON COMPTE", "TU VEUX CRÉER TON ENTREPRISE AVEC UN PLAN CLAIR", "TU CHERCHES UN BUSINESS PLAN SIMPLE ET PERSONNALISÉ"].map((item, i) => (
                <div key={i} style={{ borderBottom: "1px solid #e5e5e5", padding: isMobile ? "16px 0" : "15px 0", display: "flex", alignItems: "flex-start", gap: 18 }}>
                  <span style={{ fontSize: 12, color: isOrange ? "#ff7a2e" : "#000", minWidth: 28, fontWeight: 900, paddingTop: 2, opacity: isOrange ? 1 : 0.4 }}>{String(i + 1).padStart(2, "0")}</span>
                  <span style={{ fontSize: isMobile ? 15 : 16, fontWeight: 800, lineHeight: 1.3 }}>{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* COMMENT ÇA MARCHE */}
          <div id="comment" style={{ background: CREAM_ALT, padding: sectionPad }}>
            <div style={{ maxWidth: 1400, margin: "0 auto" }}>
              <div style={{ fontSize: 13, letterSpacing: "0.2em", color: isOrange ? "#ff7a2e" : "#000", marginBottom: 48, fontWeight: 900 }}>COMMENT ÇA MARCHE</div>
              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3,1fr)", gap: isMobile ? 32 : 2 }}>
                {[
                  { n: "01", titre: "TU RÉPONDS", desc: "Réponds à 10 questions simples sur ton projet, ton expérience et tes objectifs. Chaque question s'adapte à tes réponses pour comprendre précisément ton idée." },
                  { n: "02", titre: "ON CONSTRUIT TON PLAN", desc: "À partir de tes réponses, notre IA structure ton projet et génère une analyse complète : marché, stratégie, finances, plan d'action et démarches essentielles." },
                  { n: "03", titre: "TU TÉLÉCHARGES", desc: "Récupère un business plan complet, personnalisé et prêt à t'aider à lancer ton activité." },
                ].map((step, i) => (
                  <div key={i} style={{ padding: isMobile ? "0" : "0 40px 0 0", borderRight: !isMobile && i < 2 ? "1px solid #e5e5e5" : "none" }}>
                    <div style={{ fontSize: 48, fontWeight: 900, color: isOrange ? "#ff7a2e" : "#e5e5e5", lineHeight: 1, marginBottom: 16, opacity: isOrange ? 0.9 : 1 }}>{step.n}</div>
                    <div style={{ fontSize: 16, fontWeight: 900, marginBottom: 12 }}>{step.titre}</div>
                    <div style={{ fontSize: 14, color: "rgba(0,0,0,0.5)", lineHeight: 1.7, fontFamily: "Arial, sans-serif" }}>{step.desc}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* REJOINS LES PREMIERS UTILISATEURS */}
          <div style={{ background: CREAM_ALT, padding: isMobile ? "12px 0px 24px" : "20px 0px 36px" }}>
            <div style={{ background: DARK, borderRadius: 24, padding: isMobile ? "48px 24px" : "64px 60px", textAlign: "center" }}>
            <div style={{ maxWidth: 900, margin: "0 auto" }}>
              <div style={{ fontSize: 13, letterSpacing: "0.2em", color: isOrange ? "#ff7a2e" : "rgba(255,255,255,0.4)", marginBottom: 24, fontWeight: 900 }}>REJOINS LES PREMIERS UTILISATEURS</div>
              <h2 style={{ fontSize: isMobile ? 28 : 40, fontWeight: 900, color: "#fff", lineHeight: 1.15, marginBottom: 20, letterSpacing: "-0.02em" }}>
                ACCÈDE GRATUITEMENT,<br />PARTAGE TON AVIS,<br />INFLUENCE LA SUITE !
              </h2>
              <p style={{ fontSize: 16, color: "rgba(255,255,255,0.5)", fontFamily: "Arial, sans-serif", lineHeight: 1.7, marginBottom: 40 }}>
                Génère ton business plan gratuitement et aide-nous à améliorer la plateforme. Ton avis nous aidera à rendre l'outil encore plus utile.
              </p>
              <button onClick={() => setScreen("quiz")} style={{ background: isOrange ? "linear-gradient(90deg,#ff9d3d,#ff5e3a)" : "#fff", color: isOrange ? "#fff" : "#000", border: "none", padding: isMobile ? "16px 40px" : "18px 48px", fontSize: 13, fontWeight: 900, letterSpacing: "0.12em", borderRadius: 14 }}>
                CRÉER MON PLAN →
              </button>
            </div>
            </div>
          </div>

          {/* À PROPOS */}
          <div id="apropos" style={{ background: CREAM_ALT, padding: sectionPad }}>
            <div style={{ maxWidth: 1400, margin: "0 auto", display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: isMobile ? 32 : 80, alignItems: "center" }}>
              <div>
                <div style={{ fontSize: 13, letterSpacing: "0.2em", color: isOrange ? "#ff7a2e" : "#000", marginBottom: 32, fontWeight: 900 }}>À PROPOS</div>
                <h2 style={{ fontSize: isMobile ? 24 : 32, fontWeight: 900, letterSpacing: "-0.02em", lineHeight: 1.1, marginBottom: 20 }}>PLANSTART C'EST POUR CEUX QUI PASSENT À L'ACTION.</h2>
                <p style={{ fontSize: 15, color: "rgba(0,0,0,0.6)", lineHeight: 1.7, fontFamily: "Arial, sans-serif", marginBottom: 16 }}>J'ai créé PLANSTART parce que beaucoup de personnes ont une idée de projet mais ne savent pas comment la transformer en quelque chose de concret.</p>
                <p style={{ fontSize: 15, color: "rgba(0,0,0,0.6)", lineHeight: 1.7, fontFamily: "Arial, sans-serif" }}>L'objectif est simple : rendre la création d'entreprise plus accessible en permettant à chacun d'obtenir un business plan structuré, sans connaissances particulières et sans dépenser des milliers d'euros.</p>
              </div>
              <div style={{ background: DARK, padding: "40px 32px", borderRadius: 20 }}>
                {[{ n: "100% GRATUIT", label: "" }, { n: "7 SECTIONS", label: "" }, { n: "10 QUESTIONS", label: "" }].map((stat, i) => (
                  <div key={i} style={{ padding: "18px 0", borderBottom: i < 2 ? "1px solid rgba(255,255,255,0.1)" : "none" }}>
                    <div style={{ fontSize: isMobile ? 20 : 32, fontWeight: 900, color: isOrange ? "#ff7a2e" : "#fff", lineHeight: 1 }}>{stat.n}</div>
                    <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", fontFamily: "Arial, sans-serif", marginTop: 4, letterSpacing: "0.05em" }}>{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* CTA FINAL */}
          <div style={{ background: CREAM_ALT, padding: isMobile ? "12px 0px 24px" : "20px 0px 44px" }}>
            <div style={{ background: DARK, borderRadius: 24, padding: isMobile ? "56px 24px" : "80px 60px", textAlign: "center" }}>
            <h2 style={{ fontSize: isMobile ? "clamp(44px,13vw,72px)" : "clamp(56px,9vw,96px)", fontWeight: 900, letterSpacing: "-0.03em", lineHeight: 0.9, marginBottom: 40, color: "#fff", textTransform: "uppercase" }}>
              PRÊT À<br /><span style={{ color: isOrange ? "#ff7a2e" : "rgba(255,255,255,0.2)" }}>TE LANCER ?</span>
            </h2>
            <button onClick={() => setScreen("quiz")} style={{ background: isOrange ? "linear-gradient(90deg,#ff9d3d,#ff5e3a)" : "#fff", color: isOrange ? "#fff" : "#000", border: "none", padding: isMobile ? "16px 40px" : "20px 60px", fontSize: isMobile ? 13 : 14, fontWeight: 900, letterSpacing: "0.15em", borderRadius: 14 }}>C'EST PARTI →</button>
            </div>
          </div>

          {/* FOOTER LÉGAL */}
          <div style={{ background: CREAM, borderTop: "1px solid #ededed", padding: isMobile ? "24px 20px 110px" : "24px 40px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
            <span style={{ fontSize: 11, color: "rgba(0,0,0,0.3)", fontFamily: "Arial, sans-serif" }}>© 2025-2026 PLANSTART — Tous droits réservés</span>
            <div style={{ display: "flex", gap: 24 }}>
              {[["Mentions légales", "/mentions-legales"], ["Confidentialité", "/confidentialite"], ["CGU", "/cgu"]].map(([label, href]) => (
                <a key={href} href={href} style={{ fontSize: 11, color: "rgba(0,0,0,0.4)", textDecoration: "none", fontFamily: "Arial, sans-serif" }}>{label}</a>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── IDEA (vitrine ampoule jaune sur fond sombre) ── */}
      {screen === "idea" && (
        <div style={{ background: "#15122B" }}>
          {/* BANDEAU MODE PREVIEW */}
          {ideaPreview && (
            <div style={{ position: "fixed", top: 60, left: 0, right: 0, zIndex: 99, background: IDEA_VIOLET_ACCENT, color: "#fff", padding: "8px 16px", textAlign: "center", fontSize: 11, fontWeight: 900, letterSpacing: "0.06em" }}>
              🛠 MODE PREVIEW — PlanStart Idea (visible uniquement par toi)
              <button onClick={() => { try { localStorage.removeItem("ideaPreview"); } catch {} setIdeaPreview(false); }} style={{ marginLeft: 12, background: "rgba(0,0,0,0.25)", color: "#fff", border: "none", borderRadius: 6, padding: "3px 10px", fontSize: 10, fontWeight: 900, cursor: "pointer" }}>QUITTER</button>
            </div>
          )}
          {/* HERO IDEA */}
          <div style={{ minHeight: "100vh", position: "relative", overflow: "hidden", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", textAlign: "center", padding: isMobile ? "100px 24px 60px" : "120px 60px 80px" }}>
            <div style={{ position: "absolute", inset: 0, backgroundImage: isMobile ? "url(/319A8DC6-FBF7-4DCA-9E03-D5F02CE4B3C6.PNG)" : "url(/19A5C07F-D0FE-411D-BF24-87746C272A6E.PNG)", backgroundSize: "cover", backgroundPosition: "center center" }} />
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(21,18,43,0.25) 0%, rgba(21,18,43,0.45) 50%, rgba(21,18,43,0.9) 75%)" }} />
            <div style={{ position: "relative", zIndex: 2, animation: "slideUp 0.8s ease 0.2s both", maxWidth: 720 }}>
              <div onClick={!ideaPreview ? handleIdeaLogoClick : undefined} style={{ display: "inline-flex", alignItems: "center", gap: 10, background: "rgba(255,255,255,0.1)", border: "1px solid rgba(183,155,255,0.4)", borderRadius: 30, padding: "10px 22px", marginBottom: 32, cursor: !ideaPreview ? "default" : "default" }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#b79bff", display: "inline-block" }} />
                <span style={{ fontSize: 12, fontWeight: 900, letterSpacing: "0.12em", color: "#fff" }}>{ideaPreview ? "MODE PREVIEW ACTIF" : "BIENTÔT DISPONIBLE"}</span>
              </div>
              <h1 style={{ fontSize: isMobile ? "clamp(40px,11vw,64px)" : "clamp(60px,7vw,96px)", fontWeight: 900, lineHeight: 0.95, letterSpacing: "-0.03em", color: "#fff", marginBottom: 24, textTransform: "uppercase" }}>
                ET SI LA BONNE<br />IDÉE ÉTAIT DÉJÀ<br /><span style={{ color: "#b79bff", fontStyle: "italic" }}>EN TOI ?</span>
              </h1>
              <p style={{ fontSize: isMobile ? 15 : 18, color: "rgba(255,255,255,0.7)", fontWeight: 400, marginBottom: 40, fontFamily: "Arial, sans-serif", maxWidth: 520, marginLeft: "auto", marginRight: "auto", lineHeight: 1.7 }}>{ideaPreview ? "Réponds à quelques questions et découvre les 3 business les plus adaptés à ton profil." : "PlanStart Idea t'aidera bientôt à trouver et tester l'idée de business faite pour toi. En attendant, crée ton business plan gratuitement."}</p>
              {ideaPreview ? (
                <button onClick={startIdeaQuiz} style={{ background: "linear-gradient(90deg,#8D6EFF,#B79BFF)", color: "#fff", border: "none", padding: isMobile ? "16px 36px" : "18px 48px", fontSize: 13, fontWeight: 900, letterSpacing: "0.1em", borderRadius: 14, cursor: "pointer", boxShadow: "0 8px 30px rgba(141,110,255,0.4)" }}>TROUVER MON IDÉE ✦</button>
              ) : (
                <button onClick={restart} style={{ background: "#fff", color: "#1a1530", border: "none", padding: isMobile ? "16px 36px" : "18px 48px", fontSize: 13, fontWeight: 900, letterSpacing: "0.1em", borderRadius: 14, cursor: "pointer" }}>ESSAYER PLANSTART GRATUIT →</button>
              )}
            </div>
          </div>

          {/* ═══════ SECTIONS HOME IDEA — visibles en preview uniquement ═══════ */}
          {ideaPreview && (
            <>
              {/* 3 CARTES */}
              <div style={{ background: IDEA_BG, padding: isMobile ? "14px 0px 8px" : "40px 0px 20px" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: isMobile ? 8 : 20, alignItems: "stretch" }}>
                  {[{ n: "RAPIDE", label: "6 questions, 30 secondes" }, { n: "SUR-MESURE", label: "Adapté à ton profil" }, { n: "ACTIONNABLE", label: "3 idées prêtes à lancer" }].map((s, i) => (
                    <div key={i} style={{ position: "relative", background: IDEA_SURFACE, borderRadius: 18, padding: isMobile ? "14px 10px" : "26px 28px", boxShadow: "0 6px 22px rgba(0,0,0,0.3)", overflow: "hidden", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", border: "1px solid rgba(183,155,255,0.15)" }}>
                      <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 5, background: "linear-gradient(180deg,#8D6EFF,#B79BFF)" }} />
                      <div style={{ fontSize: isMobile ? "clamp(11px,2.8vw,13px)" : "clamp(17px,2vw,22px)", fontWeight: 900, lineHeight: 1.15, color: "#fff", letterSpacing: "0.01em" }}>{s.n}</div>
                      <div style={{ fontSize: isMobile ? 9 : 13, color: IDEA_TEXT2, fontFamily: "Arial, sans-serif", lineHeight: 1.3, marginTop: 7 }}>{s.label}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* CE QUE TU OBTIENS */}
              <div style={{ padding: isMobile ? "10px 0px" : "20px 0px" }}>
                <div style={{ borderRadius: 24, overflow: "hidden", boxShadow: "0 8px 30px rgba(0,0,0,0.3)" }}>
                  <div style={{ width: "100%", height: isMobile ? 200 : 320, backgroundImage: "url(https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=1200&q=80)", backgroundSize: "cover", backgroundPosition: "center" }} />
                  <div style={{ background: IDEA_SURFACE, padding: isMobile ? "32px 22px" : "48px 48px" }}>
                    <div style={{ fontSize: 13, letterSpacing: "0.2em", color: IDEA_VIOLET, marginBottom: isMobile ? 24 : 28, fontWeight: 900 }}>CE QUE TU OBTIENS</div>
                    {["3 IDÉES PERSONNALISÉES", "UN SCORE DE COMPATIBILITÉ", "BUDGET ET PREMIERS REVENUS", "POURQUOI C'EST FAIT POUR TOI", "POURQUOI C'EST INTÉRESSANT MAINTENANT", "LE PONT VERS TON BUSINESS PLAN"].map((item, i) => (
                      <div key={i} style={{ borderBottom: "1px solid rgba(183,155,255,0.12)", padding: isMobile ? "16px 0" : "15px 0", display: "flex", alignItems: "flex-start", gap: 18 }}>
                        <span style={{ fontSize: 12, color: IDEA_VIOLET, minWidth: 28, fontWeight: 900, paddingTop: 2 }}>{String(i + 1).padStart(2, "0")}</span>
                        <span style={{ fontSize: isMobile ? 15 : 16, fontWeight: 800, lineHeight: 1.3, color: "#fff" }}>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* FAIT POUR TOI SI */}
              <div style={{ background: IDEA_BG, padding: isMobile ? "32px 20px" : "44px 60px" }}>
                <div style={{ maxWidth: 1400, margin: "0 auto" }}>
                  <div style={{ fontSize: 13, letterSpacing: "0.2em", color: IDEA_VIOLET, marginBottom: isMobile ? 24 : 28, fontWeight: 900 }}>FAIT POUR TOI SI —</div>
                  {["TU N'AS PAS ENCORE TROUVÉ TON IDÉE", "TU HÉSITES ENTRE PLUSIEURS DIRECTIONS", "TU AS UNE INTUITION MAIS TU DOUTES", "TU VEUX ENTREPRENDRE MAIS TU NE SAIS PAS QUOI", "TU CHERCHES UNE IDÉE ADAPTÉE À TON BUDGET", "TU VEUX UNE OPPORTUNITÉ RÉELLE, PAS UN CLICHÉ"].map((item, i) => (
                    <div key={i} style={{ borderBottom: "1px solid rgba(183,155,255,0.12)", padding: isMobile ? "16px 0" : "15px 0", display: "flex", alignItems: "flex-start", gap: 18 }}>
                      <span style={{ fontSize: 12, color: IDEA_VIOLET, minWidth: 28, fontWeight: 900, paddingTop: 2 }}>{String(i + 1).padStart(2, "0")}</span>
                      <span style={{ fontSize: isMobile ? 15 : 16, fontWeight: 800, lineHeight: 1.3, color: "#fff" }}>{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* COMMENT ÇA MARCHE */}
              <div style={{ background: IDEA_SURFACE, padding: isMobile ? "32px 20px" : "44px 60px" }}>
                <div style={{ maxWidth: 1400, margin: "0 auto" }}>
                  <div style={{ fontSize: 13, letterSpacing: "0.2em", color: IDEA_VIOLET, marginBottom: isMobile ? 32 : 48, fontWeight: 900 }}>COMMENT ÇA MARCHE</div>
                  <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3,1fr)", gap: isMobile ? 32 : 2 }}>
                    {[
                      { n: "01", titre: "TU RÉPONDS", desc: "6 questions rapides sur ton profil, tes envies, ton budget et le temps que tu peux investir. 30 secondes, pas plus." },
                      { n: "02", titre: "ON ANALYSE", desc: "Notre IA évalue des centaines d'opportunités, filtre les marchés saturés et les idées irréalistes pour ne garder que ce qui te correspond." },
                      { n: "03", titre: "TU DÉCOUVRES", desc: "3 business faits pour toi, classés par compatibilité, avec budget, premiers revenus et la marche à suivre. Prêts à lancer." },
                    ].map((step, i) => (
                      <div key={i} style={{ padding: isMobile ? "0" : "0 40px 0 0", borderRight: !isMobile && i < 2 ? "1px solid rgba(183,155,255,0.12)" : "none" }}>
                        <div style={{ fontSize: 48, fontWeight: 900, color: IDEA_VIOLET, lineHeight: 1, marginBottom: 16, opacity: 0.9 }}>{step.n}</div>
                        <div style={{ fontSize: 16, fontWeight: 900, marginBottom: 12, color: "#fff" }}>{step.titre}</div>
                        <div style={{ fontSize: 14, color: IDEA_TEXT2, lineHeight: 1.7, fontFamily: "Arial, sans-serif" }}>{step.desc}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* BANNIÈRE PHOTO */}
              <div style={{ width: "100%", height: isMobile ? 220 : 360, backgroundImage: "url(https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=1400&q=80)", backgroundSize: "cover", backgroundPosition: "center", position: "relative" }}>
                <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(34,28,61,0.55), rgba(21,18,43,0.8))" }} />
                <div style={{ position: "relative", zIndex: 2, height: "100%", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", textAlign: "center", padding: "0 24px" }}>
                  <h2 style={{ fontSize: isMobile ? 24 : 38, fontWeight: 900, color: "#fff", lineHeight: 1.15, letterSpacing: "-0.02em" }}>L'idée parfaite ne se trouve pas par hasard.<br /><span style={{ color: IDEA_VIOLET }}>Elle se révèle.</span></h2>
                </div>
              </div>

              {/* CTA FINAL */}
              <div style={{ background: IDEA_BG, padding: isMobile ? "12px 0px 24px" : "20px 0px 44px" }}>
                <div style={{ background: "linear-gradient(135deg,#1a1040,#0f0a2e)", borderRadius: 24, padding: isMobile ? "56px 24px" : "80px 60px", textAlign: "center", border: "1px solid rgba(183,155,255,0.2)" }}>
                  <div style={{ maxWidth: 900, margin: "0 auto" }}>
                    <div style={{ fontSize: 13, letterSpacing: "0.2em", color: IDEA_VIOLET, marginBottom: 24, fontWeight: 900 }}>TON IDÉE T'ATTEND</div>
                    <h2 style={{ fontSize: isMobile ? 36 : 64, fontWeight: 900, color: "#fff", lineHeight: 0.95, marginBottom: 24, letterSpacing: "-0.03em", textTransform: "uppercase" }}>PRÊT À<br /><span style={{ color: IDEA_VIOLET }}>TROUVER TON IDÉE ?</span></h2>
                    <p style={{ fontSize: 16, color: IDEA_TEXT2, fontFamily: "Arial, sans-serif", lineHeight: 1.7, marginBottom: 40 }}>Réponds à 6 questions et découvre les business les plus adaptés à ton profil. Gratuit et sans compte.</p>
                    <button onClick={startIdeaQuiz} style={{ background: "linear-gradient(90deg,#8D6EFF,#B79BFF)", color: "#fff", border: "none", padding: isMobile ? "16px 40px" : "18px 48px", fontSize: 13, fontWeight: 900, letterSpacing: "0.12em", borderRadius: 14, cursor: "pointer", boxShadow: "0 10px 30px rgba(141,110,255,0.4)" }}>TROUVER MON IDÉE ✦</button>
                  </div>
                </div>
              </div>

              {/* FOOTER LÉGAL */}
              <div style={{ background: IDEA_BG, borderTop: "1px solid rgba(183,155,255,0.12)", padding: isMobile ? "24px 20px 110px" : "24px 40px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
                <span style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", fontFamily: "Arial, sans-serif" }}>© 2025-2026 PLANSTART — Tous droits réservés</span>
                <div style={{ display: "flex", gap: 20 }}>
                  <a href="/mentions-legales.html" style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", textDecoration: "none", fontFamily: "Arial, sans-serif" }}>Mentions légales</a>
                  <a href="/confidentialite.html" style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", textDecoration: "none", fontFamily: "Arial, sans-serif" }}>Confidentialité</a>
                  <a href="/cgu.html" style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", textDecoration: "none", fontFamily: "Arial, sans-serif" }}>CGU</a>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* ── MODALE MOT DE PASSE PREVIEW ── */}
      {showPreviewModal && (
        <div style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(0,0,0,0.8)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }} onClick={() => setShowPreviewModal(false)}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: IDEA_SURFACE, borderRadius: 18, padding: isMobile ? "32px 24px" : "40px 36px", width: "100%", maxWidth: 380, border: `1px solid ${IDEA_VIOLET_ACCENT}` }}>
            <div style={{ fontSize: 18, fontWeight: 900, color: "#fff", marginBottom: 8 }}>🔒 Accès preview</div>
            <div style={{ fontSize: 13, color: IDEA_TEXT2, fontFamily: "Arial, sans-serif", marginBottom: 24, lineHeight: 1.6 }}>Entre le mot de passe pour accéder à PlanStart Idea en avant-première.</div>
            <input
              type="password"
              value={previewPwd}
              onChange={(e) => { setPreviewPwd(e.target.value); setPreviewError(false); }}
              onKeyDown={(e) => { if (e.key === "Enter") checkPreviewPassword(); }}
              placeholder="Mot de passe"
              autoFocus
              style={{ width: "100%", boxSizing: "border-box", padding: "14px 16px", borderRadius: 10, border: `1px solid ${previewError ? "#ff5e5e" : "rgba(183,155,255,0.3)"}`, background: IDEA_BG, color: "#fff", fontSize: 15, marginBottom: previewError ? 8 : 20, outline: "none" }}
            />
            {previewError && <div style={{ fontSize: 12, color: "#ff5e5e", marginBottom: 16 }}>Mot de passe incorrect</div>}
            <button onClick={checkPreviewPassword} style={{ width: "100%", background: "linear-gradient(90deg,#8D6EFF,#B79BFF)", color: "#fff", border: "none", padding: "14px", fontSize: 13, fontWeight: 900, letterSpacing: "0.08em", borderRadius: 10, cursor: "pointer" }}>ACCÉDER →</button>
          </div>
        </div>
      )}


      {/* ── IDEA QUIZ ── */}
      {screen === "idea-quiz" && (() => {
        const isDynamic = ideaStep === IDEA_QUESTIONS.length;
        const dynamicQ = isDynamic ? IDEA_DYNAMIC[ideaAnswers.interet] : null;
        const currentQ = isDynamic ? dynamicQ : IDEA_QUESTIONS[ideaStep];
        if (!currentQ) return null;
        const progress = ((ideaStep + 1) / ideaTotalSteps) * 100;
        const currentKey = isDynamic ? "dynamique" : currentQ.key;
        return (
          <div style={{ minHeight: "100vh", position: "relative", overflow: "hidden", background: IDEA_BG, display: "flex", flexDirection: "column", justifyContent: "center", padding: isMobile ? "90px 24px 60px" : "100px 60px 60px", animation: "slideUp 0.4s ease both" }}>
            <div style={{ position: "absolute", inset: 0, backgroundImage: isMobile ? "url(/319A8DC6-FBF7-4DCA-9E03-D5F02CE4B3C6.PNG)" : "url(/19A5C07F-D0FE-411D-BF24-87746C272A6E.PNG)", backgroundSize: "cover", backgroundPosition: "center center", opacity: 0.45 }} />
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(34,28,61,0.5) 0%, rgba(21,18,43,0.65) 100%)" }} />
            <div style={{ maxWidth: 680, margin: "0 auto", width: "100%", position: "relative", zIndex: 2 }}>
              {/* Progression */}
              <div style={{ marginBottom: 40 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                  <span style={{ fontSize: 12, fontWeight: 900, color: IDEA_VIOLET, letterSpacing: "0.1em" }}>QUESTION {ideaStep + 1} / {ideaTotalSteps}</span>
                  <span style={{ fontSize: 12, color: IDEA_TEXT2, fontFamily: "Arial, sans-serif" }}>~30 secondes</span>
                </div>
                <div style={{ height: 5, background: "rgba(183,155,255,0.15)", borderRadius: 10, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${progress}%`, background: "linear-gradient(90deg,#8D6EFF,#B79BFF)", borderRadius: 10, transition: "width 0.4s ease", boxShadow: "0 0 12px rgba(183,155,255,0.6)" }} />
                </div>
              </div>
              {/* Question */}
              <h2 style={{ fontSize: isMobile ? 26 : 36, fontWeight: 900, color: "#fff", lineHeight: 1.15, letterSpacing: "-0.02em", marginBottom: 32 }}>{currentQ.q}</h2>
              {/* Options */}
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {currentQ.opts.map((opt, i) => (
                  <button
                    key={i}
                    onClick={() => answerIdea(currentKey, opt)}
                    style={{ textAlign: "left", background: IDEA_SURFACE, border: "1px solid rgba(183,155,255,0.2)", borderRadius: 14, padding: isMobile ? "18px 20px" : "20px 24px", color: "#fff", fontSize: isMobile ? 15 : 17, fontWeight: 700, cursor: "pointer", transition: "all 0.18s", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = IDEA_VIOLET; e.currentTarget.style.background = "#1f1b30"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(183,155,255,0.2)"; e.currentTarget.style.background = IDEA_SURFACE; }}
                  >
                    <span>{opt}</span>
                    <span style={{ color: IDEA_VIOLET, fontSize: 18, opacity: 0.6 }}>→</span>
                  </button>
                ))}
              </div>
              {/* Retour */}
              {ideaStep > 0 && (
                <button onClick={() => setIdeaStep(ideaStep - 1)} style={{ background: "transparent", border: "none", color: IDEA_TEXT2, fontSize: 12, fontWeight: 900, letterSpacing: "0.08em", marginTop: 28, padding: 0, cursor: "pointer" }}>← RETOUR</button>
              )}
            </div>
          </div>
        );
      })()}

      {/* ── IDEA LOADING ── */}
      {screen === "idea-loading" && (
        <div style={{ minHeight: "100vh", background: IDEA_BG, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", padding: isMobile ? "90px 24px" : "100px 60px", textAlign: "center" }}>
          <div style={{ maxWidth: 480, width: "100%" }}>
            <div style={{ width: 64, height: 64, margin: "0 auto 32px", borderRadius: "50%", background: "radial-gradient(circle, rgba(141,110,255,0.4), transparent 70%)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32, animation: "pulse 1.5s ease-in-out infinite" }}>✦</div>
            <div style={{ fontSize: isMobile ? 20 : 24, fontWeight: 900, color: "#fff", marginBottom: 36 }}>On analyse ton profil</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 16, textAlign: "left" }}>
              {IDEA_LOAD_STEPS.map((step, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 14, opacity: i <= ideaLoadStep ? 1 : 0.3, transition: "opacity 0.4s" }}>
                  <div style={{ width: 22, height: 22, borderRadius: "50%", flexShrink: 0, background: i < ideaLoadStep ? "linear-gradient(90deg,#8D6EFF,#B79BFF)" : "transparent", border: i < ideaLoadStep ? "none" : `2px solid ${i === ideaLoadStep ? IDEA_VIOLET : "rgba(183,155,255,0.3)"}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, color: "#fff" }}>
                    {i < ideaLoadStep ? "✓" : (i === ideaLoadStep ? <span style={{ width: 8, height: 8, borderRadius: "50%", background: IDEA_VIOLET, animation: "pulse 1s infinite" }} /> : "")}
                  </div>
                  <span style={{ fontSize: isMobile ? 14 : 16, fontWeight: 700, color: i <= ideaLoadStep ? "#fff" : IDEA_TEXT2 }}>{step}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── IDEA RESULTS ── */}
      {screen === "idea-results" && (
        <div style={{ minHeight: "100vh", background: IDEA_BG, padding: isMobile ? "90px 16px 60px" : "110px 40px 80px" }}>
          <div style={{ maxWidth: 760, margin: "0 auto" }}>
            {ideaError ? (
              <div style={{ textAlign: "center", paddingTop: 40 }}>
                <div style={{ fontSize: 40, marginBottom: 20 }}>😕</div>
                <div style={{ fontSize: 18, fontWeight: 900, color: "#fff", marginBottom: 12 }}>Oups</div>
                <p style={{ color: IDEA_TEXT2, fontFamily: "Arial, sans-serif", marginBottom: 28 }}>{ideaError}</p>
                <button onClick={() => launchIdeaGeneration(ideaAnswers)} style={{ background: "linear-gradient(90deg,#8D6EFF,#B79BFF)", color: "#fff", border: "none", padding: "14px 32px", fontSize: 13, fontWeight: 900, letterSpacing: "0.08em", borderRadius: 12, cursor: "pointer" }}>RÉESSAYER</button>
              </div>
            ) : ideaResults ? (
              <>
                <div style={{ textAlign: "center", marginBottom: 40 }}>
                  <div style={{ fontSize: 12, fontWeight: 900, color: IDEA_VIOLET, letterSpacing: "0.12em", marginBottom: 12 }}>TES 3 OPPORTUNITÉS</div>
                  <h1 style={{ fontSize: isMobile ? 28 : 38, fontWeight: 900, color: "#fff", lineHeight: 1.1, letterSpacing: "-0.02em", marginBottom: 12 }}>Voici les business faits pour toi</h1>
                  <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: IDEA_SURFACE, border: "1px solid rgba(183,155,255,0.2)", borderRadius: 20, padding: "6px 16px" }}>
                    <span style={{ fontSize: 11, color: IDEA_TEXT2, fontFamily: "Arial, sans-serif" }}>Confiance de l'analyse :</span>
                    <span style={{ fontSize: 11, fontWeight: 900, color: ideaResults.confidence === "Élevée" ? "#5fe3a1" : "#ffce6b" }}>{ideaResults.confidence}</span>
                  </div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                  {ideaResults.ideas.map((idea, i) => {
                    const isTop = idea.rank === 1;
                    const borderColor = isTop ? IDEA_VIOLET : idea.rank === 2 ? "rgba(183,155,255,0.35)" : "rgba(255,255,255,0.12)";
                    const isExpanded = expandedCard === i;
                    return (
                      <div key={i} style={{ background: IDEA_SURFACE, borderRadius: 18, border: `1px solid ${borderColor}`, padding: isMobile ? "22px 20px" : "28px 28px", boxShadow: isTop ? "0 10px 40px rgba(141,110,255,0.25)" : "none" }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14, gap: 10 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <span style={{ fontSize: 24 }}>{idea.medal}</span>
                            <span style={{ fontSize: 11, fontWeight: 900, color: isTop ? IDEA_VIOLET : IDEA_TEXT2, letterSpacing: "0.06em" }}>{idea.compatibilityLabel}</span>
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: 6, background: IDEA_BG, borderRadius: 20, padding: "5px 12px" }}>
                            <span style={{ fontSize: 16, fontWeight: 900, color: isTop ? IDEA_VIOLET : "#fff" }}>{idea.compatibilityScore}%</span>
                          </div>
                        </div>
                        <h2 style={{ fontSize: isMobile ? 20 : 24, fontWeight: 900, color: "#fff", marginBottom: 8, lineHeight: 1.15 }}>{idea.name}</h2>
                        <p style={{ fontSize: 14, color: IDEA_TEXT2, fontFamily: "Arial, sans-serif", lineHeight: 1.6, marginBottom: 18 }}>{idea.pitch}</p>

                        {/* Badges */}
                        {idea.badges && idea.badges.length > 0 && (
                          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 18 }}>
                            {idea.badges.map((b, bi) => (
                              <span key={bi} style={{ fontSize: 11, fontWeight: 700, color: IDEA_VIOLET, background: "rgba(183,155,255,0.12)", border: "1px solid rgba(183,155,255,0.25)", borderRadius: 20, padding: "5px 12px" }}>{b}</span>
                            ))}
                          </div>
                        )}

                        {/* Infos clés */}
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 18 }}>
                          <div style={{ background: IDEA_BG, borderRadius: 10, padding: "12px 14px" }}>
                            <div style={{ fontSize: 10, color: IDEA_TEXT2, fontFamily: "Arial, sans-serif", marginBottom: 3, letterSpacing: "0.04em" }}>BUDGET DE DÉPART</div>
                            <div style={{ fontSize: 15, fontWeight: 900, color: "#fff" }}>{idea.startBudget}</div>
                          </div>
                          <div style={{ background: IDEA_BG, borderRadius: 10, padding: "12px 14px" }}>
                            <div style={{ fontSize: 10, color: IDEA_TEXT2, fontFamily: "Arial, sans-serif", marginBottom: 3, letterSpacing: "0.04em" }}>PREMIERS REVENUS</div>
                            <div style={{ fontSize: 15, fontWeight: 900, color: "#fff" }}>{idea.firstRevenue}</div>
                          </div>
                        </div>

                        {/* Pourquoi toi / pourquoi maintenant */}
                        <div style={{ marginBottom: 16 }}>
                          <div style={{ fontSize: 11, fontWeight: 900, color: IDEA_VIOLET, letterSpacing: "0.06em", marginBottom: 5 }}>POURQUOI CETTE IDÉE TE CORRESPOND</div>
                          <p style={{ fontSize: 13, color: "#e8e8f0", fontFamily: "Arial, sans-serif", lineHeight: 1.6, marginBottom: 14 }}>{idea.whyYou}</p>
                          <div style={{ fontSize: 11, fontWeight: 900, color: IDEA_VIOLET, letterSpacing: "0.06em", marginBottom: 5 }}>POURQUOI C'EST INTÉRESSANT AUJOURD'HUI</div>
                          <p style={{ fontSize: 13, color: "#e8e8f0", fontFamily: "Arial, sans-serif", lineHeight: 1.6 }}>{idea.whyNow}</p>
                        </div>

                        {/* Accordéon */}
                        <button onClick={() => setExpandedCard(isExpanded ? null : i)} style={{ width: "100%", background: "transparent", border: "1px solid rgba(183,155,255,0.2)", borderRadius: 10, padding: "11px", color: IDEA_VIOLET, fontSize: 12, fontWeight: 900, letterSpacing: "0.06em", cursor: "pointer", marginBottom: isExpanded ? 16 : 14 }}>
                          {isExpanded ? "MOINS DE DÉTAILS ▲" : "EN SAVOIR PLUS ▼"}
                        </button>
                        {isExpanded && idea.details && (
                          <div style={{ background: IDEA_BG, borderRadius: 12, padding: "18px 18px", marginBottom: 14, animation: "slideDown 0.3s ease both" }}>
                            {[
                              { l: "L'opportunité", v: idea.details.opportunity },
                              { l: "Les risques", v: idea.details.risks },
                              { l: "Profil idéal", v: idea.details.idealProfile },
                              { l: "Prochaines étapes", v: idea.details.nextSteps },
                            ].map((d, di) => (
                              <div key={di} style={{ marginBottom: di < 3 ? 14 : 0 }}>
                                <div style={{ fontSize: 11, fontWeight: 900, color: IDEA_VIOLET, marginBottom: 4, letterSpacing: "0.04em" }}>{d.l}</div>
                                <p style={{ fontSize: 13, color: "#d8d8e2", fontFamily: "Arial, sans-serif", lineHeight: 1.6 }}>{d.v}</p>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* CTA */}
                        <button onClick={() => chooseIdea(idea)} style={{ width: "100%", background: isTop ? "linear-gradient(90deg,#8D6EFF,#B79BFF)" : "transparent", color: "#fff", border: isTop ? "none" : `1px solid ${IDEA_VIOLET}`, padding: "15px", fontSize: 13, fontWeight: 900, letterSpacing: "0.08em", borderRadius: 12, cursor: "pointer" }}>🚀 CONSTRUIRE CE PROJET</button>
                      </div>
                    );
                  })}
                </div>
                <button onClick={startIdeaQuiz} style={{ display: "block", margin: "28px auto 0", background: "transparent", border: "none", color: IDEA_TEXT2, fontSize: 12, fontWeight: 900, letterSpacing: "0.08em", cursor: "pointer" }}>↻ REFAIRE LE TEST</button>
              </>
            ) : null}
          </div>
        </div>
      )}

      {/* ── IDEA TRANSFER (transition vers Basic) ── */}
      {screen === "idea-transfer" && chosenIdea && (
        <div style={{ minHeight: "100vh", background: IDEA_BG, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", padding: isMobile ? "90px 24px" : "100px 60px", textAlign: "center" }}>
          <div style={{ maxWidth: 480, width: "100%" }}>
            <div style={{ fontSize: 12, fontWeight: 900, color: IDEA_VIOLET, letterSpacing: "0.12em", marginBottom: 14 }}>TU AS CHOISI</div>
            <h1 style={{ fontSize: isMobile ? 26 : 32, fontWeight: 900, color: "#fff", lineHeight: 1.15, marginBottom: 36 }}>{chosenIdea.name}</h1>
            <div style={{ display: "flex", flexDirection: "column", gap: 14, textAlign: "left", marginBottom: 40 }}>
              {TRANSFER_STEPS.map((step, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 14, opacity: i <= transferStep ? 1 : 0.3, transition: "opacity 0.4s" }}>
                  <div style={{ width: 24, height: 24, borderRadius: "50%", flexShrink: 0, background: i <= transferStep ? "linear-gradient(90deg,#8D6EFF,#B79BFF)" : "transparent", border: i <= transferStep ? "none" : "2px solid rgba(183,155,255,0.3)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, color: "#fff" }}>{i <= transferStep ? "✓" : ""}</div>
                  <span style={{ fontSize: isMobile ? 15 : 16, fontWeight: 700, color: i <= transferStep ? "#fff" : IDEA_TEXT2 }}>{step}</span>
                </div>
              ))}
            </div>
            <button
              onClick={launchBasicFromIdea}
              disabled={transferStep < TRANSFER_STEPS.length - 1}
              style={{ width: "100%", background: transferStep < TRANSFER_STEPS.length - 1 ? "rgba(183,155,255,0.2)" : "linear-gradient(90deg,#8D6EFF,#B79BFF)", color: "#fff", border: "none", padding: "16px", fontSize: 14, fontWeight: 900, letterSpacing: "0.08em", borderRadius: 14, cursor: transferStep < TRANSFER_STEPS.length - 1 ? "default" : "pointer", transition: "all 0.4s", boxShadow: transferStep < TRANSFER_STEPS.length - 1 ? "none" : "0 8px 30px rgba(141,110,255,0.4)" }}
            >
              🚀 GÉNÉRER MON BUSINESS PLAN COMPLET
            </button>
            <button onClick={() => setScreen("idea-results")} style={{ background: "transparent", border: "none", color: IDEA_TEXT2, fontSize: 12, fontWeight: 900, letterSpacing: "0.08em", marginTop: 20, cursor: "pointer" }}>← CHOISIR UNE AUTRE IDÉE</button>
          </div>
        </div>
      )}

      {/* ── QUIZ ── */}
      {screen === "quiz" && (
        <div style={{ minHeight: "100vh", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "fixed", inset: 0, background: "#0a0a0a" }} />
          <div style={{ position: "fixed", inset: 0, backgroundImage: `url(${IMAGES[1]})`, backgroundSize: "cover", backgroundPosition: "center", opacity: 0.08 }} />

          {blocTransition && (
            <div style={{ position: "fixed", inset: 0, zIndex: 200, background: "#000", display: "flex", alignItems: "center", justifyContent: "center", animation: "fadeIn 0.3s ease both" }}>
              <div style={{ textAlign: "center", animation: "scaleIn 0.5s ease both" }}>
                <div style={{ fontSize: 10, letterSpacing: "0.3em", color: isOrange ? "#ff7a2e" : "rgba(255,255,255,0.3)", marginBottom: 16, fontWeight: 900 }}>PARTIE SUIVANTE</div>
                <div style={{ fontSize: isMobile ? "clamp(40px,12vw,72px)" : "clamp(56px,8vw,96px)", fontWeight: 900, color: "#fff" }}>{showBloc}</div>
                <div style={{ width: 60, height: 4, background: isOrange ? "#ff7a2e" : "#fff", margin: "20px auto 0", borderRadius: 2 }} />
              </div>
            </div>
          )}

          <div style={{ position: "relative", minHeight: "100vh", display: "flex", flexDirection: "column", justifyContent: "center", padding: isMobile ? "90px 24px 60px" : "100px 60px 60px", maxWidth: 720, margin: "0 auto", animation: "slideUp 0.5s ease both" }}>

            {/* Bandeau profil importé depuis IDEA */}
            {fromIdea && (
              <div style={{ display: "flex", alignItems: "center", gap: 10, background: "rgba(141,110,255,0.12)", border: "1px solid rgba(183,155,255,0.3)", borderRadius: 12, padding: "12px 16px", marginBottom: 24 }}>
                <span style={{ fontSize: 18 }}>✦</span>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 900, color: "#b79bff", marginBottom: 2 }}>Profil entrepreneurial importé ✅</div>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.55)", fontFamily: "Arial, sans-serif" }}>On connaît déjà ton budget, ton objectif et ton idée. Plus que quelques questions.</div>
                </div>
              </div>
            )}

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

                  {result.scoreExplication && (
                    <div style={{ maxWidth: 540, margin: "0 0 30px", padding: "14px 20px", borderLeft: `3px solid ${isOrange ? "#ff7a2e" : "rgba(255,255,255,0.25)"}` }}>
                      <p style={{ color: "rgba(255,255,255,0.65)", fontSize: 14, fontFamily: "Arial, sans-serif", lineHeight: 1.6 }}>{result.scoreExplication}</p>
                    </div>
                  )}

                  {result.scoreCriteres && result.scoreCriteres.length > 0 && (() => {
                    const CRIT_FR = { Experience: "Expérience", Marche: "Marché", Differenciation: "Différenciation", Budget: "Budget", Clarte: "Clarté", Timing: "Timing" };
                    const parsed = result.scoreCriteres.map(c => {
                      const m = c.match(/^(.+?):\s*(\d+)\/10/);
                      if (!m) return null;
                      return { label: CRIT_FR[m[1].trim()] || m[1].trim(), note: parseInt(m[2]) };
                    }).filter(Boolean);
                    return (
                      <>
                        <div style={{ fontSize: 12, fontWeight: 900, letterSpacing: "0.04em", color: "#fff", marginBottom: 14 }}>POTENTIEL DU PROJET</div>
                        <div style={{ maxWidth: 540, background: "rgba(0,0,0,0.4)", border: `1px solid ${isOrange ? "#ff7a2e" : "rgba(255,255,255,0.2)"}`, padding: isMobile ? "16px 18px" : "20px 24px", borderRadius: 10, marginBottom: 28 }}>
                          <div style={{ fontSize: 9, fontWeight: 900, letterSpacing: "0.14em", color: "rgba(255,255,255,0.5)", marginBottom: 14 }}>ANALYSE DE TON PROJET</div>
                          {parsed.map((c, i) => (
                            <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "7px 0" }}>
                              <span style={{ fontSize: 11, color: "rgba(255,255,255,0.75)", minWidth: 110, fontFamily: "Arial, sans-serif" }}>{c.label}</span>
                              <div style={{ flex: 1, height: 5, background: "rgba(255,255,255,0.14)", borderRadius: 3 }}>
                                <div style={{ height: "100%", width: `${c.note * 10}%`, background: c.note >= 7 ? "#4ade80" : c.note >= 5 ? "#facc15" : "#f87171", borderRadius: 3 }} />
                              </div>
                              <span style={{ fontSize: 11, fontWeight: 900, color: "#fff", minWidth: 32, textAlign: "right" }}>{c.note}/10</span>
                            </div>
                          ))}
                        </div>

                        {/* Ligne des 6 critères en cellules */}
                        <div style={{ display: "flex", justifyContent: "space-between", maxWidth: 600, marginBottom: 28, flexWrap: isMobile ? "wrap" : "nowrap", gap: isMobile ? 12 : 0 }}>
                          {parsed.map((c, i) => (
                            <div key={i} style={{ flex: isMobile ? "0 0 30%" : 1, textAlign: "center", padding: "0 4px", borderLeft: !isMobile && i > 0 ? "1px solid rgba(255,255,255,0.18)" : "none" }}>
                              <div style={{ fontSize: 8, fontWeight: 900, letterSpacing: "0.05em", color: "rgba(255,255,255,0.6)", textTransform: "uppercase" }}>{c.label}</div>
                              <div style={{ fontSize: 15, fontWeight: 900, color: isOrange ? "#ff7a2e" : "#fff", marginTop: 4 }}>{c.note}/10</div>
                            </div>
                          ))}
                        </div>
                      </>
                    );
                  })()}

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
