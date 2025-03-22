import axios from 'axios';

export default async function handler(req, res) {
  const { text, apiProvider, apiKey } = req.body;

  try {
    let translated;

    if (apiProvider === 'deepl') {
      // 無料版は必ず api-free.deepl.com
      const params = new URLSearchParams();
      params.append('auth_key', apiKey);
      params.append('text', text);
      params.append('target_lang', 'JA');

      const deeplRes = await axios.post('https://api-free.deepl.com/v2/translate', params, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      });

      translated = deeplRes.data.translations[0].text;
    }

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
