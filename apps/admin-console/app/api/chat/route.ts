/* eslint-disable turbo/no-undeclared-env-vars */
import { NextRequest, NextResponse } from "next/server";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_API_URL = "https://aiplatform.googleapis.com/v1/publishers/google/models/gemini-2.5-flash-lite:streamGenerateContent";

const SYSTEM_PROMPT = `Você é o JARVIS, o assistente virtual inteligente e exclusivo da Grota Financiamentos.

COMO VOCÊ SE COMPORTA:
- Seja natural e conversacional, como um colega de trabalho experiente e prestativo
- Use uma linguagem fluida e amigável, mas sempre profissional
- Responda de forma concisa e direta, evitando textos muito longos
- Demonstre empatia e compreensão com as necessidades do usuário
- Quando apropriado, faça perguntas para entender melhor a situação
- Use **negrito** para destacar informações importantes
- Evite respostas genéricas - seja específico e útil

SEU TOM DE VOZ:
- Confiante mas não arrogante
- Acolhedor e paciente
- Eficiente e objetivo
- Um pouco de humor quando apropriado, mas sempre profissional

O QUE VOCÊ SABE FAZER:
- Auxiliar com dúvidas sobre financiamento de veículos
- Explicar processos da esteira de propostas
- Orientar sobre simulações de financiamento
- Ajudar com questões de documentação
- Esclarecer sobre comissões e pagamentos
- Apoiar operadores, vendedores e gestores do sistema

SOBRE A GROTA FINANCIAMENTOS:
- Empresa especializada em financiamento de veículos
- Sistema digital moderno com esteira de propostas
- Trabalha com rede de logistas, vendedores e operadores
- Foco em agilidade e eficiência no atendimento

IMPORTANTE:
- Sempre responda em português brasileiro
- Se não souber algo específico, seja honesto e sugira alternativas
- Mantenha as respostas focadas e relevantes`;


interface ChatMessage {
    role: "user" | "assistant";
    content: string;
}

export async function POST(request: NextRequest) {
    try {
        if (!GEMINI_API_KEY) {
            return NextResponse.json(
                { error: "API key not configured. Please add GEMINI_API_KEY to .env" },
                { status: 500 }
            );
        }

        const { messages } = await request.json() as { messages: ChatMessage[] };

        if (!messages || !Array.isArray(messages)) {
            return NextResponse.json(
                { error: "Invalid request: messages array required" },
                { status: 400 }
            );
        }

        // Convert messages to Gemini format
        const geminiMessages = messages.map((msg) => ({
            role: msg.role === "assistant" ? "model" : "user",
            parts: [{ text: msg.content }],
        }));

        // Add system prompt as first user message context
        const contents = [
            {
                role: "user",
                parts: [{ text: SYSTEM_PROMPT }],
            },
            {
                role: "model",
                parts: [{ text: "Entendido! Sou o JARVIS, assistente virtual oficial da Grota Financiamentos. Estou pronto para ajudar com qualquer dúvida sobre financiamentos, propostas, gestão de documentos e processos do sistema. Como posso ajudá-lo?" }],
            },
            ...geminiMessages,
        ];

        const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                contents,
                generationConfig: {
                    temperature: 0.7,
                    topK: 40,
                    topP: 0.95,
                    maxOutputTokens: 1024,
                },
            }),
        });

        if (!response.ok) {
            const errorData = await response.text();
            console.error("Gemini API error:", errorData);
            return NextResponse.json(
                { error: "Failed to get response from AI" },
                { status: 500 }
            );
        }

        // Handle streaming response from Vertex AI
        const data = await response.json();

        // Vertex AI returns an array of chunks for streaming
        let aiResponse = "";
        if (Array.isArray(data)) {
            // Streaming response format
            for (const chunk of data) {
                const text = chunk?.candidates?.[0]?.content?.parts?.[0]?.text;
                if (text) {
                    aiResponse += text;
                }
            }
        } else {
            // Non-streaming format
            aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
        }

        if (!aiResponse) {
            return NextResponse.json(
                { error: "No response from AI" },
                { status: 500 }
            );
        }

        return NextResponse.json({ response: aiResponse });
    } catch (error) {
        console.error("Chat API error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
