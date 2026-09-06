import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

// Initialize Gemini API Client
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'roteiroelismar-build',
    }
  }
});

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API: Generate sales arguments and advice for a specific client
  app.post("/api/gemini/client-tips", async (req, res) => {
    try {
      const { client, history } = req.body;

      if (!client) {
        return res.status(400).json({ error: "Client data is required." });
      }

      const prompt = `
Você é um consultor de vendas especialista no setor de Pet Shop, Rações e Produtos para Animais de Estimação.
Analise as informações do cliente abaixo e seu histórico de negociações para fornecer:
1. Uma estratégia de abordagem personalizada (com que tom falar, o que destacar).
2. Sugestão de produtos ideais para oferecer nesta visita (Rações premium, brinquedos, medicamentos, sachês, etc.), considerando as compras anteriores se existirem.
3. Tratamento de possíveis objeções (ex: preço, falta de espaço, fidelidade a outra marca).
4. Uma sugestão direta de script de abordagem rápida em formato amigável para ler no celular (vendedor está na porta do cliente).

DADOS DO CLIENTE:
- Nome Fantasia: ${client.name}
- Razão Social: ${client.legalName || 'Não informada'}
- Nome do Comprador: ${client.buyerName}
- Teleto/WhatsApp: ${client.phone}
- Endereço: ${client.address}, ${client.city || ''}
- Frequência de Visita: ${client.frequency}

HISTÓRICO RECENTE DE NEGOCIAÇÕES:
${history && history.length > 0 
  ? history.map((h: any) => `- Data: ${h.date} | Valor: R$ ${h.value} | Notas: "${h.notes}"`).join('\n')
  : 'Nenhuma negociação cadastrada ainda (Novo cliente)'
}

Responda em formato Markdown bem estruturado, limpo, motivador e focado em resultados rápidos. Mantenha os textos objetivos e fáceis de ler no celular durante a rota. Use bullet points elegantes.
`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
      });

      res.json({ tips: response.text });
    } catch (error: any) {
      console.error("Error in client-tips:", error);
      res.status(500).json({ error: error.message || "Erro interno ao gerar dicas com IA." });
    }
  });

  // API: Generate full route plan summary for today
  app.post("/api/gemini/route-summary", async (req, res) => {
    try {
      const { date, weekday, visits } = req.body;

      if (!visits || !Array.isArray(visits)) {
        return res.status(400).json({ error: "Visits list is required." });
      }

      if (visits.length === 0) {
        return res.json({ summary: "Nenhuma visita programada para hoje. Aproveite para cadastrar novos clientes ou planejar rotas futuras!" });
      }

      const prompt = `
Você é um gerente comercial e estrategista de rotas pet.
Analise a agenda de visitas de hoje (${date}, ${weekday}) e monte um resumo estratégico do dia ("Game Plan") para o vendedor externo.

LISTA DE VISITAS DE HOJE:
${visits.map((v: any, index: number) => `
${index + 1}. Cliente: ${v.clientName}
   - Tipo/Status: ${v.isExtra ? 'Visita Extra' : 'Rota Regular'} | Status Atual: ${v.status}
   - Detalhes adicionais: ${v.notes || 'Sem observações'}
`).join('\n')}

Por favor, elabore um resumo contendo:
1. Um resumo em poucas palavras do foco principal do dia (ex: "Dia de focar em rações premium de cães" ou "Recuperação de clientes inativos").
2. Clientes "Chave" de hoje (aqueles com maior potencial ou que precisam de atenção especial).
3. Uma frase de motivação curta e enérgica para começar o dia com energia.

Escreva de forma sucinta, profissional e inspiradora em formato Markdown com marcadores.
`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
      });

      res.json({ summary: response.text });
    } catch (error: any) {
      console.error("Error in route-summary:", error);
      res.status(500).json({ error: error.message || "Erro interno ao gerar resumo da rota com IA." });
    }
  });

  // API: Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", message: "Server is healthy." });
  });

  // Serve frontend assets
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
});
