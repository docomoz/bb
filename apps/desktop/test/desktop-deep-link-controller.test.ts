import { describe, expect, it, vi } from "vitest";
import { createDesktopDeepLinkController } from "../src/desktop-deep-link-controller.js";

const sharedThreadRoute = "/plugins/thread-relay/join#invite=placeholder";

describe("desktop deep links", () => {
  it("opens a cold-start invitation after the selected server is ready", () => {
    const openUrl = vi.fn(async (_url: string) => {});
    const links = createDesktopDeepLinkController(openUrl, vi.fn());

    links.receive(`bb:/${sharedThreadRoute}`);
    expect(openUrl).not.toHaveBeenCalled();

    links.setServerUrl("https://bb.example/prefix/");
    expect(openUrl).toHaveBeenCalledExactlyOnceWith(
      `https://bb.example/prefix${sharedThreadRoute}`,
    );
  });

  it("opens on the ready server and queues during a server switch", () => {
    const openUrl = vi.fn(async (_url: string) => {});
    const links = createDesktopDeepLinkController(openUrl, vi.fn());
    links.setServerUrl("http://localhost:38886");

    links.receive("bb://thread/thr_example");
    links.setServerUrl(null);
    links.receive("bb://project/proj_example");
    expect(openUrl.mock.calls).toEqual([
      ["http://localhost:38886/threads/thr_example"],
    ]);

    links.setServerUrl("https://bb.example");
    expect(openUrl).toHaveBeenLastCalledWith(
      "https://bb.example/projects/proj_example",
    );
  });

  it("reports a failure without passing along the link or load error", async () => {
    const openUrl = vi.fn(async (_url: string) => {
      throw new Error(`Failed to load ${sharedThreadRoute}`);
    });
    const reportFailure = vi.fn();
    const links = createDesktopDeepLinkController(openUrl, reportFailure);
    links.setServerUrl("https://bb.example");
    links.receive(`bb:/${sharedThreadRoute}`);

    await vi.waitFor(() =>
      expect(reportFailure).toHaveBeenCalledExactlyOnceWith(),
    );
  });
});
