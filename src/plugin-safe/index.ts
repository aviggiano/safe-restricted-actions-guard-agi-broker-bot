import { swap } from "./actions/swap.ts";
import { Plugin } from "@elizaos/core";

export const pluginSafe: Plugin = {
  name: "plugin-safe",
  description: "Safe Plugin for Eliza",
  actions: [swap],
  evaluators: [],
  providers: [],
};

export default pluginSafe;
