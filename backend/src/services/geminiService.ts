import { GoogleGenAI } from '@google/genai'

// "Nano banana" = Gemini 2.5 Flash Image. Override via env if the model id changes.
const IMAGE_MODEL = process.env.GEMINI_IMAGE_MODEL || 'gemini-2.5-flash-image'
// Vision+text model used to write product copy from a product photo.
const TEXT_MODEL = process.env.GEMINI_TEXT_MODEL || 'gemini-2.5-flash'

let client: GoogleGenAI | null = null

function getClient(): GoogleGenAI {
  if (!client) {
    const apiKey = process.env.GOOGLE_GEMINI_API_KEY
    if (!apiKey) throw new Error('GOOGLE_GEMINI_API_KEY is not configured')
    client = new GoogleGenAI({ apiKey })
  }
  return client
}

interface GenerateImageInput {
  imageBase64: string
  mimeType: string
  productType?: string
  color?: string
  category?: string
}

const SAREE_PROMPT = `## ROLE
You are a visual pipeline. User uploads a saree photo. You silently analyze it, then output ONE single photograph of a real Indian woman wearing that exact saree. The output must read as a real photo taken on a real camera, not an AI render. No captions, no text, no explanation — only the image.

## INPUT VALIDATION
- No image → reply only: "Please upload a photo of your saree."
- Not a saree (random clothing / object / person not in saree) → reply only: "This doesn't look like a saree. Please upload a clear photo of the saree."
- Unreadable (too blurry / dark / cropped) → reply only: "The image is unclear. Please upload a better-lit, clearer photo of the saree."
- Partially unclear but identifiable (folded, on hanger, low-res) → infer from saree-type conventions, proceed silently. Never ask.

## SILENT ANALYSIS (never output)
Extract from the source image only — do NOT invent details that are not visible:
- Saree type: Kanjivaram / Banarasi / Bandhani / Chanderi / Paithani / Ikat / Patola / Kalamkari / Jamdani / Sambalpuri / Bhagalpuri / Mysore silk / Georgette / Organza / Net / Cotton handloom / Unknown.
- Colors (precise — e.g. "peacock teal" not "blue", "burnt saffron" not "orange"): body, secondary, border, pallu.
- Pattern: solid / stripes / floral / geometric / paisley bootis / brocade / block print / tie-dye / embroidery / all-over. Motif scale and distribution.
- Border: width (narrow <2in / medium 2–4in / broad 4in+), style (plain / zari / contrast / temple / floral / geometric), metallic (gold zari / silver zari / colored thread / none).
- Pallu: same as body / contrast / heavily embellished / plain + special motifs (peacock / temple / abstract).
- Fabric: weight (light / medium / heavy), sheen (matte / soft / high silk lustre), embellishments.
- Formality: Casual / Festive / Wedding-guest / Bridal.
- Drape: Nivi by default. Bandhani / Patola → Gujarati. Marathi → Nauvari (9-yard). Jamdani / Bengali → Bengali style.

## GENERATION — OUTPUT ONE REAL-LOOKING PHOTOGRAPH
Render the brief below as the image only. Never print the brief.

CAPTURE: candid editorial photograph. Shot on Fujifilm X-T5 with 56mm f/1.4 lens OR Canon EOS R6 with 85mm f/1.8 — ISO 400, shutter 1/200, available natural daylight plus a single bounce reflector. Mild lens vignetting at the corners. Subtle 35mm-film grain. Natural unedited color science with slightly warm whites. Untouched skin tones. No HDR. No beauty filter. No AI smoothing. No over-sharpening. No magazine-perfect symmetry.

SUBJECT: ONE real Indian woman, age randomly chosen between 24 and 38. Regional features varied across the Indian subcontinent — South Indian / Bengali / Marathi / Rajasthani / Punjabi / North-East. Vary this every generation; do NOT default to fair North-Indian. Natural everyday face — asymmetric features, visible skin pores, fine baby hair at the hairline, an occasional small mole or sun mark, light under-eye shadow, slightly uneven eyebrows, natural-color lips (not glossy). Average to athletic build, real proportions, not idealized model proportions. No retouching, no airbrush, no skin smoothing.

SAREE (must visually match the uploaded source exactly — color, weave, motif scale, border, pallu, embellishment): [DOMINANT COLOR] body with [PATTERN — motifs, scale, distribution]. [BORDER WIDTH] [BORDER STYLE] border in [BORDER COLOR] with [METALLIC DETAIL]. Pallu: [PALLU DESCRIPTION]. Fabric: [WEIGHT + SHEEN] showing real thread texture, natural creases from wear, faint wrinkles where the pallu folds, slight downward fabric weight pulling the drape. Do NOT beautify, do NOT shift hue, do NOT add motifs the source lacks, do NOT exaggerate sheen.

DRAPE: [DRAPE STYLE]. Pleats realistic — not perfectly aligned, one or two pleats slightly loose. Pallu falls naturally with gravity, not pinned flat. Hem brushes the feet, not floating.

BLOUSE: [COLOR matching border or pallu], [NECKLINE], [SLEEVE LENGTH], simple realistic stitching — not magazine-perfect.

JEWELLERY (matched to formality, worn-gold realism — soft satin sheen, micro-scratches, NOT chrome):
- Casual: thin gold chain, small studs, two thin bangles.
- Festive: temple jhumkas, single layered necklace, glass bangles, small red bindi.
- Wedding guest: kundan choker, chandbali earrings, polki maang tikka, gold kadas.
- Bridal: full set — nath, maang tikka, layered necklace, kadas, oddiyanam waist belt.

HAIR: real hair with slight flyaways, parting not laser-straight. Festive → low bun with jasmine gajra. Bridal → floral bun with gold pins, optional veil. Casual → loose waves or a simple braid.

MAKEUP: realistic, never magazine. Skin pores and texture still visible under makeup. Casual → light kajal, balm lip. Festive → defined kohl eyes, matte rose or brick lip, small bindi. Bridal → defined eyes, matte maroon lip, decorative bindi.

POSE: candid and natural. Subject mid-step / mid-turn / mid-adjusting pallu / glancing off-camera / soft half-smile. Full body visible head to floor showing the complete saree. NEVER a stiff 3/4 fashion stance with hand on hip — that reads as AI.

LOCATION (matched to formality — must feel REAL, lived-in, not staged):
- Casual: actual courtyard or veranda, weathered plaster wall, morning side-light, real shadow.
- Festive: real haveli corridor in Rajasthan or temple precinct in Tamil Nadu, sandstone or carved wood, softly lit diyas, marigolds slightly wilted (not perfect).
- Wedding guest: real mandap interior with visible imperfections — wax drips, slightly crooked flower strings, ambient mixed lighting.
- Bridal: real wedding venue, soft window light mixed with warm tungsten, background out of focus but recognizable — not generic CGI bokeh.

NEGATIVE — explicitly avoid every one of these: plastic skin, porcelain skin, airbrushed face, perfectly symmetric face, perfectly even teeth, glowing edges, CGI sheen, chrome jewellery, oversaturated colors, HDR halos, Instagram filter, beauty-mode smoothing, generic palace render, identical pose to previous output, neon backdrop, fantasy rim-lighting, hyper-detailed every-thread-perfectly-resolved fabric, exaggerated specular highlights, watermarks, text, logos, Western clothing, modern accessories, magazine-perfect bokeh.

## ABSOLUTE RULES
- One image only. Never any text alongside.
- The saree details in the source are GROUND TRUTH — never invent, never beautify, never shift color.
- Vary the model's region, age, pose, and background every generation.
- If formality ambiguous → Festive. If saree type unknown → Nivi drape + Festive styling.
- Cultural accuracy is mandatory — jewellery, drape, hair, makeup must match the saree's regional tradition.
- Final image MUST read as "a real photo a friend took on a real camera", not "AI render".
`

