import DOMPurify from 'isomorphic-dompurify';

/**
 * Konfiguracja DOMPurify - dozwolone tagi i atrybuty
 */
const ALLOWED_TAGS = [
  // Nagłówki
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  // Blokowe
  'p', 'div', 'section', 'article', 'header', 'footer', 'main', 'aside', 'nav',
  // Listy
  'ul', 'ol', 'li', 'dl', 'dt', 'dd',
  // Tabele
  'table', 'thead', 'tbody', 'tfoot', 'tr', 'th', 'td', 'caption', 'colgroup', 'col',
  // Inline
  'span', 'a', 'strong', 'b', 'em', 'i', 'u', 's', 'strike', 'del', 'ins',
  'sub', 'sup', 'small', 'mark', 'abbr', 'cite', 'q', 'code', 'pre', 'kbd', 'samp', 'var',
  // Multimedia (tylko bezpieczne)
  'img', 'figure', 'figcaption', 'picture', 'source',
  // Inne
  'br', 'hr', 'blockquote', 'address', 'time', 'details', 'summary',
];

const ALLOWED_ATTR = [
  // Globalne
  'class', 'id', 'title', 'lang', 'dir',
  // Linki
  'href', 'target', 'rel',
  // Obrazy
  'src', 'alt', 'width', 'height', 'loading', 'srcset', 'sizes',
  // Tabele
  'colspan', 'rowspan', 'scope', 'headers',
  // Multimedia
  'type', 'media',
  // Dane
  'datetime', 'data-*',
];

/**
 * Sanityzuje HTML, usuwając potencjalnie niebezpieczne elementy
 * @param dirty - Niebezpieczny HTML do oczyszczenia
 * @returns Oczyszczony HTML
 */
export function sanitizeHtml(dirty: string): string {
  if (!dirty) return '';

  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    ALLOW_DATA_ATTR: true,
    // Usuń skrypty, style inline i niebezpieczne atrybuty
    FORBID_TAGS: ['script', 'style', 'iframe', 'object', 'embed', 'form', 'input', 'button', 'textarea', 'select'],
    FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'onfocus', 'onblur', 'onsubmit', 'onchange', 'style'],
    // Dodaj rel="noopener noreferrer" do linków z target="_blank"
    ADD_ATTR: ['target'],
  });
}

/**
 * Tworzy bezpieczny obiekt dla dangerouslySetInnerHTML
 * @param dirty - Niebezpieczny HTML do oczyszczenia
 * @returns Obiekt { __html: string } do użycia z dangerouslySetInnerHTML
 */
export function createSafeHtml(dirty: string): { __html: string } {
  return { __html: sanitizeHtml(dirty) };
}

/**
 * Sanityzuje HTML usuwając wszystkie tagi (tylko tekst)
 * @param dirty - HTML do oczyszczenia
 * @returns Czysty tekst bez tagów HTML
 */
export function stripHtml(dirty: string): string {
  if (!dirty) return '';

  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
  });
}
