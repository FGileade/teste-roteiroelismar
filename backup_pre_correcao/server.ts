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

import { initializeApp, getApps, getApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

// Initialize Firebase Admin SDK safely
const adminApp = getApps().length === 0 ? initializeApp({
  projectId: process.env.VITE_FIREBASE_PROJECT_ID || 'roteiroelismar'
}) : getApp();

async function verifyIdToken(token: string) {
  return getAuth(adminApp).verifyIdToken(token);
}

interface UserRateLimit {
  hourlyCount: number;
  hourlyReset: number;
  dailyCount: number;
  dailyReset: number;
  concurrentCalls: number;
}

const userLimits = new Map<string, UserRateLimit>();
const ipLimits = new Map<string, { count: number; reset: number }>();
const aiCache = new Map<string, { text: string; expiry: number }>();

function checkUserLimits(uid: string): { allowed: boolean; reason?: string } {
  const now = Date.now();
  let limit = userLimits.get(uid);
  if (!limit) {
    limit = {
      hourlyCount: 0,
      hourlyReset: now + 3600000,
      dailyCount: 0,
      dailyReset: now + 86400000,
      concurrentCalls: 0
    };
    userLimits.set(uid, limit);
  }

  if (now > limit.hourlyReset) {
    limit.hourlyCount = 0;
    limit.hourlyReset = now + 3600000;
  }
  if (now > limit.dailyReset) {
    limit.dailyCount = 0;
    limit.dailyReset = now + 86400000;
  }

  const maxHour = parseInt(process.env.MAX_AI_CALLS_PER_USER_HOUR || '10', 10);
  const maxDay = parseInt(process.env.MAX_AI_CALLS_PER_USER_DAY || '30', 10);
  const maxConcurrent = parseInt(process.env.MAX_CONCURRENT_AI_CALLS || '1', 10);

  if (limit.concurrentCalls >= maxConcurrent) {
    return { allowed: false, reason: 'Outra solicitação de IA está em andamento.' };
  }
  if (limit.hourlyCount >= maxHour) {
    return { allowed: false, reason: 'Limite horário de chamadas de IA excedido.' };
  }
  if (limit.dailyCount >= maxDay) {
    return { allowed: false, reason: 'Limite diário de chamadas de IA excedido.' };
  }

  return { allowed: true };
}

function checkIpLimits(ip: string): boolean {
  const now = Date.now();
  let limit = ipLimits.get(ip);
  if (!limit || now > limit.reset) {
    limit = { count: 0, reset: now + 3600000 };
    ipLimits.set(ip, limit);
  }
  const maxIpPerHour = parseInt(process.env.MAX_AI_CALLS_PER_IP_HOUR || '60', 10);
  if (limit.count >= maxIpPerHour) {
    return false;
  }
  limit.count++;
  return true;
}

// Authentication and validation middleware
async function authenticateRequest(req: any, res: any, next: any) {
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Método não permitido.' });
    }

    // App Check Token Check (Placeholder/Log warning if missing)
    const appCheckToken = req.headers['x-firebase-appcheck'];
    if (!appCheckToken) {
      console.warn(`[App Check Warning] Missing x-firebase-appcheck token for IP ${req.ip}`);
      if (process.env.ENFORCE_APP_CHECK === 'true') {
        return res.status(401).json({ error: 'Token App Check ausente.' });
      }
    }

    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Não autorizado. Token de autenticação ausente.' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = await verifyIdToken(token);

    req.user = decoded; // inject user info
    next();
  } catch (error: any) {
    console.error('Authentication failure:', error.message);
    res.status(401).json({ error: 'Token de autenticação inválido ou expirado.' });
  }
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '20kb' })); // Max payload size 20KB limit

  // API: Generate sales arguments and advice for a specific client
  app.post("/api/gemini/client-tips", authenticateRequest, async (req: any, res: any) => {
    const uid = req.user.uid;
    const ip = req.ip;

    if (!checkIpLimits(ip)) {
      return res.status(429).json({ error: 'Limite de requisições excedido para este IP.' });
    }

    const userLimitStatus = checkUserLimits(uid);
    if (!userLimitStatus.allowed) {
      return res.status(429).json({ error: userLimitStatus.reason });
    }

    const limit = userLimits.get(uid)!;
    limit.concurrentCalls++;

    try {
      const { client, history } = req.body;

      if (!client || !client.id || !client.name) {
        limit.concurrentCalls = Math.max(0, limit.concurrentCalls - 1);
        return res.status(400).json({ error: "Dados do cliente inválidos ou ausentes." });
      }

      // Check Cache
      const cacheKey = `${uid}_tips_${client.id}`;
      const cached = aiCache.get(cacheKey);
      if (cached && Date.now() < cached.expiry) {
        console.log(`[AI Cache Hit] Tips for client ${client.id} loaded from cache.`);
        limit.concurrentCalls = Math.max(0, limit.concurrentCalls - 1);
        return res.json({ tips: cached.text });
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

      // Limit prompt size
      if (prompt.length > 8000) {
        limit.concurrentCalls = Math.max(0, limit.concurrentCalls - 1);
        return res.status(400).json({ error: 'Tamanho de prompt excede o limite aceito.' });
      }

      console.log(`[Gemini Request] Generating tips for client: ${client.id} (user: ${uid})`);
      
      // Implement timeout
      const generatePromise = ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
      });

      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('AI Request Timeout')), 10000)
      );

      const response = await Promise.race([generatePromise, timeoutPromise]);

      limit.hourlyCount++;
      limit.dailyCount++;

      // Save to Cache (Expires in 1 hour)
      aiCache.set(cacheKey, { text: response.text, expiry: Date.now() + 3600000 });

      res.json({ tips: response.text });
    } catch (error: any) {
      console.error("Error in client-tips api:", error.message);
      res.status(500).json({ error: "Erro interno ao gerar dicas com IA." });
    } finally {
      limit.concurrentCalls = Math.max(0, limit.concurrentCalls - 1);
    }
  });

  // API: Generate full route plan summary for today
  app.post("/api/gemini/route-summary", authenticateRequest, async (req: any, res: any) => {
    const uid = req.user.uid;
    const ip = req.ip;

    if (!checkIpLimits(ip)) {
      return res.status(429).json({ error: 'Limite de requisições excedido para este IP.' });
    }

    const userLimitStatus = checkUserLimits(uid);
    if (!userLimitStatus.allowed) {
      return res.status(429).json({ error: userLimitStatus.reason });
    }

    const limit = userLimits.get(uid)!;
    limit.concurrentCalls++;

    try {
      const { date, weekday, visits } = req.body;

      if (!visits || !Array.isArray(visits)) {
        limit.concurrentCalls = Math.max(0, limit.concurrentCalls - 1);
        return res.status(400).json({ error: "Lista de visitas é obrigatória." });
      }

      if (visits.length === 0) {
        limit.concurrentCalls = Math.max(0, limit.concurrentCalls - 1);
        return res.json({ summary: "Nenhuma visita programada para hoje. Aproveite para cadastrar novos clientes ou planejar rotas futuras!" });
      }

      // Check Cache
      const cacheKey = `${uid}_summary_${date}`;
      const cached = aiCache.get(cacheKey);
      if (cached && Date.now() < cached.expiry) {
        console.log(`[AI Cache Hit] Route summary for date ${date} loaded from cache.`);
        limit.concurrentCalls = Math.max(0, limit.concurrentCalls - 1);
        return res.json({ summary: cached.text });
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

      if (prompt.length > 8000) {
        limit.concurrentCalls = Math.max(0, limit.concurrentCalls - 1);
        return res.status(400).json({ error: 'Tamanho de prompt excede o limite aceito.' });
      }

      console.log(`[Gemini Request] Generating route summary for date: ${date} (user: ${uid})`);

      const generatePromise = ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
      });

      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('AI Request Timeout')), 10000)
      );

      const response = await Promise.race([generatePromise, timeoutPromise]);

      limit.hourlyCount++;
      limit.dailyCount++;

      // Save to Cache (Expires in 1 hour)
      aiCache.set(cacheKey, { text: response.text, expiry: Date.now() + 3600000 });

      res.json({ summary: response.text });
    } catch (error: any) {
      console.error("Error in route-summary api:", error.message);
      res.status(500).json({ error: "Erro interno ao gerar resumo da rota com IA." });
    } finally {
      limit.concurrentCalls = Math.max(0, limit.concurrentCalls - 1);
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