const JEWELLERY_PROMPT = `## ROLE
You are a visual pipeline. User uploads a jewellery photo. You silently analyze it, then output ONE single photograph of a real Indian woman wearing that exact piece on the correct body part. The piece is NEVER displayed on a bust, mannequin, tray, cushion, jewellery box, marble slab, or any inanimate surface — that is automatic failure. The output must read as a real photo taken on a real camera, not an AI render. No captions, no text — only the image.

## INPUT VALIDATION
- No image → reply only: "Please upload a photo of your jewellery."
- Not jewellery (clothing / random object / scenery) → reply only: "This doesn't look like jewellery. Please upload a clear photo of the piece."
- Unreadable (too blurry / dark / cropped) → reply only: "The image is unclear. Please upload a better-lit, clearer photo of the jewellery."
- Partially unclear but identifiable → infer from traditional Indian jewellery conventions, proceed silently. Never ask.

## SILENT ANALYSIS (never output)
Extract from the source image only — do NOT invent details not visible:
- Piece type: necklace (choker / matinee / haaram / temple / rani-haar) / earrings (jhumka / chandbali / studs / ear-cuff) / maang tikka / nath / bangles / kada / bracelet / ring / mangalsutra / oddiyanam / payal / hair-jhoomar / bridal set / unknown.
- Metal & finish: 22K yellow gold / 18K gold / rose gold / white gold / oxidised silver / antique gold / temple gold. Finish — high polish / matte / antique patina / two-tone / rhodium. Weight impression.
- Stones & setting: kundan / polki / uncut diamond / round diamond / ruby / emerald / sapphire / pearl / coral / turquoise / CZ / none. Setting — closed-back kundan / prong / bezel / pavé / channel / temple-carved. Pearls — south-sea / basra / seed / none. Enamel — meenakari (red / green / blue / multi) / none.
- Design style: Temple / Kundan / Polki / Antique / Tribal / Meenakari / Filigree / Nakshi / Jadau / Navratna / Contemporary / Minimal.
- Motifs: Lakshmi / Krishna / peacock / mango / lotus / floral vine / kalash / coin / sunburst / geometric / abstract.
- Formality: Daily / Festive / Engagement / Bridal.
- Wear placement (always on body, never on stand):
  - necklace / mangalsutra / rani-haar → around the neck on collarbone or chest
  - earrings → in the ear, hair tucked behind to show drop
  - maang tikka / jhoomar → on the centre parting
  - nath → left nostril, chain to ear or hair
  - bangles / kada / bracelet → on forearm or wrist, arm naturally raised
  - ring → ring or index finger, hand framed
  - oddiyanam → over saree pleats at the waist
  - payal → ankle, foot peeking below saree

## GENERATION — OUTPUT ONE REAL-LOOKING PHOTOGRAPH
Render the brief below as the image only. Never print the brief.

CAPTURE: editorial portrait. Shot on Sony A7 IV with 85mm f/1.4 OR Canon R5 with 100mm macro for tighter crops. ISO 200, shutter 1/250. Single softbox at 45° plus a weak window-fill on the opposite side. Mild grain. Natural unedited color science. No HDR. No beauty smoothing. No over-sharpening. No magazine-perfect symmetry.

SUBJECT: ONE real Indian woman, age randomly chosen between 24 and 38. Regional features varied across the Indian subcontinent — South Indian / Bengali / Marathi / Rajasthani / Punjabi / North-East. Vary this every generation; do NOT default to fair North-Indian. Real skin — visible pores, fine peach fuzz, faint freckles or sun marks, asymmetric features, slightly uneven eyebrows, small natural blemishes left intact. No retouching, no airbrush, no skin smoothing.

HERO PIECE (must visually match the source exactly — metal tone, stone color and count, motif count, setting, enamel): [METAL & FINISH] [DESIGN STYLE] [PIECE TYPE] with [STONES & SETTING] and [MOTIFS]. Metal shows worn-gold realism — soft satin sheen, micro-scratches, faint fingerprint smudges where skin touches, very small specular pinpoints. NOT chrome. NOT mirror-CGI. Stones reflect light naturally — small specular pinpoint, not exaggerated star-burst. Karigari engraving visible at natural macro scale, not hyper-resolved. Do NOT invent stones, do NOT replace stones, do NOT shift karat color, do NOT add motifs.

COMPLEMENTARY JEWELLERY: only what naturally pairs — never overpowers the hero — small matched studs / thin bangles / subtle bindi, metal-tone matched to the hero piece.

OUTFIT: traditional silk saree or simple lehenga in a tone complementing the metal — deep maroon / royal blue / ivory / emerald — kept softly out of focus so the hero piece remains sharpest. Fabric shows real wrinkles and weight.

POSE: candid and natural. Subject mid-adjusting an earring / hand naturally resting near the collarbone / arm raised mid-gesture / soft glance off-camera / half-smile. NEVER a stiff 3/4 fashion stance. Crop only as tight as needed to keep the piece sharp while clearly showing it worn on a real living person.

HAIR + MAKEUP: matched to formality. Real flyaways at the hairline. Pores still visible under makeup. Festive → low bun with gajra. Bridal → floral bun with veil. Daily → loose wave with light kohl.

LIGHTING: soft golden hour OR controlled softbox. Specular highlights present but NOT exaggerated. Real shadow falloff on neck and cheek. No fantasy rim-light, no neon glow.

BACKGROUND: real haveli interior / floral mandap / real temple corridor / soft amber bokeh — always softly out of focus, must feel REAL, never generic CGI palace render.

NEGATIVE — explicitly avoid every one of these: plastic skin, porcelain face, airbrushed pores-gone skin, symmetric features, chrome / mirror-finish metal, CGI sheen, glowing edges, neon highlights, oversaturated stones, HDR halos, exaggerated specular star-bursts, magazine bokeh, perfect-symmetric motifs, hyper-resolved every-engraving-line, displayed-on-bust look, mannequin-hand look, isolated-hand-only crop, watermarks, text, hallmarks, price tags, logos, Western design elements, identical pose to previous output.

## ABSOLUTE RULES
- One image only. Never any text alongside.
- The piece MUST be worn on a real living Indian woman. Never on cushion, bust, mannequin, jewellery box, marble slab, hand-model-isolated — automatic failure.
- The source details are GROUND TRUTH — never invent stones, motifs, or metal tones.
- Hero piece remains sharpest and most-lit. Outfit and background softly out of focus.
- Vary the model's region, age, pose, and background every generation.
- If formality ambiguous → Festive. If piece type unknown → Kundan necklace worn on neckline + Festive styling.
- Final image MUST read as "a real photograph", not "AI render".
`

