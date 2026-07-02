export function stripTrailingCommas(content: string): string {
  let result = "";
  let i = 0;
  let inString = false;
  let stringChar = "";

  while (i < content.length) {
    const char = content[i];

    if (char === '"' || char === "'") {
      let backslashCount = 0;
      let j = i - 1;
      while (j >= 0 && content[j] === "\\") { backslashCount++; j--; }

      if (backslashCount % 2 === 0) {
        if (!inString) { inString = true; stringChar = char; }
        else if (char === stringChar) { inString = false; }
        result += char;
        i++;
        continue;
      }
    }

    if (!inString && char === ",") {
      let j = i + 1;
      while (j < content.length && /\s/.test(content[j])) { j++; }
      if (j < content.length && (content[j] === "]" || content[j] === "}")) {
        i++;
        continue;
      }
    }

    result += char;
    i++;
  }

  return result;
}

export function parseJsonOrJsonc(content: string): unknown {
  return JSON.parse(stripTrailingCommas(content));
}

export function stringifyWithComments(data: unknown): string {
  return JSON.stringify(data, null, 2);
}
