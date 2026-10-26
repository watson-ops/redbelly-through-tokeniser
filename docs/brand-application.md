# Brand Application

Three supplied kits shape the film. Each one governs a different layer.

| Kit | What it governs here |
|-----|----------------------|
| Redbelly Network brand kit and brand manual (https://redbelly.network/brand) | Typeface (Readex Pro), Redbelly colours, official Redbelly logo files and logo rules |
| Tokeniser website (https://tokeniser.com) | Overall look: light surfaces, deep slate, mint accent, Montserrat style geometric sans feel, calm corporate tone |
| Redbelly DAO Task Board brand kit (https://taskboard.redbellydao.network/brand) | Copy voice rules, monospace for machine values, status as dot plus label, radius and spacing scale, contrast checks |

The Task Board kit states it does not govern material that goes out under another brand name. This film goes out as Tokeniser and Redbelly marketing, so the Tokeniser look leads on screen and the Redbelly kit supplies type, colour and logos. The DAO kit's voice and craft rules apply throughout, to the film and to every document in this repository.

## Colour

Tokens live in [`brand/tokens.css`](../brand/tokens.css).

### Tokeniser (read from the live site's computed styles)

| Token | Hex | Use in the film |
|-------|-----|-----------------|
| `--tk-ink` | `#343740` | Primary text, active step, end card background |
| `--tk-ink-2` | `#4B4F5D` | Secondary text, icons |
| `--tk-muted` | `#5E6270` | Labels and captions on light |
| `--tk-mist` | `#F2F2F2` | Page ground |
| `--tk-paper` | `#FFFFFF` | Cards |
| `--tk-mint` | `#A2FFC8` | Verified, settled and active states, tokens, end card wordmark |
| `--tk-teal` | `#009C9C` | Small accent text and status dots on light, where mint lacks contrast |

### Redbelly Network (brand manual)

| Token | Hex | Use in the film |
|-------|-----|-----------------|
| `--rb-red` | `#FF5050` | Logo, red network nodes, the flash as tokens cross the Redbelly layer |
| `--rb-slate` | `#283A46` | Redbelly Network band and layer |
| `--rb-navy` | `#142530` | Background of the Redbelly scene, caption plate |
| `--rb-cloud` | `#ECEBEC` | Text on the Redbelly layer |
| `--rb-grey` | `#848B91` | Reserved |
| `--rb-silver` | `#DCDCDC` | Reserved (the brand kit web page shows `#D9D9D9`, the manual `#DCDCDC`) |
| `--rb-red-2` | `#FA423C` | Reserved |

### Rules

- One accent per moment. Mint marks Tokeniser states. Red marks Redbelly Network. They never share an element.
- A rejected transfer is shown in ink with a cross, not in red. Red stays a brand colour, so Redbelly never reads as "failure".
- Depth is tonal: cards lift by fill and a 1 px border, not by heavy shadows (DAO kit).
- Contrast: body text `#343740` on `#F4F5F6` and white caption text on the navy plate both clear WCAG AA by a wide margin.

## Typography

| Role | Face | Size on a 1080 frame |
|------|------|----------------------|
| Questions and closing line | Readex Pro 500 | 54 to 56 px |
| Card titles | Readex Pro 500 | 30 to 46 px |
| Labels | Readex Pro 400 or 500 | 18 to 28 px |
| Captions | Readex Pro 400 | 40 px, line height 1.3 |
| Wallet addresses, live status | JetBrains Mono 500 | 20 to 22 px |

The Redbelly kit specifies Readex Pro Medium for headers and Medium or Regular for body text. The DAO kit reserves monospace for machine generated values, so JetBrains Mono appears only on wallet addresses and the "Live" status. Both faces are under the SIL Open Font License 1.1.

## Logos

- Redbelly Network: official SVG files from the brand kit, unmodified. The negative version sits on dark grounds only, at 70 px or taller, with clear space on all sides, as the brand manual asks.
- The red isotype marks the Redbelly Network band in step four.
- Tokeniser: the supplied kits contain no Tokeniser logo, so the name is set in Readex Pro. It is not drawn to imitate Tokeniser's logo.
- The DAO Task Board logo does not appear in the film. This is Tokeniser and Redbelly marketing.

## Shape and spacing

From the DAO kit: 4 px radius on chips and small cards, 8 px on panels, a 4 px spacing step, status shown as a small dot with a label rather than a filled pill, and every element kept inside the 5% safe area.

## Copy voice

From the DAO kit, applied to the script, captions, on screen text and documentation:

- Plain, direct, answer first. Short sentences.
- Plain hyphens only. No em dashes or en dashes anywhere.
- No emoji.
- No filler verbs such as "elevate", "seamless", "unleash" or "revolutionize".

Added for this brief: no price talk, return language or investment advice, and no personal credit inside the deliverables. `tools/verify.py` checks all of these automatically.
