const API_KEY = import.meta.env.VITE_GROQ_API_KEY;

export const getGroqResponse = async (messages) => {
  // 1. Diagnóstico de la llave
  if (!API_KEY) {
    console.error("🔴 ERROR: No se encontró la VITE_GROQ_API_KEY.");
    return "Error: Falta configurar la API Key.";
  }
  
  // Opcional: Log para ver que la llave existe
  // console.log("🟢 Llave detectada:", API_KEY.substring(0, 10) + "...");

  // --- OPTIMIZACIÓN DE MEMORIA ---
  const systemMessage = messages[0];
  const recentHistory = messages.slice(1).slice(-20);
  const messagesToSend = [systemMessage, ...recentHistory];

  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        messages: messagesToSend,
        model: "llama-3.1-8b-instant",
        temperature: 0.6,
        max_tokens: 1000 
      })
    });

    // 2. MANEJO DE ERRORES INTELIGENTE
    if (!response.ok) {
      
      // CASO ESPECIAL: ERROR 429 (Límite de tokens superado)
      if (response.status === 429) {
        console.warn("⚠️ Límite de Groq alcanzado (429). Enviando mensaje de espera.");
        return "Espera, me he cansado de tanto pensar, dame un minuto... 😿💤";
      }

      // OTROS ERRORES (400, 500, etc)
      const errorData = await response.json();
      console.error("🔴 DETALLE ERROR GROQ:", errorData);
      throw new Error(`Error ${response.status}: ${errorData.error?.message || "Desconocido"}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;

  } catch (error) {
    console.error("Error conectando con Groq:", error);
    // Si es un error de red (internet caído), devolvemos esto:
    return `¡Ups! Se me fue el internet. 😿 Revisá tu conexión.`;
  }
};