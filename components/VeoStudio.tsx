import React, { useState } from 'react';
import { generateVeoVideo } from '../services/geminiService';
import { Loader2, X, Clapperboard, Download } from 'lucide-react';

interface VeoStudioProps {
  initialImage?: string; // Base64
  onClose: () => void;
}

export const VeoStudio: React.FC<VeoStudioProps> = ({ initialImage, onClose }) => {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedVideo, setGeneratedVideo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState('');

  const handleGenerate = async () => {
    if (!initialImage) return;
    setIsGenerating(true);
    setError(null);
    setStatus('Initializing Veo...');
    
    try {
      setStatus('Generating video... (This may take a minute)');
      const videoUrl = await generateVeoVideo(prompt, initialImage, '16:9');
      setGeneratedVideo(videoUrl);
    } catch (err: any) {
      setError(err.message || "Failed to generate video");
    } finally {
      setIsGenerating(false);
      setStatus('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <div className="flex items-center gap-2 text-purple-700">
            <Clapperboard size={24} />
            <h2 className="font-bold text-lg">Veo Video Studio</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full text-gray-500">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          {initialImage && (
            <div className="mb-6 flex justify-center bg-gray-100 rounded-lg p-2">
              <img 
                src={`data:image/png;base64,${initialImage}`} 
                alt="Source" 
                className="h-48 object-contain rounded-md" 
              />
            </div>
          )}

          {!generatedVideo ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Prompt (Optional)</label>
                <input
                  type="text"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="E.g., A cinematic pan of the landscape..."
                  className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
                />
              </div>

              <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg text-sm text-yellow-800">
                 Note: This feature uses the paid <strong>veo-3.1-fast-generate-preview</strong> model. You will be asked to select a billing project if you haven't already.
              </div>
              
              <button
                onClick={handleGenerate}
                disabled={isGenerating}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 rounded-lg flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isGenerating ? <Loader2 className="animate-spin" /> : <Clapperboard size={20} />}
                {isGenerating ? status : 'Generate Video'}
              </button>

              {error && (
                <div className="text-red-600 text-sm bg-red-50 p-3 rounded-lg border border-red-100">
                  {error}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="aspect-video bg-black rounded-lg overflow-hidden relative shadow-lg">
                <video 
                  src={generatedVideo} 
                  controls 
                  autoPlay 
                  loop
                  className="w-full h-full"
                />
              </div>
              <div className="flex gap-2">
                  <a 
                    href={generatedVideo} 
                    download="veo-generation.mp4"
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 bg-gray-900 text-white py-3 rounded-lg font-medium flex items-center justify-center gap-2 hover:bg-black"
                  >
                    <Download size={18} /> Download
                  </a>
                  <button
                    onClick={() => setGeneratedVideo(null)}
                    className="flex-1 border border-gray-300 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-50"
                  >
                    Create Another
                  </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};