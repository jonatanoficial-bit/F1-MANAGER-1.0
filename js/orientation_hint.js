// js/orientation_hint.js (v0.5.1)
(function(){
  const KEY = "f1m25_hide_landscape_hint";
  const isMobile = ()=> window.matchMedia("(max-width: 900px)").matches;
  const isPortrait = ()=> window.matchMedia("(orientation: portrait)").matches;

  function create(){
    if(document.getElementById("landscapeHint")) return;
    const wrap = document.createElement("div");
    wrap.id="landscapeHint";
    Object.assign(wrap.style, {
      position:"fixed", inset:"0", zIndex:"10000",
      display:"flex", alignItems:"center", justifyContent:"center",
      padding:"18px", background:"rgba(0,0,0,.72)", backdropFilter:"blur(8px)"
    });
    const card=document.createElement("div");
    Object.assign(card.style, {
      width:"min(520px, 100%)",
      border:"1px solid rgba(255,255,255,.14)",
      borderRadius:"18px",
      background:"rgba(0,0,0,.55)",
      boxShadow:"0 18px 60px rgba(0,0,0,.55)",
      padding:"16px"
    });
    card.innerHTML = `
      <div style="font-weight:900;font-size:18px;letter-spacing:.02em;">Melhor experiência em modo paisagem</div>
      <div style="opacity:.85;margin-top:6px;line-height:1.25;">
        Para ver os cards completos e ter a mesma experiência do PC, gire o celular para <b>deitado</b>.
      </div>
      <div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:14px;">
        <button id="btnOkLandscape" class="btn btn--primary" style="flex:1;min-width:180px;">Ok, vou girar</button>
        <button id="btnContinuePortrait" class="btn" style="flex:1;min-width:180px;">Continuar assim</button>
      </div>
      <div style="opacity:.7;font-size:12px;margin-top:10px;">
        Dica: você pode ocultar este aviso escolhendo “Continuar assim”.
      </div>
    `;
    wrap.appendChild(card);
    document.body.appendChild(wrap);
    document.getElementById("btnOkLandscape")?.addEventListener("click", ()=> wrap.remove());
    document.getElementById("btnContinuePortrait")?.addEventListener("click", ()=>{
      try{ localStorage.setItem(KEY,"1"); }catch(e){}
      wrap.remove();
    });
  }

  function maybe(){
    let hide=false;
    try{ hide = localStorage.getItem(KEY)==="1"; }catch(e){}
    if(hide) return;
    if(isMobile() && isPortrait()) create();
    else document.getElementById("landscapeHint")?.remove();
  }
  window.addEventListener("resize", maybe);
  window.addEventListener("orientationchange", maybe);
  document.addEventListener("DOMContentLoaded", maybe);
})();