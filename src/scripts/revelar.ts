import { aoCarregarPagina } from './ciclo';

/**
 * Revelação ao rolar, nos dois modos de movimento: o CSS decide se o bloco só aparece (fade)
 * ou também sobe. Irmãos entram em sequência pela variável `--ordem`.
 */
aoCarregarPagina(() => {
  const alvos = [...document.querySelectorAll<HTMLElement>('.revelar:not(.visivel)')];
  if (alvos.length === 0) return;
  const revelarTudo = () => alvos.forEach((a) => a.classList.add('visivel'));

  for (const a of alvos) {
    const irmaos = a.parentElement ? [...a.parentElement.children].filter((c) => c.classList.contains('revelar')) : [a];
    a.style.setProperty('--ordem', String(Math.min(irmaos.indexOf(a), 5)));
    // Depois de entrar, o atraso da sequência não pode valer para outras transições (hover, por exemplo).
    // (o elemento sai junto com a página, então o ouvinte não vaza entre navegações).
    a.addEventListener('transitionend', (ev) => {
      if (ev.target === a && ev.propertyName === 'opacity') a.style.removeProperty('--ordem');
    });
  }

  window.addEventListener('beforeprint', revelarTudo);
  const limparImpressao = () => window.removeEventListener('beforeprint', revelarTudo);

  if (!('IntersectionObserver' in window)) {
    revelarTudo();
    return limparImpressao;
  }

  // O que já ficou para trás (acima da janela) aparece direto, sem esperar o observador.
  for (const a of alvos) if (a.getBoundingClientRect().bottom < 0) a.classList.add('visivel');

  const obs = new IntersectionObserver(
    (entradas) => {
      for (const e of entradas) {
        if (!e.isIntersecting && e.boundingClientRect.top > 0) continue;
        // Um salto (link de âncora, rolagem rápida) pode pular blocos sem que o observador avise:
        // tudo o que vem antes, na ordem do documento, também aparece.
        const ate = alvos.indexOf(e.target as HTMLElement);
        for (let i = 0; i <= ate; i++) {
          alvos[i].classList.add('visivel');
          obs.unobserve(alvos[i]);
        }
      }
    },
    { rootMargin: '0px 0px -10% 0px', threshold: 0.12 },
  );
  alvos.filter((a) => !a.classList.contains('visivel')).forEach((a) => obs.observe(a));
  return () => {
    obs.disconnect();
    limparImpressao();
  };
});
