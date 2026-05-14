# LoCal

> Hackathon submission — climate risk intelligence for cities, insurers, and residents, in one platform.

## Demo

<video src="asset/demo.mp4" controls width="100%"></video>

If the video does not play inline on your viewer, open [`asset/demo.mp4`](asset/demo.mp4) directly.

## Problem

Climate risk data exists, but it is fragmented. Cities, insurers, and residents all need to understand exposure — to flooding, heat, and infrastructure stress — at the **neighborhood level**, but today:

- Institutional tools are locked behind enterprise pricing and built for a single audience.
- Public datasets are raw, scattered, and unreadable to non-experts.
- A homeowner, a city planner, and an underwriter end up looking at three different — and incompatible — pictures of the same street.

## Solution

**LoCal** is a single platform with two synchronized dashboards over the same underlying risk model:

- **Business / municipal view** — aggregate neighborhood risk, insurance market signals, and an interactive **Boston heatmap** (Leaflet + OpenStreetMap). Hover a neighborhood to see flood-zone %, heat stress, infrastructure score, and properties at risk.
- **Consumer view** — the same intelligence framed for a single household, with personal exposure metrics and policy guidance.

Stack: Next.js 16 / React 19 frontend, FastAPI backend, Leaflet for the map. Demo auth gates both views.

## Impact

- **Cities & planners** — neighborhood-level exposure and a policy recommendation surface on one screen, instead of stitched-together GIS exports.
- **Residents** — the same view that an insurer or city uses, framed personally. Closes the asymmetry between who *has* climate intelligence and who *needs* it.
- **Insurers** — a shared visual language with the policyholders and municipalities they cover, reducing the explain-the-rate problem.

In short: one model, three audiences, one screen each — so the conversation about climate risk happens off the same map.

## Run it

See [`SYSTEM_DESIGN.md`](SYSTEM_DESIGN.md) for architecture and the local runbook (frontend on `:3000`, FastAPI on `:8000`).
