
let currentLang = localStorage.getItem('lang') || 'pt';
async function loadLang(lang){
  const res = await fetch('i18n/' + lang + '.json');
  const data = await res.json();
  document.querySelectorAll('[data-i18n]').forEach(el=>{
    const key = el.getAttribute('data-i18n');
    if(data[key]) el.innerText = data[key];
  });
  localStorage.setItem('lang', lang);
}
document.addEventListener('DOMContentLoaded', ()=> loadLang(currentLang));
