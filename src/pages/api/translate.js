import axios from 'axios';

export default async function handler(req, res) {
  const { text, apiProvider, apiKey } = req.body;

  try {
    let translated;

    if (apiProvider === 'deepl') {
      const endpoint = apiKey.startsWith('free:') ? 'https://api-free.deepl.com/v2/translate' : 'https://api.deepl.com/v2/translate';

      const params = new URLSearchParams();
      params.append('auth_key', apiKey);
      params.append('text', text);
      params.append('target_lang', 'JA');

      const deeplRes = await axios.post(endpoint, params, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      });

      translated = deeplRes.data.translations[0].text;
    }

    // Microsoft Translator
    else if (apiProvider === 'microsoft') {
      const microsoftRes = await axios.post(
        'https://api.cognitive.microsofttranslator.com/translate?api-version=3.0&to=ja',
        [{ Text: text }],
        {
          headers: {
            'Ocp-Apim-Subscription-Key': apiKey,
            'Content-Type': 'application/json'
          }
        }
      );
      translated = microsoftRes.data[0].translations[0].text;
    }

    // Lingva Translate
    else if (apiProvider === 'lingva') {
      const lingvaRes = await axios.get(`https://lingva.ml/api/v1/en/ja/${encodeURIComponent(text)}`);
      translated = lingvaRes.data.translation;
    }

    res.status(200).json({ translated });

  } catch (error) {
    console.error(error.response?.data || error.message);
    res.status(401).json({ error: 'Invalid API key or API error' });
  }
}
