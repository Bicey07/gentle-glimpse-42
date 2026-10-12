/** Extract image drag payloads without inserting third-party HTML into the page. */
export function getDroppedImageUrl(data: Pick<DataTransfer, "getData">): string | null {
  const html = data.getData("text/html");
  const template = document.createElement("template");
  template.innerHTML = html;
  const image = template.content.querySelector("img");
  const candidates = [
    image?.getAttribute("src"),
    data.getData("text/uri-list").split(/\r?\n/).find(line => line.trim() && !line.startsWith("#")),
    data.getData("text/plain").trim(),
  ];
  for (const value of candidates) {
    if (!value) continue;
    try {
      const url = new URL(value);
      if ((url.protocol === "https:" || url.protocol === "http:") && !url.username && !url.password) return url.href;
    } catch { /* A relative URL or plain text is not a usable cross-site image. */ }
  }
  return null;
}
