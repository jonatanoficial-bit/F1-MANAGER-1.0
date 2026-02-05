// js/funcionarios_page.js — conecta funcionarios.html ao economySystem (fix definitivo)
(function(){
  "use strict";
  function el(tag, cls){ const n=document.createElement(tag); if(cls) n.className=cls; return n; }
  function $(id){ return document.getElementById(id); }

  function fmtMoney(v){
    try{ return "$" + Math.round(v).toLocaleString("en-US"); }catch(e){ return "$"+v; }
  }

  const AREAS = [
    { key:"pit",        title:"Pit Crew",     impact:"Pit stop e consistência" },
    { key:"aero",       title:"Aero",         impact:"Downforce e eficiência" },
    { key:"strategy",   title:"Estratégia",   impact:"Pneus/combustível/decisão" },
    { key:"marketing",  title:"Marketing",    impact:"Patrocínios e valor das ofertas" },
  ];

  function render(){
    if(!window.F1MEconomy){ console.error("F1MEconomy não carregou."); return; }
    const st = window.F1MEconomy.load ? window.F1MEconomy.load() : window.F1MEconomy.getState?.();
    if(!st){ console.error("Estado não encontrado."); return; }

    // fallback: garantir estrutura
    st.staff = st.staff || {};
    AREAS.forEach(a=>{ st.staff[a.key] = st.staff[a.key] || { level: 50 }; });
    if(window.F1MEconomy.save) window.F1MEconomy.save(st);

    const ativo = $("staffAtivo");
    const ofertas = $("staffOfertas");
    if(!ativo || !ofertas) return;

    ativo.innerHTML="";
    ofertas.innerHTML="";

    // Header mini (money + modifiers)
    const mods = window.F1MEconomy.getModifiers ? window.F1MEconomy.getModifiers(st) : {};
    const kpis = el("div"); 
    kpis.style.display="grid";
    kpis.style.gridTemplateColumns="repeat(auto-fit,minmax(160px,1fr))";
    kpis.style.gap="10px";
    kpis.style.marginBottom="12px";
    kpis.innerHTML = `
      <div class="kpi"><div class="kpi__label">Caixa</div><div class="kpi__value">${fmtMoney(st.money ?? st.finance?.money ?? 0)}</div></div>
      <div class="kpi"><div class="kpi__label">Pit</div><div class="kpi__value">${Math.round((mods.pit||1)*100)}%</div></div>
      <div class="kpi"><div class="kpi__label">Ritmo</div><div class="kpi__value">${Math.round((mods.speed||1)*100)}%</div></div>
      <div class="kpi"><div class="kpi__label">Desgaste</div><div class="kpi__value">${Math.round((mods.wear||1)*100)}%</div></div>
    `;
    ativo.appendChild(kpis);

    // Active staff cards
    AREAS.forEach(a=>{
      const lvl = st.staff[a.key].level;
      const card = el("div","staff-card");
      card.innerHTML = `
        <div class="staff-card__top">
          <div class="staff-card__title">${a.title}</div>
          <div class="staff-card__sub">${a.impact}</div>
        </div>
        <div class="staff-card__bar">
          <div class="bar"><div class="bar__fill" style="width:${Math.round(lvl)}%"></div></div>
          <div class="bar__meta">${Math.round(lvl)} / 100</div>
        </div>
        <div class="staff-card__actions">
          <button class="btn-mini btn-mini--ghost" data-action="down" data-area="${a.key}">Demitir / Reduzir</button>
          <button class="btn-mini" data-action="up" data-area="${a.key}">Contratar / Melhorar</button>
        </div>
      `;
      ativo.appendChild(card);
    });

    // Offers: simple list for upgrades with costs
    const list = el("div");
    list.className="staff-offers";
    list.style.display="grid";
    list.style.gap="10px";

    AREAS.forEach(a=>{
      const lvl = st.staff[a.key].level;
      const cost = Math.round(250000 + (lvl*lvl)*120);      // escalonado
      const refund = Math.round(cost*0.45);
      const row = el("div","offer");
      row.style.border="1px solid rgba(255,255,255,.10)";
      row.style.borderRadius="14px";
      row.style.background="rgba(0,0,0,.20)";
      row.style.padding="12px";
      row.innerHTML = `
        <div style="display:flex;justify-content:space-between;gap:10px;align-items:flex-start;flex-wrap:wrap">
          <div>
            <div style="font-weight:900">${a.title}</div>
            <div style="opacity:.75;font-size:12px;margin-top:4px">Nível atual: <b>${Math.round(lvl)}</b></div>
            <div style="opacity:.70;font-size:12px;margin-top:2px">${a.impact}</div>
          </div>
          <div style="text-align:right;opacity:.85;font-size:12px">
            <div>Custo upgrade: <b>${fmtMoney(cost)}</b></div>
            <div>Reembolso downgrade: <b>${fmtMoney(refund)}</b></div>
          </div>
        </div>
        <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:10px">
          <button class="btn-mini" data-offer="up" data-area="${a.key}" data-cost="${cost}">Contratar (+)</button>
          <button class="btn-mini btn-mini--ghost" data-offer="down" data-area="${a.key}" data-refund="${refund}">Demitir (-)</button>
        </div>
      `;
      list.appendChild(row);
    });

    ofertas.appendChild(list);

    // Wire events
    ativo.querySelectorAll("button[data-action]").forEach(btn=>{
      btn.addEventListener("click", ()=>{
        const area = btn.getAttribute("data-area");
        const action = btn.getAttribute("data-action");
        const delta = action==="up" ? +5 : -5;
        window.F1MEconomy.adjustStaffLevel(area, delta);
        render();
      });
    });

    ofertas.querySelectorAll("button[data-offer]").forEach(btn=>{
      btn.addEventListener("click", ()=>{
        const area = btn.getAttribute("data-area");
        const offer = btn.getAttribute("data-offer");
        const st2 = window.F1MEconomy.load();
        const money = st2.money ?? st2.finance?.money ?? 0;

        if(offer==="up"){
          const cost = parseInt(btn.getAttribute("data-cost"),10);
          if(money < cost){
            alert("Caixa insuficiente para contratar.");
            return;
          }
          // pay then upgrade
          st2.money = money - cost;
          window.F1MEconomy.save(st2);
          window.F1MEconomy.adjustStaffLevel(area, +5);
          alert("Contratação realizada (+5).");
        }else{
          const refund = parseInt(btn.getAttribute("data-refund"),10);
          st2.money = money + refund;
          window.F1MEconomy.save(st2);
          window.F1MEconomy.adjustStaffLevel(area, -5);
          alert("Redução realizada (-5).");
        }
        render();
      });
    });
  }

  document.addEventListener("DOMContentLoaded", render);
})();