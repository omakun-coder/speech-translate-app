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
  const [isRecognizing, setIsRecognizing] = useState(false);

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
            .catch(() => {
              alert('APIキーが無効です。再入力してください。');
              setShowApiKeyInput(true);
            });

          const remaining = interim.replace(completeSentences, '');
          setBufferText(remaining);
        }
      }
    };

    recognitionRef.current.onend = () => {
      if (isRecognizing) recognitionRef.current.start();
    };

    return () => recognitionRef.current.stop();
  }, [apiKey, apiProvider, isRecognizing]);

  const startRecognition = () => {
    if (recognitionRef.current && !isRecognizing) {
      recognitionRef.current.start();
      setIsRecognizing(true);
    }
  };

  const stopRecognition = () => {
    if (recognitionRef.current && isRecognizing) {
      recognitionRef.current.stop();
      setIsRecognizing(false);
    }
  };

  const saveApiKey = () => {
    localStorage.setItem('apiKey', apiKey);
    localStorage.setItem('apiProvider', apiProvider);
    setShowApiKeyInput(false);
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-8 space-y-8">
      <h1 className="text-3xl font-bold">リアルタイム音声翻訳</h1>

      {showApiKeyInput && (
        <div className="bg-gray-800 border border-white rounded-xl p-4 w-full max-w-md flex flex-col items-start space-y-4">
          <label className="font-semibold">翻訳APIの選択:</label>
          <select value={apiProvider} onChange={e => setApiProvider(e.target.value)} className="border p-2 rounded-md w-full text-black">
            <option value="deepl">DeepL</option>
            <option value="microsoft">Microsoft Translator</option>
            <option value="lingva">Lingva Translate</option>
          </select>

          <label className="font-semibold">APIキー:</label>
          <input
            type="text"
            placeholder="APIキーを入力"
            value={apiKey}
            onChange={e => setApiKey(e.target.value)}
            className="border p-2 rounded-md w-full text-black"
          />
          <button onClick={saveApiKey} className="bg-blue-500 text-white px-4 py-2 rounded-md self-center">保存</button>
        </div>
      )}

      <div className="flex gap-4">
        <button onClick={startRecognition} disabled={isRecognizing} className="bg-green-500 text-white px-6 py-3 rounded-md">翻訳開始</button>
        <button onClick={stopRecognition} disabled={!isRecognizing} className="bg-red-500 text-white px-6 py-3 rounded-md">翻訳終了</button>
      </div>

      <div className="w-full max-w-3xl space-y-6">
        <div className="bg-black border border-white rounded-xl p-4 h-60 overflow-auto flex flex-col justify-between">
          <h3 className="text-xl font-semibold mb-2">原文（英語）</h3>
          <p className="whitespace-pre-wrap text-gray-300">{originalLog}</p>
        </div>

        <div className="bg-black border border-white rounded-xl p-4 h-60 overflow-auto flex flex-col justify-between">
          <h3 className="text-xl font-semibold mb-2">翻訳文（日本語）</h3>
          <p className="whitespace-pre-wrap text-gray-300">{translatedLog}</p>
        </div>
      </div>
    </div>
  );
}
