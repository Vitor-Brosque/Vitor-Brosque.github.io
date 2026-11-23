const ESCAPES: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

export function escaparHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ESCAPES[c]);
}

// Só https://. O texto já passou pelo escape, então aspas e < > na URL viram entidades e não quebram o atributo.
// Asterisco e crase ficam de fora da URL para a formatação seguinte não mexer dentro do href.
const LINK = /\[([^\]]+)\]\((https:\/\/[^\s)*`]+)\)/g;

/** Escapa o texto e aceita só `código`, **negrito** e [links](https://…). O resultado é seguro para set:html. */
export function textoRico(s: string): string {
  return escaparHtml(s)
    .replace(LINK, '<a href="$2" rel="noopener">$1</a>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
}

export function paragrafos(s: string): string[] {
  return s
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
}
