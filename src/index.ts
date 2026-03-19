/**
 * FlowHook API entry point.
 */
import express from "express";
import { config } from "./config.js";

const app = express();
app.use(express.json());

app.get("/", (_req, res) => {
  res.json({ ok: true, service: "flowhook" });
});

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.listen(config.port, () => {
  console.log(`FlowHook listening on port ${config.port}`);
});
