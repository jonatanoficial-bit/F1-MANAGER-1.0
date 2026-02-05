fetch("build/build.json")
  .then(r => r.json())
  .then(b => {
    const el = document.getElementById("buildInfo");
    if (!el) return;

    // Aceita "DD/MM/YYYY" (preferido) ou "YYYY-MM-DD"
    let updated = b.updated || "";
    if (typeof updated === "string" && updated.includes("-")) {
      const parts = updated.split("-");
      if (parts.length === 3) {
        const [yyyy, mm, dd] = parts;
        updated = `${dd}/${mm}/${yyyy}`;
      }
    }
    // Se já estiver em DD/MM/YYYY, mantém.
    el.innerText = `Build ${b.build || ""} • Atualizado em ${updated || "—"}`;
  })
  .catch(()=>{});
