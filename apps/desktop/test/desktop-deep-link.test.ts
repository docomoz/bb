import { describe, expect, it } from "vitest";
import {
  parseDesktopDeepLink,
  resolveDesktopDeepLink,
} from "../src/desktop-deep-link.js";

describe("parseDesktopDeepLink", () => {
  it.each([
    ["bb://threads/thr_1", "/threads/thr_1"],
    ["BB:///thread/thr_1/", "/threads/thr_1"],
    ["bb://projects/proj_1", "/projects/proj_1"],
    ["bb://project/proj_1/threads/thr_1", "/projects/proj_1/threads/thr_1"],
    [
      "bb://plugins/thread-relay/join/extra",
      "/plugins/thread-relay/join/extra",
    ],
  ])("normalizes %s to %s", (url, path) => {
    expect(parseDesktopDeepLink(url)).toEqual({ path, hash: "" });
  });

  it.each([
    "https://bb.example/threads/thr_1",
    "bb://",
    "bb://threads",
    "bb://threads/thr_1/extra",
    "bb:////threads/thr_1",
    "bb://plugins/thread-relay",
    "bb://plugins/thread-relay//join",
    "bb://settings/servers",
    "bb://api/v1/threads",
    "bb://plugins/thread-relay/../join",
    "bb://plugins/thread-relay/%2e%2e/join",
    "bb://plugins/thread-relay/%252e%252e/join",
    "bb://plugins/thread-relay/join%2Fextra",
    "bb://plugins/thread-relay/join%5Cextra",
    "bb://plugins/thread-relay/join\\extra",
    "bb://plugins/thread-relay/join?invite=secret",
    "bb://plugins/thread-relay/join?invite=secret#other",
    "bb://plugins@other.example/thread-relay/join",
    "bb://plugins:8080/thread-relay/join",
    "bb://threads/thr_1\n#token",
  ])("rejects %s", (url) => {
    expect(parseDesktopDeepLink(url)).toBeNull();
  });
});

describe("resolveDesktopDeepLink", () => {
  it("keeps the invitation in the fragment on the selected server", () => {
    const invite = "https://sharing.example/i/fixture#v=3&s=key-without-log";
    const hash = `#invite=${encodeURIComponent(invite)}`;
    const link = parseDesktopDeepLink(`bb://plugins/thread-relay/join${hash}`);
    expect(link).toEqual({ path: "/plugins/thread-relay/join", hash });
    if (link === null) throw new Error("Expected a valid app link");

    const target = resolveDesktopDeepLink("https://my-bb.example/bb/", link);
    expect(target).toBe(
      `https://my-bb.example/bb/plugins/thread-relay/join${hash}`,
    );
  });

  it("uses the selected local server and its port", () => {
    expect(
      resolveDesktopDeepLink("http://127.0.0.1:38886/", {
        path: "/threads/thr_1",
        hash: "",
      }),
    ).toBe("http://127.0.0.1:38886/threads/thr_1");
  });

  it("keeps a configured server query and replaces its fragment", () => {
    expect(
      resolveDesktopDeepLink("https://my-bb.example/bb?view=full#previous", {
        path: "/threads/thr_1",
        hash: "#message",
      }),
    ).toBe("https://my-bb.example/bb/threads/thr_1?view=full#message");
  });

  it.each([
    "not a URL",
    "about:blank",
    "file:///tmp/bb.html",
    "https://user:secret@bb.example/",
  ])("rejects server URL %s", (serverUrl) => {
    expect(
      resolveDesktopDeepLink(serverUrl, { path: "/threads/thr_1", hash: "" }),
    ).toBeNull();
  });
});