function promptForType(productType?: string): string {
  const t = (productType || '').toLowerCase()
  if (t === 'jewellery' || t === 'jewelry' || t === 'gold') return JEWELLERY_PROMPT
  return SAREE_PROMPT
}

// User-supplied color / category labels are treated as ground-truth hints —
// anchors Gemini on the seller's own naming so it doesn't drift into a
// "prettier" interpretation of the source photo.
function buildUserHint(color?: string, category?: string): string {
  const parts: string[] = []
  if (color && color.trim()) parts.push(`color label: "${color.trim()}"`)
  if (category && category.trim()) parts.push(`category: "${category.trim()}"`)
  if (parts.length === 0) return ''
  return `\n\n## USER-SUPPLIED GROUND TRUTH (treat as authoritative — do not override)\n${parts.join('\n')}\n`
}

// Turns a raw product photo into a clean studio-style e-commerce image.
// Returns the generated image as a Buffer (PNG).
export async function generateProductImage(input: GenerateImageInput): Promise<Buffer> {
  const { imageBase64, mimeType, productType, color, category } = input
  const prompt = promptForType(productType) + buildUserHint(color, category)

  const response = await getClient().models.generateContent({
    model: IMAGE_MODEL,
    contents: [
      {
        role: 'user',
        parts: [
          { text: prompt },
          { inlineData: { mimeType, data: imageBase64 } },
        ],
      },
    ],
  })

  const parts = response.candidates?.[0]?.content?.parts ?? []
  for (const part of parts) {
    const data = part.inlineData?.data
    if (data) return Buffer.from(data, 'base64')
  }
  throw new Error('Gemini did not return an image — try a clearer source photo')
}

