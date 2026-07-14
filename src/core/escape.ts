const XML_ENTITIES: Readonly<Record<string, string>> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&apos;",
};

export function escapeXml(value: string): string {
  return value.replace(
    /[&<>"']/g,
    (character) => XML_ENTITIES[character] ?? character,
  );
}

export function escapeMarkdownCell(value: string): string {
  return escapeMarkdownText(value)
    .replaceAll("|", "\\|")
    .replace(/[\r\n]+/g, " ");
}

export function escapeMarkdownText(value: string): string {
  return value.replaceAll("\\", "\\\\").replace(/([`*_{}\[\]<>#+.!])/g, "\\$1");
}

export function escapeMarkdownLabel(value: string): string {
  return value.replace(/[\[\]\\]/g, (character) => `\\${character}`);
}

export function badgeComponent(value: string): string {
  return encodeURIComponent(value.replaceAll("-", "--").replaceAll("_", "__"));
}
