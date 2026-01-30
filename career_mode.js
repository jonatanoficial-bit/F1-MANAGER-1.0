// career_mode.js — Etapa 3
// Define o modo de carreira e inicia o fluxo de criação de manager.

const MODE_KEY = "f1m25_career_mode";
const SAVE_KEY = "F1M25_SAVE_V1";

function start(mode){
  try{
    // Iniciar "novo jogo" = resetar save principal e seleção anterior
    localStorage.setItem(MODE_KEY, mode);
    localStorage.removeItem(SAVE_KEY);
    localStorage.removeItem("f1m2025_user_manager");
    localStorage.removeItem("f1m2025_user_team");
  }catch(e){
    console.warn("Falha ao setar modo:", e);
  }
  window.location.href = "manager_select.html";
}

document.getElementById("btnRealista")?.addEventListener("click", ()=> start("realistic"));
document.getElementById("btnLivre")?.addEventListener("click", ()=> start("free"));
