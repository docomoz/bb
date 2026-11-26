import {
  parseDesktopDeepLink,
  resolveDesktopDeepLink,
  type DesktopDeepLink,
} from "./desktop-deep-link.js";

export function createDesktopDeepLinkController(
  openUrl: (url: string) => Promise<void>,
  reportFailure: () => void,
) {
  let serverUrl: string | null = null;
  let pendingLink: DesktopDeepLink | null = null;

  function openPendingLink(): void {
    if (serverUrl === null || pendingLink === null) return;
    const url = resolveDesktopDeepLink(serverUrl, pendingLink);
    pendingLink = null;
    if (url !== null) void openUrl(url).catch(() => reportFailure());
  }

  return {
    receive(url: string): void {
      const link = parseDesktopDeepLink(url);
      if (link === null) return;
      pendingLink = link;
      openPendingLink();
    },
    setServerUrl(url: string | null): void {
      serverUrl = url;
      openPendingLink();
    },
  };
}
