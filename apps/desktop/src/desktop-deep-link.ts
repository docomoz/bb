const UNSAFE_URL_CHARACTER = /[\p{Cc}\s\\]/u;
const DEEP_LINK = /^bb:\/\/\/?([^#?]+)(#.*)?$/iu;
const PATH_SEGMENT = /^[A-Za-z0-9_-]+$/u;

export interface DesktopDeepLink {
  path: string;
  hash: string;
}

export function parseDesktopDeepLink(url: string): DesktopDeepLink | null {
  if (UNSAFE_URL_CHARACTER.test(url)) return null;
  const [, rawPath, hash] = DEEP_LINK.exec(url) ?? [];
  if (!rawPath) return null;

  const segments = rawPath.replace(/\/$/u, "").split("/");
  if (!segments.every((part) => PATH_SEGMENT.test(part))) return null;

  const [section, ...rest] = segments;
  let root: string;
  switch (section) {
    case "thread":
    case "threads":
      if (rest.length !== 1) return null;
      root = "threads";
      break;
    case "project":
    case "projects":
      if (rest.length !== 1 && (rest.length !== 3 || rest[1] !== "threads")) {
        return null;
      }
      root = "projects";
      break;
    case "plugins":
      if (rest.length < 2) return null;
      root = "plugins";
      break;
    default:
      return null;
  }
  return { path: `/${[root, ...rest].join("/")}`, hash: hash ?? "" };
}

export function resolveDesktopDeepLink(
  serverUrl: string,
  link: DesktopDeepLink,
): string | null {
  let destination: URL;
  try {
    destination = new URL(serverUrl);
  } catch {
    return null;
  }
  if (
    (destination.protocol !== "http:" && destination.protocol !== "https:") ||
    destination.username ||
    destination.password
  ) {
    return null;
  }
  destination.pathname = destination.pathname.replace(/\/+$/u, "") + link.path;
  destination.hash = link.hash;
  return destination.href;
}
