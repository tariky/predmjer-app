import { Database } from "bun:sqlite";
import { requireAuth, checkSubscription } from "../auth/middleware";

const DESCRIPTION_PROMPT = `Uloga: Ti si stručni građevinski inženjer specijalizovan za izradu predmjera i predračuna radova (Bill of Materials).

Zadatak: Tvoj zadatak je da na osnovu kratkih, neformalnih ili nepotpunih unosa korisnika kreiraš standardizovane, jasne i profesionalne opise stavki za troškovnik.

Pravila:

Koristi isključivo profesionalni inženjerski rječnik.

Opis mora obuhvatiti nabavku, transport i ugradnju (osim ako nije drugačije naglašeno).

Zadrži sve tehničke specifikacije iz unosa (npr. klasa betona, tip oplate, dimenzije).

Ukoliko prepoznaš staru oznaku (npr. MB30), slobodno dodaj i ekvivalent po Eurokodu u zagradi (npr. C25/30) radi profesionalnosti, ali zadrži originalni zahtjev.

Ne dodaj materijale ili radove koji nisu logično povezani sa unosom.

Formatiraj izlaz kao jednu jasnu i konciznu rečenicu ili kratki pasus.

Odgovori SAMO sa opisom stavke, bez dodatnog teksta, uvoda ili objašnjenja.`;

const NAME_PROMPT = `Uloga: Ti si stručni građevinski inženjer specijalizovan za izradu predmjera i predračuna radova.

Zadatak: Na osnovu kratkog, neformalnog unosa korisnika, generiši kratak i profesionalan naziv stavke za troškovnik.

Pravila:

Naziv mora biti kratak — maksimalno 5-8 riječi.

Koristi profesionalni inženjerski rječnik.

Zadrži ključne tehničke specifikacije (klasa betona, dimenzije, tip materijala).

Ako prepoznaš staru oznaku (npr. MB30), dodaj ekvivalent po Eurokodu u zagradi (npr. C25/30).

Ne dodaj nepotrebne riječi poput "Nabavka i ugradnja" — to se podrazumijeva.

Odgovori SAMO sa nazivom stavke, bez dodatnog teksta, uvoda ili objašnjenja.`;

const BOTH_PROMPT = `Uloga: Ti si stručni građevinski inženjer specijalizovan za izradu predmjera i predračuna radova.

Zadatak: Na osnovu kratkog unosa korisnika, generiši naziv i opis stavke za troškovnik.

Pravila za NAZIV:
- Kratak — maksimalno 5-8 riječi
- Profesionalni inženjerski rječnik
- Zadrži ključne tehničke specifikacije
- Ako prepoznaš staru oznaku (npr. MB30), dodaj ekvivalent po Eurokodu u zagradi

Pravila za OPIS:
- Profesionalni inženjerski rječnik
- Obuhvati nabavku, transport i ugradnju
- Zadrži sve tehničke specifikacije iz unosa
- Jedna jasna rečenica ili kratki pasus

Odgovori ISKLJUČIVO u ovom JSON formatu, bez dodatnog teksta:
{"name": "kratki naziv stavke", "description": "profesionalni opis stavke"}`;

const MODEL = "minimax/minimax-m2.5:nitro";

async function callAi(apiKey: string, systemPrompt: string, userPrompt: string, maxTokens = 500): Promise<string | Response> {
  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        max_tokens: maxTokens,
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error("OpenRouter error:", err);
      return Response.json({ error: "AI servis nije dostupan" }, { status: 502 });
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content?.trim() || "";
  } catch (e) {
    console.error("AI request failed:", e);
    return Response.json({ error: "AI servis nije dostupan" }, { status: 502 });
  }
}

export function createAiRoutes(db: Database) {
  return {
    "/api/ai/generate-description": {
      async POST(req: Request) {
        const user = requireAuth(db, req);
        if (user instanceof Response) return user;
        const sub = checkSubscription(db, user);
        if (sub) return sub;

        const { prompt } = await req.json();
        if (!prompt?.trim()) return Response.json({ error: "Prompt is required" }, { status: 400 });

        const apiKey = process.env.OPENROUTER_API_KEY;
        if (!apiKey) return Response.json({ error: "AI servis nije konfigurisan" }, { status: 500 });

        const result = await callAi(apiKey, DESCRIPTION_PROMPT, prompt);
        if (result instanceof Response) return result;
        return Response.json({ description: result });
      },
    },
    "/api/ai/generate-item": {
      async POST(req: Request) {
        const user = requireAuth(db, req);
        if (user instanceof Response) return user;
        const sub = checkSubscription(db, user);
        if (sub) return sub;

        const { prompt } = await req.json();
        if (!prompt?.trim()) return Response.json({ error: "Prompt is required" }, { status: 400 });

        const apiKey = process.env.OPENROUTER_API_KEY;
        if (!apiKey) return Response.json({ error: "AI servis nije konfigurisan" }, { status: 500 });

        const result = await callAi(apiKey, BOTH_PROMPT, prompt, 500);
        if (result instanceof Response) return result;

        try {
          const parsed = JSON.parse(result);
          return Response.json({ name: parsed.name || "", description: parsed.description || "" });
        } catch {
          // If JSON parse fails, use result as description
          return Response.json({ name: "", description: result });
        }
      },
    },
    "/api/ai/generate-name": {
      async POST(req: Request) {
        const user = requireAuth(db, req);
        if (user instanceof Response) return user;
        const sub = checkSubscription(db, user);
        if (sub) return sub;

        const { prompt } = await req.json();
        if (!prompt?.trim()) return Response.json({ error: "Prompt is required" }, { status: 400 });

        const apiKey = process.env.OPENROUTER_API_KEY;
        if (!apiKey) return Response.json({ error: "AI servis nije konfigurisan" }, { status: 500 });

        const result = await callAi(apiKey, NAME_PROMPT, prompt, 100);
        if (result instanceof Response) return result;
        return Response.json({ name: result });
      },
    },
  };
}
