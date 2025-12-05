import React, { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { ChatWindow } from './components/ChatWindow';
import { LiveCall } from './components/LiveCall';
import { VeoStudio } from './components/VeoStudio';
import { AppMode, UserSettings } from './types';

function App() {
  const [mode, setMode] = useState<AppMode>(AppMode.Chat);
  const [veoImage, setVeoImage] = useState<string | null>(null);
  const [settings, setSettings] = useState<UserSettings>({
    useDeepThinking: false
  });

  const handleToggleThinking = () => {
    setSettings(prev => ({ ...prev, useDeepThinking: !prev.useDeepThinking }));
  };

  const handleOpenVeo = (image: string) => {
    setVeoImage(image);
  };

  const handleCloseVeo = () => {
    setVeoImage(null);
  };

  return (
    <div className="flex h-screen w-screen bg-gray-100 overflow-hidden font-sans">
      <div className="flex w-full max-w-[1600px] mx-auto h-full shadow-2xl bg-white relative">
        
        {/* Sidebar - Collapses on mobile */}
        <div className="flex-shrink-0 z-20 h-full">
           <Sidebar currentMode={mode} onModeChange={setMode} />
        </div>

        {/* Main Content Area */}
        <div className="flex-1 h-full relative">
            {mode === AppMode.Chat && (
                <ChatWindow 
                    settings={settings}
                    onToggleThinking={handleToggleThinking}
                    onOpenVeo={handleOpenVeo}
                />
            )}

            {/* Live Call Overlay */}
            {mode === AppMode.Live && (
                <LiveCall onEndCall={() => setMode(AppMode.Chat)} />
            )}

            {/* Veo Modal */}
            {veoImage && (
                <VeoStudio 
                    initialImage={veoImage} 
                    onClose={handleCloseVeo}
                />
            )}
        </div>
      </div>
    </div>
  );
}

export default App;