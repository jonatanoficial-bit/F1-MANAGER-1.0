// i18n.js — Etapa 12 (PT/EN/ES) | data-i18n attributes
const I18N_KEY = "f1m25_lang";
const SUPPORTED = ["pt","en","es"];

const dict = {
  pt: {
    app_name: "F1 Manager Simulator 1.0",
    app_sub: "Gold Vale Edition",
    start: "INICIAR",
    continue: "CONTINUAR",
    back: "Voltar",
    lobby: "Lobby",
    staff: "Staff",
    sponsors: "Patrocínios",
    market: "Mercado",
    offers: "Propostas",
    contracts: "Contratos",
    media: "Mídia",
    rnd: "P&D",
    choose_lang: "Idioma",
    career_mode: "Modo Carreira",
    realistic: "Simulação (Realista)",
    free: "Livre",
    open_market: "Mercado de Pilotos",
    open_staff: "Equipe / Staff",
    open_sponsors: "Patrocínios",
    open_offers: "Propostas",
    open_contracts: "Contratos",
    open_media: "Mídia & Reputação",
    update_market: "Atualizar mercado",
    clear: "Limpar",
    recalc: "Recalcular custos",
  },
  en: {
    app_name: "F1 Manager Simulator 1.0",
    app_sub: "Gold Vale Edition",
    start: "START",
    continue: "CONTINUE",
    back: "Back",
    lobby: "Lobby",
    staff: "Staff",
    sponsors: "Sponsors",
    market: "Market",
    offers: "Offers",
    contracts: "Contracts",
    media: "Media",
    rnd: "R&D",
    choose_lang: "Language",
    career_mode: "Career Mode",
    realistic: "Simulation (Realistic)",
    free: "Free Play",
    open_market: "Driver Market",
    open_staff: "Team / Staff",
    open_sponsors: "Sponsors",
    open_offers: "Offers",
    open_contracts: "Contracts",
    open_media: "Media & Reputation",
    update_market: "Refresh market",
    clear: "Clear",
    recalc: "Recalculate costs",
  },
  es: {
    app_name: "F1 Manager Simulator 1.0",
    app_sub: "Gold Vale Edition",
    start: "INICIAR",
    continue: "CONTINUAR",
    back: "Volver",
    lobby: "Lobby",
    staff: "Personal",
    sponsors: "Patrocinios",
    market: "Mercado",
    offers: "Ofertas",
    contracts: "Contratos",
    media: "Prensa",
    rnd: "I+D",
    choose_lang: "Idioma",
    career_mode: "Modo Carrera",
    realistic: "Simulación (Realista)",
    free: "Libre",
    open_market: "Mercado de Pilotos",
    open_staff: "Equipo / Personal",
    open_sponsors: "Patrocinios",
    open_offers: "Ofertas",
    open_contracts: "Contratos",
    open_media: "Prensa y Reputación",
    update_market: "Actualizar mercado",
    clear: "Limpiar",
    recalc: "Recalcular costos",
  }
};

function getLang(){
  let lang = null;
  try{ lang = localStorage.getItem(I18N_KEY); }catch(e){}
  if(!lang){
    const nav = (navigator.language||"pt").toLowerCase();
    lang = nav.startsWith("es") ? "es" : (nav.startsWith("en") ? "en" : "pt");
  }
  if(!SUPPORTED.includes(lang)) lang = "pt";
  return lang;
}
function setLang(lang){
  if(!SUPPORTED.includes(lang)) lang = "pt";
  try{ localStorage.setItem(I18N_KEY, lang); }catch(e){}
  applyI18n(lang);
}
function t(key){
  const lang = getLang();
  return (dict[lang] && dict[lang][key]) || (dict.pt[key]||key);
}
function applyI18n(lang){
  lang = lang || getLang();
  const nodes = document.querySelectorAll("[data-i18n]");
  nodes.forEach(n=>{
    const key = n.getAttribute("data-i18n");
    const val = (dict[lang] && dict[lang][key]) || (dict.pt[key]||key);
    if(n.hasAttribute("data-i18n-attr")){
      const attr = n.getAttribute("data-i18n-attr");
      n.setAttribute(attr, val);
    }else{
      n.textContent = val;
    }
  });
  // select sync
  const sel = document.getElementById("langSelect");
  if(sel) sel.value = lang;
}
document.addEventListener("DOMContentLoaded", ()=> applyI18n(getLang()));

window.setLang = setLang;
window.getLang = getLang;
window.t = t;
