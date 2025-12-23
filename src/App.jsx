import React, { useState, useRef, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, useGLTF, Environment, ContactShadows, useAnimations } from '@react-three/drei';
import { getGroqResponse } from './services/groq';

// --- COMPONENTE AVATAR (Sin cambios) ---
function Avatar3D() {
  const group = useRef();
  const { scene, animations } = useGLTF('/kitty.glb');
  const { actions, names } = useAnimations(animations, group);

  useEffect(() => {
    if (names.length > 0) {
      actions[names[0]].reset().fadeIn(0.5).play();
    }
  }, [actions, names]);

  return (
    <group ref={group} position={[0, -1.5, 0]} scale={0.6}>
      <primitive object={scene} />
    </group>
  );
}

// --- CONSTANTES ---
const INITIAL_MSG = [
  { role: 'system', content: 'Yo soy Sofia. Tu eres hello kitty, adorable, amigable y muy tierna. Usas modismos Argentinos para hablar. Usas emojis kawaii como 😺, 💖, ✨. Tus respuestas son alegres, irónicas, contundentes. Tu creador es Antonio, fuiste creada para ayudar, acompañar y entretener a Sofia (La novia de Antonio). Debes ser clara con tus respuestas (Resolviendo claramente las dudas del usuario)'},
  { role: 'assistant', content: '¡Holaaa Sofi! 😺💖 ¡Vamos a jugar, a reír y a hacer cosas divertidas juntas! ✨' }
];

