/* ===========================
   resultsSystem.js (FULL)
   - Overlay de resultados ao final
   - Faces no pódio
   =========================== */

(function () {
  "use strict";

  const ResultsSystem = {
    show(state) {
      // Etapa 5: registra pontos do time do jogador para a carreira
      try{
        const pointsTable = [25,18,15,12,10,8,6,4,2,1];
        const userTeam = (state.userTeam || '').toString().toUpperCase();
        const player = Array.isArray(state.playerDrivers) ? state.playerDrivers : (state.drivers||[]).filter(d=> d.team === userTeam);
        let teamPts = 0;
        (player||[]).forEach(pd=>{
          const pos = (pd.pos||999);
          if(pos>=1 && pos<=10) teamPts += pointsTable[pos-1];
        });
        localStorage.setItem('f1m25_last_race_points', String(teamPts));
        localStorage.setItem('f1m25_driver_morale_postrace', String(teamPts));
        // salva também log de eventos da corrida para relatório/UX
        if(Array.isArray(state.events)){
          localStorage.setItem('f1m25_last_race_events', JSON.stringify(state.events.slice(-30)));
        }
      }catch(e){}

      const overlay = document.getElementById("results-overlay");
      if (!overlay) return;

      overlay.classList.remove("hidden");
      overlay.innerHTML = "";

      const card = document.createElement("div");
      card.className = "results-card";

      const head = document.createElement("header");
      const h3 = document.createElement("h3");
      h3.textContent = "Resultados da Corrida";
      const close = document.createElement("button");
      close.className = "btn";
      close.textContent = "FECHAR";
      close.onclick = () => overlay.classList.add("hidden");

      head.appendChild(h3);
      head.appendChild(close);

      const body = document.createElement("div");
      body.className = "results-body";

      const top = state.drivers.slice(0, 10);
      top.forEach((d) => {
        const row = document.createElement("div");
        row.className = "results-row";

        const left = document.createElement("div");
        left.className = "results-left";

        const face = document.createElement("img");
        face.className = "results-face";
        face.src = `assets/faces/${d.code}.png`;
        face.alt = d.code;
        face.onerror = () => {
          face.onerror = null;
          face.style.display = "none";
        };

        const pos = document.createElement("div");
        pos.className = "pos-badge";
        pos.style.width = "34px";
        pos.style.height = "34px";
        pos.textContent = d.pos;

        const name = document.createElement("div");
        name.className = "results-name";
        name.innerHTML = `<div class="n">${d.name}</div><div class="t">${d.team} · Voltas: ${d.lap}</div>`;

        left.appendChild(pos);
        left.appendChild(face);
        left.appendChild(name);

        const right = document.createElement("div");
        right.style.fontWeight = "950";
        right.style.color = "rgba(255,255,255,.88)";
        right.textContent = d.pos === 1 ? "VENCEDOR" : `+${(d.gap || 0).toFixed(3)}`;

        row.appendChild(left);
        row.appendChild(right);
        body.appendChild(row);
      });


      // Etapa 5: seção de eventos
      if(Array.isArray(state.events) && state.events.length){
        const evTitle = document.createElement("div");
        evTitle.style.margin = "12px 0 6px";
        evTitle.style.fontWeight = "900";
        evTitle.style.opacity = ".9";
        evTitle.textContent = "EVENTOS DA CORRIDA";
        body.appendChild(evTitle);

        const evBox = document.createElement("div");
        evBox.style.border = "1px solid rgba(255,255,255,.10)";
        evBox.style.borderRadius = "14px";
        evBox.style.background = "rgba(0,0,0,.28)";
        evBox.style.padding = "10px";
        evBox.style.display = "grid";
        evBox.style.gap = "6px";

        state.events.slice(-8).forEach(e=>{
          const line = document.createElement("div");
          line.style.fontSize = "12px";
          line.style.opacity = ".9";
          line.textContent = `Volta ${e.lap}: ${e.text}`;
          evBox.appendChild(line);
        });

        body.appendChild(evBox);
      }

      const footer = document.createElement("footer");
      const back = document.createElement("button");
      back.className = "btn primary";
      back.textContent = "VOLTAR AO LOBBY";
      back.onclick = () => (location.href = "lobby.html");

      footer.appendChild(back);

      card.appendChild(head);
      card.appendChild(body);
      card.appendChild(footer);

      overlay.appendChild(card);
    },
  };

  window.ResultsSystem = ResultsSystem;
})();
