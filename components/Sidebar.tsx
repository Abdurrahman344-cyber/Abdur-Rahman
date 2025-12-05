import React from 'react';
import { MessageSquare, Phone, User, Settings, CircleDashed } from 'lucide-react';
import { AppMode } from '../types';

interface SidebarProps {
  currentMode: AppMode;
  onModeChange: (mode: AppMode) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentMode, onModeChange }) => {
  return (
    <div className="w-[60px] md:w-[400px] flex flex-col border-r border-gray-200 bg-white h-full">
      {/* Header (Desktop Only) */}
      <div className="hidden md:flex items-center justify-between p-4 bg-whatsapp-sidebar border-b border-gray-200">
        <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center text-gray-600">
          <User size={24} />
        </div>
        <div className="flex gap-6 text-gray-500">
            <button><CircleDashed size={20} /></button>
            <button><MessageSquare size={20} /></button>
            <button><Settings size={20} /></button>
        </div>
      </div>

      {/* Chat List (Desktop - Static for demo) */}
      <div className="flex-1 overflow-y-auto hidden md:block">
        <div className="p-3">
            <div className="relative">
                <input 
                    type="text" 
                    placeholder="Search or start new chat" 
                    className="w-full bg-gray-100 rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-whatsapp"
                />
            </div>
        </div>
        
        {/* Active Chat Item */}
        <div 
            onClick={() => onModeChange(AppMode.Chat)}
            className={`flex items-center gap-3 p-3 cursor-pointer hover:bg-gray-50 ${currentMode === AppMode.Chat ? 'bg-gray-100' : ''}`}
        >
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold">
                AI
            </div>
            <div className="flex-1 border-b border-gray-100 pb-3">
                <div className="flex justify-between items-center mb-1">
                    <h3 className="font-medium text-gray-900">Gemini Assistant</h3>
                    <span className="text-xs text-whatsapp font-medium">12:30 PM</span>
                </div>
                <p className="text-sm text-gray-500 truncate">Ready to help you with anything!</p>
            </div>
        </div>

         {/* Call Action */}
         <div 
            onClick={() => onModeChange(AppMode.Live)}
            className="flex items-center gap-3 p-3 cursor-pointer hover:bg-gray-50"
        >
            <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                <Phone size={24} />
            </div>
            <div className="flex-1 border-b border-gray-100 pb-3">
                 <div className="flex justify-between items-center mb-1">
                    <h3 className="font-medium text-gray-900">Voice Call</h3>
                </div>
                <p className="text-sm text-gray-500 truncate">Start a real-time conversation</p>
            </div>
        </div>
      </div>

      {/* Mobile Nav */}
      <div className="md:hidden flex flex-col h-full bg-gray-50 items-center py-4 gap-6 border-r border-gray-200">
         <button onClick={() => onModeChange(AppMode.Chat)} className={`p-3 rounded-xl ${currentMode === AppMode.Chat ? 'bg-whatsapp/10 text-whatsapp' : 'text-gray-500'}`}>
            <MessageSquare size={24} />
         </button>
         <button onClick={() => onModeChange(AppMode.Live)} className={`p-3 rounded-xl ${currentMode === AppMode.Live ? 'bg-emerald-100 text-emerald-600' : 'text-gray-500'}`}>
            <Phone size={24} />
         </button>
      </div>
    </div>
  );
};