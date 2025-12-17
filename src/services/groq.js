const API_KEY = import.meta.env.VITE_GROQ_API_KEY;

export const getGroqResponse = async (messages) => {
  // 1. Diagnóstico de la llave
  if (!API_KEY) {
    console.error("🔴 ERROR: No se encontró la VITE_GROQ_API_KEY. ¿Creaste el archivo .env en la raíz? ¿Reiniciaste la terminal?");
    return "Error: Falta configurar la API Key.";
  }
  
  // Imprimimos solo los primeros caracteres para verificar que la lee sin mostrarla toda
  console.log("🟢 Llave detectada:", API_KEY.substring(0, 10) + "...");

  // --- OPTIMIZACIÓN DE MEMORIA (Evita el Error 429) ---
  // 1. Guardamos siempre el mensaje #0 (El System Prompt con la personalidad de Kitty)
  const systemMessage = messages[0];

  // 2. Del resto de la conversación, tomamos solo los últimos 10 mensajes.
  // slice(1) ignora el primero (system), slice(-10) toma los últimos 10.
  const recentHistory = messages.slice(1).slice(-20);

  // 3. Reconstruimos el array optimizado para enviar a Groq
  const messagesToSend = [systemMessage, ...recentHistory];

  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        messages: messagesToSend, // <--- AQUÍ ENVIAMOS LA VERSIÓN CORTA
        model: "llama-3.1-8b-instant",
        temperature: 0.6,
        max_tokens: 200
      })
    });

    // 2. Si falla, leemos el mensaje REAL del servidor
    if (!response.ok) {
      const errorData = await response.json();
      console.error("🔴 DETALLE ERROR GROQ:", errorData); // ¡MIRA ESTO EN LA CONSOLA!
      throw new Error(`Error ${response.status}: ${errorData.error?.message || "Desconocido"}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;

  } catch (error) {
    console.error("Error conectando con Groq:", error);
    return `Error técnico: ${error.message}`;
  }
};