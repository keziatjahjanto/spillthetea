// Turns http(s):// and www. URLs in plain text into clickable links.
// Everything else stays as text, so React still escapes it.
const URL_RE = /(https?:\/\/[^\s<]+|www\.[^\s<]+)/gi;
// Punctuation that usually ends a sentence rather than the URL.
const TRAILING = ".,!?;:'\")]";

// Peel sentence punctuation off the end, but keep a ")" that closes a "("
// inside the URL, e.g. https://en.wikipedia.org/wiki/Tea_(drink).
function splitTrailing(raw: string): [string, string] {
  let url = raw;
  while (url && TRAILING.includes(url.at(-1)!)) {
    if (url.at(-1) === ")") {
      const opens = url.split("(").length - 1;
      const closes = url.split(")").length - 1;
      if (opens >= closes) break;
    }
    url = url.slice(0, -1);
  }
  return [url, raw.slice(url.length)];
}

export default function LinkifiedText({ text }: { text: string }) {
  const parts = text.split(URL_RE);

  return parts.map((part, i) => {
    // split() with a capture group puts the matches at odd indexes.
    if (i % 2 === 0) return part;

    const [url, trailing] = splitTrailing(part);
    const href = url.startsWith("www.") ? `https://${url}` : url;

    return (
      <span key={i}>
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer nofollow"
          className="relative z-10 text-sky-600 hover:underline dark:text-sky-400"
        >
          {url}
        </a>
        {trailing}
      </span>
    );
  });
}
