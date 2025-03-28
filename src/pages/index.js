import { useEffect, useState, useRef } from 'react';
import axios from 'axios';

export default function Home() {
  const [bufferText, setBufferText] = useState('');
  const [originalLog, setOriginalLog] = useState('');
  const [translatedLog, setTranslatedLog] = useState('');
  const recognitionRef = useRef(null);
  const [apiKey, setApiKey] = useState(typeof window !== 'undefined' ? localStorage.getItem('apiKey') || '' : '');
  const [apiProvider, setApiProvider] = useState(typeof window !== 'undefined' ? localStorage.getItem('apiProvider') || 'deepl' : '');
  const [showApiKeyInput, setShowApiKeyInput] = useState(false);

  useEffect(() => {
    if (!apiKey) setShowApiKeyInput(true);

    recognitionRef.current = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
    recognitionRef.current.continuous = true;
    recognitionRef.current.lang = 'en-US';
    recognitionRef.current.interimResults = true;

    recognitionRef.current.onresult = (event) => {
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        interim += event.results[i][0].transcript;
      }

      setBufferText(interim);

      if (/\./.test(interim)) {
        const matches = interim.match(/.*?\./g);
        const completeSentences = matches ? matches.join(' ') : '';

        if (completeSentences) {
          setOriginalLog(prev => prev + ' ' + completeSentences);

          axios.post('/api/translate', { text: completeSentences, apiProvider, apiKey })
            .then(res => setTranslatedLog(prev => prev + ' ' + res.data.translated))
            .catch(err => {
              alert('APIキーが無効です。再入力してください。');
              setShowApiKeyInput(true);
            });

          setBufferText(interim.replace(completeSentences, ''));
        }
      }
    };

    recognitionRef.current.start();

    return () => recognitionRef.current.stop();
  }, [apiKey, apiProvider]);

  const saveApiKey = () => {
    localStorage.setItem('apiKey', apiKey);
    localStorage.setItem('apiProvider', apiProvider);
    setShowApiKeyInput(false);
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-start p-6">
      <h1 className="text-3xl font-bold mb-6">Real-time Speech Translation</h1>

      {showApiKeyInput && (
        <div className="bg-white shadow-md rounded-xl p-4 mb-6 w-full max-w-md flex flex-col items-start">
          <label className="mb-2 font-semibold">Select Translation API:</label>
          <select value={apiProvider} onChange={e => setApiProvider(e.target.value)} className="border p-2 rounded-md mb-4 w-full">
            <option value="deepl">DeepL</option>
            <option value="microsoft">Microsoft Translator</option>
            <option value="lingva">Lingva Translate</option>
          </select>

          <label className="mb-2 font-semibold">API Key:</label>
          <input
            type="text"
            placeholder="Enter API Key"
            value={apiKey}
            onChange={e => setApiKey(e.target.value)}
            className="border p-2 rounded-md mb-4 w-full"
          />
          <button onClick={saveApiKey} className="bg-blue-500 text-white px-4 py-2 rounded-md self-center">Save</button>
        </div>
      )}

      <div className="w-full max-w-3xl grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white shadow-md rounded-xl p-4 h-96 overflow-auto">
          <h3 className="text-xl font-semibold mb-2">Original English Log</h3>
          <p className="whitespace-pre-wrap text-gray-800">{originalLog}</p>
        </div>

        <div className="bg-white shadow-md rounded-xl p-4 h-96 overflow-auto">
          <h3 className="text-xl font-semibold mb-2">Translated Japanese Log</h3>
          <p className="whitespace-pre-wrap text-gray-800">{translatedLog}</p>
        </div>
      </div>

      <div className="bg-yellow-100 shadow-md rounded-xl p-4 mt-6 w-full max-w-3xl">
        <h4 className="text-lg font-semibold mb-2">Listening Buffer</h4>
        <p className="whitespace-pre-wrap text-gray-700">{bufferText}</p>
      </div>
    </div>
  );
}
