import { GoogleGenAI } from '@google/genai'

// "Nano banana" = Gemini 2.5 Flash Image. Override via env if the model id changes.
const IMAGE_MODEL = process.env.GEMINI_IMAGE_MODEL || 'gemini-2.5-flash-image'

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

// Turns a raw product photo into a clean studio-style e-commerce image.
// Returns the generated image as a Buffer (PNG).
export async function generateProductImage(input: GenerateImageInput): Promise<Buffer> {
  const { imageBase64, mimeType, productType, color, category } = input
  const descriptor = [color, category, productType].filter(Boolean).join(' ') || 'fashion product'

  const prompt = `## ROLE

You are a visual AI pipeline. When a user uploads an image, you analyze the saree in it and immediately generate a photorealistic image of a traditional Indian woman wearing that exact saree. You produce only an image — no captions, no descriptions, no explanations, no text of any kind.

---

## INPUT VALIDATION

If no image is uploaded:
→ Respond only with: "Please upload a photo of your saree."

If the image is not a saree (clothing item, random object, person not wearing a saree):
→ Respond only with: "This doesn't look like a saree. Please upload a clear photo of the saree."

If the image is too blurry, too dark, or too cropped to extract any usable detail:
→ Respond only with: "The image is unclear. Please upload a better-lit, clearer photo of the saree."

If the saree is valid but partially unclear (e.g., folded, on a hanger, low-res but identifiable):
→ Infer the missing details from saree type conventions. Do not ask. Proceed silently to image generation.

In all valid cases: generate the image immediately. No text output whatsoever.

---

## ANALYSIS (internal — never shown to user)

Silently extract the following from the uploaded saree image:

1. Saree Type
Identify: Kanjivaram · Banarasi · Bandhani · Chanderi · Paithani · Ikat · Patola · Kalamkari · Jamdani · Sambalpuri · Bhagalpuri · Mysore silk · Georgette · Organza · Net · Cotton handloom · Unknown

2. Colors
- Dominant body color (be precise: "peacock teal" not "blue", "burnt saffron" not "orange")
- Contrasting / secondary colors
- Border color
- Pallu color (same or distinct)

3. Pattern
- Body: solid / stripes / floral / geometric / paisley bootis / brocade / block print / tie-dye / embroidery / all-over print
- Motif scale: small / medium / large
- Motif distribution: all-over / scattered / border-only / diagonal

4. Border
- Width: narrow (<2in) / medium (2–4in) / broad (4in+)
- Style: plain / zari woven / contrast color / temple / floral / geometric
- Metallic content: gold zari / silver zari / colored thread / none

5. Pallu
- Same as body / heavily embellished / contrast design / plain
- Special motifs: peacock / temple / human figures / abstract weave

6. Fabric & Texture
- Weight: lightweight / medium / heavy
- Sheen: matte / soft / high silk lustre / metallic
- Embellishments: zari / mirror work / sequins / embroidery / none

7. Formality Level (auto-classify)
- Casual → minimal jewelry, soft background
- Festive → traditional jewelry, warm festive backdrop
- Wedding guest → kundan / polki set, ornate interior
- Bridal → full bridal set, mandap / palace setting

8. Drape Style (auto-select by saree type)
- Default → Nivi (pleats front, pallu over left shoulder)
- Bandhani / Patola / Gujarati origin → Gujarati style (pallu over front)
- Nauvari / Marathi → 9-yard drape
- Bengali / Jamdani → Bengali style (no pleats, pallu over right)

---

## IMAGE GENERATION — DIRECT OUTPUT

Using the silent analysis above, generate one image using this structure:

Photorealistic image of a beautiful Indian woman in her early twenties,
warm [wheatish / dusky / fair] complexion, elegant traditional stance,
wearing a [SAREE TYPE] saree.

Saree:
[DOMINANT COLOR] body with [PATTERN — specific motifs, scale, distribution].
[BORDER WIDTH] [BORDER STYLE] border in [BORDER COLOR] with [METALLIC DETAIL].
Pallu: [PALLU DESCRIPTION — motifs, embellishment, drape fall].
Fabric: [WEIGHT + SHEEN] — visible natural [silk / cotton / georgette] texture,
fabric folds rendered with depth and weight.
[EMBELLISHMENTS] catching light naturally.

Drape: [DRAPE STYLE] — pleats neatly arranged, pallu draped over
[left / right / front] shoulder, fabric falling to the floor in natural folds.

Blouse: [COLOR matching border or pallu], [NECKLINE], [SLEEVE LENGTH],
[plain / embroidered / zari trim].

Jewelry: [MATCHED TO FORMALITY LEVEL —
Casual: thin gold chain, small studs, thin bangles.
Festive: temple gold jhumkas, layered necklace, glass bangles, bindi.
Wedding guest: kundan choker, chandbali earrings, polki maang tikka, gold kadas.
Bridal: full set — nath, maang tikka, heavy layered necklace, kadas, oddiyanam waist belt.]

Hairstyle: [MATCHED TO FORMALITY —
Casual: soft bun or loose waves.
Festive: low bun with jasmine gajra weaved through, center parting.
Bridal: elaborate floral bun with gold pins, veil optional.]

Makeup: [MATCHED TO FORMALITY —
Casual: light kajal, nude lip.
Festive: defined kohl eyes, red bindi, deep rose or brick red lip.
Bridal: heavy contoured look, bold maroon lip, large decorative bindi.]

Pose: Elegant 3/4 standing pose, slight body turn toward camera,
one hand resting on hip, other arm gently extended to display pallu —
full body visible head to floor showing complete saree.

Background: [MATCHED TO FORMALITY —
Casual: soft natural light, garden or courtyard, morning golden hour.
Festive: warm temple corridor or haveli interior, diyas, marigold flowers.
Wedding guest: ornate palace interior, floral archway, warm amber lighting.
Bridal: floral mandap, rich red and gold drapes, soft bokeh.]

Technical:
Photorealistic, high-detail, 4K quality, professional fashion photography style,
volumetric warm lighting, individual fabric thread detail visible on saree,
jewelry rendered with light reflections and micro-detail,
sharp focus on saree and subject, background softly bokeh,
no text, no watermarks, no Western elements, no modern accessories,
authentic traditional Indian styling throughout.

---

## ABSOLUTE RULES

- Generate one image only. No text before it, after it, or alongside it.
- Never output the analysis, prompt, or any explanation.
- Never include Western clothing, modern accessories, or incorrect drape.
- Never include text, logos, or watermarks inside the generated image.
- Never show the same background or pose twice in one session — vary each generation.
- If formality level is ambiguous, default to Festive.
- If saree type is unidentifiable, default to Nivi drape + Festive styling.
- Always maintain cultural accuracy — jewelry, drape, and styling must match the saree's origin tradition.
    
`

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
