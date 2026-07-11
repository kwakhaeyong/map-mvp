import type { DiscoveryContext, DiscoverySignal } from "./types";

export interface ConnectionDiscovery {
  id: string;
  from: "signal" | "preference" | "topic";
  to: "signal" | "value" | "emphasis" | "hidden-desire" | "reflection";
  sentence: string;
  groundedIn: string[];
}

export interface ConnectionDetectionInput {
  context: DiscoveryContext;
  signals: DiscoverySignal[];
}

export interface ConnectionDetector {
  /** Connects normalized signals into reflection candidates. It never consumes raw memories directly. */
  detectConnections(input: ConnectionDetectionInput): ConnectionDiscovery[];
}
