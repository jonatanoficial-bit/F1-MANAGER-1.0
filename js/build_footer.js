
// js/build_footer.js
(function(){
  async function getMeta(){
    try{
      const res = await fetch('build/build.json', { cache: 'no-store' });
      return await res.json();
    }catch(e){
      return { game:'F1 Manager Simulator 1.0', edition:'Gold Vale Edition', build:'v0.0.0', updated:'' };
    }
  }

  function fmtDate(iso){
    try{
      if(!iso) return '';
      const [y,m,d] = iso.split('-');
      return `${d}/${m}/${y}`;
    }catch(e){ return iso || ''; }
  }

  function ensureFooter(meta){
    if(document.getElementById('buildFooter')) return;
    const footer = document.createElement('footer');
    footer.id = 'buildFooter';
    footer.className = 'build-footer';
    const dateTxt = meta.updated ? ` • Atualizado em ${fmtDate(meta.updated)}` : '';
    footer.innerHTML = `
      <div class="build-footer__inner">
        <div class="build-footer__title">${meta.game} <span class="build-footer__edition">— ${meta.edition}</span></div>
        <div class="build-footer__meta">Build <b>${meta.build}</b>${dateTxt}</div>
      </div>
    `;
    document.body.appendChild(footer);
  }

  document.addEventListener('DOMContentLoaded', async ()=>{
    const meta = await getMeta();
    ensureFooter(meta);
    // Atualiza title também
    if(meta?.game && meta?.build){
      if(!document.title.includes(meta.game)){
        document.title = `${meta.game} — ${meta.edition}`;
      }
    }
  });
})();
