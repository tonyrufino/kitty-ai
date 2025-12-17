import React, { useState, useRef, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, useGLTF, Environment, ContactShadows } from '@react-three/drei';
import { getGroqResponse } from './services/groq';
import { useAnimations } from '@react-three/drei'; // <--- Añade useAnimations aquí
// --- COMPONENTE AVATAR (Intacto) ---
function Avatar3D() {
  const group = useRef();
  
  // 1. Extraemos también 'animations' del archivo
  const { scene, animations } = useGLTF('/kitty.glb');
  
  // 2. Preparamos el sistema de animación vinculado al grupo (ref)
  const { actions, names } = useAnimations(animations, group);

  // 3. Efecto para reproducir la animación al cargar
  useEffect(() => {
    // Imprimimos los nombres en la consola (F12) para que sepas cómo se llaman
    console.log("Nombres de animaciones encontradas:", names);

    // Si hay animaciones, reproducimos la primera que encuentre
    if (names.length > 0) {
      actions[names[0]].reset().fadeIn(0.5).play();
    }
    
    // Opcional: Si sabes el nombre exacto (ej: "Idle"), usa esto:
    // actions["Idle"]?.reset().fadeIn(0.5).play();

  }, [actions, names]);

  return (
    // Es importante envolver el modelo en un group con la referencia
    <group ref={group} position={[0, -2, 0]} scale={0.8}>
      <primitive object={scene} />
    </group>
  );
}

// --- APP PRINCIPAL ---
export default function App() {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const chatContainerRef = useRef(null);
  
  // Historial y Personalidad (Ajustada a "amigable")
  const [messages, setMessages] = useState([
    { role: 'system', content: 'Eres hello kitty, adorable, amigable y muy tierno. Escribes un poco como Argentino . Usas emojis kawaii como 😺, 💖, ✨. Tus respuestas son alegres, ironicas, contundentes. Tu creador es Antonio, fuiste creada para ayudar, acompañar y entretener a Sofia (La novia de Antonio)' },
    { role: 'assistant', content: '¡Holaaa Sofi1! 😺💖 ¡Vamos a jugar, a reír y a hacer cosas divertidas juntas! ✨' }
  ]);

  // Auto-scroll hacia abajo cuando llega un mensaje nuevo
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg = { role: 'user', content: input };
    const newHistory = [...messages, userMsg];
    
    setMessages(newHistory);
    setInput('');
    setLoading(true);

    // Llamamos a Groq
    const replyText = await getGroqResponse(newHistory);

    setMessages(prev => [...prev, { role: 'assistant', content: replyText }]);
    setLoading(false);
  };

  return (
    // CONTENEDOR PRINCIPAL - Fondo rosa con patrón retro
    <div className="flex h-screen w-full bg-[#ffcce6] relative overflow-hidden">
        
        {/* Patrón de fondo sutil (dithering) */}
        <div className="absolute inset-0 z-0 opacity-10 pointer-events-none" 
             style={{backgroundImage: `radial-gradient(circle, #ff77a8 1px, transparent 1px)`, backgroundSize: '4px 4px'}}>
        </div>

      {/* ZONA IZQUIERDA: AVATAR 3D (50% ancho) */}
      <div className="w-1/2 h-full relative z-10">
        <Canvas camera={{ position: [0, 1, 4], fov: 50 }}>
          {/* Iluminación cálida y suave */}
          <ambientLight intensity={1} color={"#ffe6f2"} />
          <directionalLight position={[5, 5, 5]} intensity={1.5} color={"#fff0f5"} />
          <spotLight position={[-2, 5, 2]} angle={0.3} intensity={1} castShadow color={"#ff99cc"} />
          
          {/* Sombra suave en el suelo */}
          <ContactShadows opacity={0.8} scale={10} blur={3} far={4} resolution={256} position={[0, -2, 0]} color="#ff77a8" />
          
          <Avatar3D />
          {/* Limitamos el movimiento para que no rompa la estética */}
          <OrbitControls enableZoom={true} maxPolarAngle={Math.PI / 1} minDistance={5} maxDistance={10}/>
        </Canvas>
      </div>

      {/* ZONA DERECHA: CHAT (50% ancho, flotando sobre el fondo) */}
      <div className="w-1/2 h-full flex items-center justify-center p-6 z-20">
        
        {/* --- LA CAJA DE CHAT RETRO --- */}
        <div className="w-full max-w-xl h-[85%] flex flex-col pixel-box-white relative">
          
          {/* Header Rosado */}
          <div className="p-3 text-center text-2xl font-bold tracking-widest pixel-box-pink">
            💖 KITTY CHAT 💖
          </div>
           {/* Decoración de esquinas del header */}
           <div className="absolute top-1 left-1 w-2 h-2 bg-white z-30"></div>
           <div className="absolute top-1 right-1 w-2 h-2 bg-white z-30"></div>


          {/* Área de Mensajes */}
          <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-white bg-opacity-90">
            {messages.filter(m => m.role !== 'system').map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                 
                 {/* Burbujas de chat cuadradas */}
                 <div 
                    className={`p-3 max-w-[80%] text-xl border-4 ${
                    msg.role === 'user' 
                      // Usuario: Negro con texto blanco
                      ? 'bg-black text-white border-black shadow-[2px_2px_0px_0px_#ff77a8]' 
                      // Avatar: Rosa con texto negro
                      : 'bg-[#ff99cc] text-black border-black shadow-[2px_2px_0px_0px_black]'
                  }`}
                >
                  {/* Etiqueta pequeña encima del mensaje */}
                  <p className={`text-xs mb-1 tracking-wider ${msg.role === 'user' ? 'text-pink-300' : 'text-black opacity-60'}`}>
                    {msg.role === 'user' ? '► TÚ' : '🐱 KITTY AI'}
                  </p>
                  <p className="leading-tight">{msg.content}</p>
                </div>
              </div>
            ))}
             
             {/* Indicador de "Escribiendo..." */}
             {loading && (
                <div className="text-black text-lg animate-pulse pl-2">
                  🐱 Escribiendo...
                </div>
             )}
          </div>

          {/* Área de Input (Barra inferior negra) */}
          <div className="p-3 bg-black border-t-4 border-black flex gap-2 relative">
            <input 
              className="flex-1 p-2 pixel-input text-xl"
              placeholder="Di algo bonito..."
              value={input}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              onChange={(e) => setInput(e.target.value)}
            />
            <button 
              onClick={handleSend}
              disabled={loading}
              className="pixel-button px-6 py-2 text-xl font-bold disabled:opacity-50"
            >
              ENVIAR 
            </button>
             {/* Decoración de esquinas del footer */}
             <div className="absolute bottom-1 left-1 w-2 h-2 bg-white z-30 pointer-events-none"></div>
             <div className="absolute bottom-1 right-1 w-2 h-2 bg-white z-30 pointer-events-none"></div>
          </div>
        </div>
      </div>
    </div>
  );
}