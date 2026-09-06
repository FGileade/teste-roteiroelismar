const localStorageKey = 'versiculo-do-dia-fechado';
const hojeStr = new Date().toDateString();

// Verificar se já fechou hoje
if (localStorage.getItem(localStorageKey) !== hojeStr) {
  fetch("./versiculos.json")
    .then(r => r.json())
    .then(versiculos => {
      const hoje = new Date();
      const indice = (
        hoje.getFullYear() * 1000 +
        hoje.getMonth() * 100 +
        hoje.getDate()
      ) % versiculos.length;

      const versiculo = versiculos[indice];

      const banner = document.getElementById("versiculo-banner");
      const textoEl = document.getElementById("versiculo-texto");
      const refEl = document.getElementById("versiculo-ref");
      const botaoFechar = document.getElementById("fechar-versiculo");

      if (banner && textoEl && refEl && botaoFechar) {
        textoEl.textContent = `“${versiculo.texto}”`;
        refEl.textContent = versiculo.ref;
        banner.style.display = "block";

        const fecharBanner = () => {
          banner.style.display = "none";
          localStorage.setItem(localStorageKey, hojeStr);
        };

        // Fechamento manual
        botaoFechar.addEventListener("click", fecharBanner);

        // Fechamento automático após 20 segundos
        setTimeout(() => {
          if (banner.style.display !== "none") {
            fecharBanner();
          }
        }, 20000);
      }
    })
    .catch(err => console.error("Erro ao carregar versículo:", err));
}