import React, { useState } from 'react';
import { Sparkles, Image as ImageIcon, Loader2, Download } from 'lucide-react';
import { clsx } from 'clsx';

function App() {
  const [prompt, setPrompt] = useState('');
  const [generatedImage, setGeneratedImage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const generateImage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    setLoading(true);
    setError('');
    setGeneratedImage('');

    try {
      console.log('Starting direct Cloudflare API request...');
      const response = await fetch(
        `https://api.cloudflare.com/client/v4/accounts/${import.meta.env.VITE_CLOUDFLARE_ACCOUNT_ID}/ai/run/@cf/black-forest-labs/flux-1-schnell`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_CLOUDFLARE_API_TOKEN}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ prompt })
        }
      );

      console.log('Cloudflare Response:', {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries())
      });

      const data = await response.json();
      console.log('Cloudflare Data:', JSON.stringify(data, null, 2));

      if (!response.ok || !data.success) {
        throw new Error(`Cloudflare API error: ${data.errors?.[0]?.message || response.statusText}`);
      }

      if (!data.result?.image) {
        throw new Error('No image data received from the server');
      }

      setGeneratedImage(`data:image/jpeg;base64,${data.result.image}`);
    } catch (err) {
      const errorDetails = {
        message: err instanceof Error ? err.message : 'An unexpected error occurred',
        stack: err instanceof Error ? err.stack : undefined,
        raw: err
      };
      console.error('Detailed Error:', errorDetails);
      setError(errorDetails.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (!generatedImage) return;
    
    // Create a temporary link element
    const link = document.createElement('a');
    link.href = generatedImage;
    link.download = `ai-generated-${Date.now()}.jpg`; // Generate unique filename
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-6xl font-bold flex items-center justify-center gap-4 mb-4">
            AI Image Generator
            <Sparkles className="w-8 h-8 text-yellow-400" />
          </h1>
          <p className="text-gray-400 text-lg">Create stunning images with Flux AI</p>
        </div>

        <div className="max-w-3xl mx-auto">
          <form onSubmit={generateImage} className="mb-8">
            <div className="flex gap-4">
              <input
                type="text"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe the image you want to generate..."
                className="flex-1 px-4 py-3 rounded-lg bg-gray-700 border border-gray-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none text-white placeholder-gray-400"
              />
              <button
                type="submit"
                disabled={loading || !prompt.trim()}
                className={clsx(
                  "px-6 py-3 rounded-lg font-semibold flex items-center gap-2",
                  loading ? "bg-gray-600 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"
                )}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <ImageIcon className="w-5 h-5" />
                    Generate
                  </>
                )}
              </button>
            </div>
          </form>

          <div className="space-y-4">
            {error && (
              <div className="bg-red-500/10 border border-red-500 text-red-500 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}
            
            {generatedImage && (
              <div className="bg-gray-800 p-4 rounded-lg">
                <div className="relative">
                  <img 
                    src={generatedImage} 
                    alt={prompt}
                    className="w-full h-auto rounded-lg shadow-lg"
                  />
                  <button
                    onClick={handleDownload}
                    className="absolute top-4 right-4 p-2 bg-gray-900/80 hover:bg-gray-900 rounded-lg transition-colors"
                    title="Download Image"
                  >
                    <Download className="w-5 h-5" />
                  </button>
                </div>
                <p className="mt-4 text-gray-400 text-sm">
                  Prompt: "{prompt}"
                </p>
              </div>
            )}

            {!generatedImage && !loading && !error && (
              <div className="bg-gray-800 p-8 rounded-lg text-center">
                <ImageIcon className="w-16 h-16 mx-auto mb-4 text-gray-600" />
                <p className="text-gray-400">
                  Your generated image will appear here
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