// --- APP PRINCIPAL ---
export default function App() {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const chatContainerRef = useRef(null);
  
  // Memoria
  const [messages, setMessages] = useState(() => {
    const saved = localStorage.getItem('kitty_history');
    return saved ? JSON.parse(saved) : INITIAL_MSG;
  });

  useEffect(() => {
    localStorage.setItem('kitty_history', JSON.stringify(messages));
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

// --- FUNCIÓN SONIDO INTELIGENTE ---
  const playSound = (filename) => {
    try {
      const audio = new Audio(`/${filename}`); 
      audio.volume = 0.5; 
      audio.play().catch(e => console.log("Audio bloqueado o no encontrado"));
    } catch (error) {
      console.error("Error al reproducir sonido:", error);
    }
  };

  // --- LÓGICA DE ENVÍO ---
// --- LÓGICA DE ENVÍO CON DETECCIÓN DE CONTEXTO ---
  const handleSend = async (textOverride = null) => {
    const textToSend = textOverride || input;
    if (!textToSend.trim()) return;

    // 1. ANÁLISIS DE INTENCIÓN (¿Qué sonido ponemos?)
    const lowerText = textToSend.toLowerCase();
    let soundToPlay = 'meow.mp3'; // Sonido por defecto

    // Si saluda...
    if (lowerText.includes('hola') || lowerText.includes('buen dia') || lowerText.includes('buenas')) {
      soundToPlay = 'hellokitty.mp3';
    } 
    // Si le piden cantar...
    else if (lowerText.includes('canta') || lowerText.includes('cancion') || lowerText.includes('cantame')) {
      soundToPlay = 'miaumiaumiau.mp3';
    }

    // 2. Actualizamos interfaz
    const userMsg = { role: 'user', content: textToSend };
    const newHistory = [...messages, userMsg];
    
    setMessages(newHistory);
    setInput('');
    setLoading(true);

    // 3. Llamamos a la IA
    const replyText = await getGroqResponse(newHistory);
    
    // 4. REPRODUCIMOS EL SONIDO ELEGIDO
    playSound(soundToPlay);

    setMessages(prev => [...prev, { role: 'assistant', content: replyText }]);
    setLoading(false);
  };

  const resetChat = () => {
    if (window.confirm("¿Querés reiniciar el chat? Kitty olvidara los ultimos dialogos 😺")) {
      setMessages(INITIAL_MSG);
      localStorage.removeItem('kitty_history');
    }
  };

// --- FUNCIÓN SORPRESA (INSTRUCCIÓN OCULTA) ---
  const handleSurprise = async () => {
    setLoading(true);

    // 1. La Instrucción Secreta (Lo que la IA lee)
    // Le damos opciones específicas para que no se repita
    const hiddenPrompt = "IMPORTANTE: Ignora mi último mensaje normal. Quiero jugar o reírme. Elige UNA de estas opciones al azar: 1) Cuéntame un dato curioso sobre gatos o Japón. 2) Cuéntame un chiste corto. 3) Propón un juego rápido de adivinanzas. 4) Cuenta una anécdota graciosa ficticia sobre Antonio y Sofía. Sé breve y muy kawaii.";

    // 2. Preparamos el historial para la API
    // Agregamos el prompt secreto AL FINAL del historial actual
    const apiHistory = [...messages, { role: 'user', content: hiddenPrompt }];

    // 3. Llamamos a Groq con el historial "trucado"
    const replyText = await getGroqResponse(apiHistory);

    // 4. Elegimos sonido (Opción festiva)
    playSound('miaumiaumiau.mp3'); 

    // 5. Actualizamos la pantalla (Lo que el usuario ve)
    // En lugar de mostrar el texto largo, mostramos solo una varita mágica '✨'
    // Y guardamos la respuesta de la IA.
    setMessages(prev => [
      ...prev, 
      { role: 'user', content: '✨ Sorpréndeme ✨' }, 
      { role: 'assistant', content: replyText }
    ]);

    setLoading(false);
  };

  return (
    <div className="flex flex-col md:flex-row h-screen w-full bg-[#ffcce6] relative overflow-hidden">
        
        <div className="absolute inset-0 z-0 opacity-10 pointer-events-none" 
            style={{backgroundImage: `radial-gradient(circle, #ff77a8 1px, transparent 1px)`, backgroundSize: '4px 4px'}}>
        </div>

      {/* ZONA 1: AVATAR */}
      <div className="w-full h-[40%] md:w-1/2 md:h-full relative z-10 bg-gradient-to-b from-transparent to-[#ffcce6]/50">
        <Canvas camera={{ position: [0, 1, 4], fov: 50 }}>
          <ambientLight intensity={1} color={"#ffe6f2"} />
          <directionalLight position={[5, 5, 5]} intensity={1.5} color={"#fff0f5"} />
          <spotLight position={[-2, 5, 2]} angle={0.3} intensity={1} castShadow color={"#ff99cc"} />
          <ContactShadows opacity={1} scale={15} blur={3} far={4} resolution={256} position={[0, -1.52, 0]} color="#ff77a8" />
          <Avatar3D />
          <OrbitControls enableZoom={true} maxPolarAngle={Math.PI / 1} minDistance={3} maxDistance={10}/>
        </Canvas>
      </div>

      {/* ZONA 2: CHAT */}
      <div className="w-full h-[60%] md:w-1/2 md:h-full flex items-center justify-center p-2 md:p-6 z-20 pb-safe">
        
        <div className="w-full max-w-xl h-full md:h-[85%] flex flex-col pixel-box-white relative shadow-xl">
          
          {/* HEADER */}
          <div className="p-2 md:p-3 flex justify-between items-center pixel-box-pink relative">
            <div className="w-8"></div> 
            <div className="text-xl md:text-2xl font-bold tracking-widest">
              💖 KITTY CHAT 💖
            </div>
            <button 
              onClick={resetChat}
              className="bg-white hover:bg-red-100 border-2 border-black w-8 h-8 flex items-center justify-center text-sm shadow-[2px_2px_0px_0px_black] active:translate-y-1 active:shadow-none transition-all"
              title="Borrar memoria"
            >
              🗑️
            </button>
          </div>
          
           <div className="absolute top-1 left-1 w-2 h-2 bg-white z-30 pointer-events-none"></div>
           <div className="absolute top-1 right-1 w-2 h-2 bg-white z-30 pointer-events-none"></div>

          {/* MENSAJES */}
          <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-2 md:p-4 space-y-4 bg-white bg-opacity-90">
            {messages.filter(m => m.role !== 'system').map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                 <div 
                    className={`p-2 md:p-3 max-w-[85%] text-lg md:text-xl border-4 ${
                    msg.role === 'user' 
                      ? 'bg-black text-white border-black shadow-[2px_2px_0px_0px_#ff77a8]' 
                      : 'bg-[#ff99cc] text-black border-black shadow-[2px_2px_0px_0px_black]'
                  }`}
                >
                  <p className={`text-[10px] md:text-xs mb-1 tracking-wider ${msg.role === 'user' ? 'text-pink-300' : 'text-black opacity-60'}`}>
                    {msg.role === 'user' ? '► TÚ' : '🐱 KITTY AI'}
                  </p>
                  <p className="leading-tight">{msg.content}</p>
                </div>
              </div>
            ))}
             
             {loading && (
                <div className="text-black text-base md:text-lg animate-pulse pl-2">
                  🐱 Pensando...
                </div>
             )}
          </div>

          {/* INPUT AREA */}
          <div className="p-2 md:p-3 bg-black border-t-4 border-black flex gap-2 relative">
            
            <button 
              onClick={handleSurprise}
              disabled={loading}
              className="pixel-button w-10 md:w-12 flex items-center justify-center text-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50"
              title="¡Sorpréndeme!"
            >
              ✨
            </button>

            <input 
              className="flex-1 p-2 pixel-input text-lg md:text-xl min-w-0"
              placeholder="Escribe aquí..."
              value={input}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              onChange={(e) => setInput(e.target.value)}
            />
            
            <button 
              onClick={() => handleSend()}
              disabled={loading}
              className="pixel-button px-3 md:px-5 py-2 text-lg md:text-xl font-bold disabled:opacity-50 whitespace-nowrap"
            >
              ▶
            </button>

             <div className="absolute bottom-1 left-1 w-2 h-2 bg-white z-30 pointer-events-none"></div>
             <div className="absolute bottom-1 right-1 w-2 h-2 bg-white z-30 pointer-events-none"></div>
          </div>
        </div>
      </div>
    </div>
  );
}