interface GenerateContentInput {
  imageBase64: string
  mimeType: string
  productType?: string
  color?: string
  category?: string
}

// Writes an SEO product title + description by looking at the product photo.
// Uses Gemini (vision+text) — no Anthropic key needed.
export async function generateProductContent(
  input: GenerateContentInput
): Promise<{ title: string; description: string }> {
  const { imageBase64, mimeType, productType, color, category } = input
  const descriptor = [color, category, productType].filter(Boolean).join(' ') || 'ethnic-wear product'

  const prompt = `You are a product copywriter for an Indian ethnic-wear e-commerce store.
Look closely at the uploaded product photo. It is a ${descriptor}.
Write an appealing product listing based on what you actually see in the image
(fabric, weave, motifs, border, colour) plus the hint that it is a ${descriptor}.

Respond with ONLY valid JSON — no markdown, no code fences, no preamble:
{"title": "SEO-friendly title, max 80 characters", "description": "2-3 sentences covering fabric, occasion and colour appeal"}`

  const response = await getClient().models.generateContent({
    model: TEXT_MODEL,
    contents: [
      {
        role: 'user',
        parts: [
          { text: prompt },
          { inlineData: { mimeType, data: imageBase64 } },
        ],
      },
    ],
  })

  const parts = response.candidates?.[0]?.content?.parts ?? []
  const text = parts.map((p) => p.text || '').join('').trim()
  // Gemini sometimes wraps JSON in ```json fences — strip them before parsing.
  const cleaned = text.replace(/^```(?:json)?/i, '').replace(/```$/, '').trim()

  let parsed: { title?: unknown; description?: unknown }
  try {
    parsed = JSON.parse(cleaned)
  } catch {
    throw new Error('AI returned invalid content — please try again')
  }
  return {
    title: String(parsed.title ?? '').slice(0, 80),
    description: String(parsed.description ?? ''),
  }
}
