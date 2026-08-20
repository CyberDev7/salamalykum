// api/tts.js
const { EdgeTTS } = require('@andresaya/edge-tts');

function toTurkishSafeText(text) {
  return text
    .replace(/ý/g, '\x01')
    .replace(/y/g, 'ı')
    .replace(/\x01/g, 'y')
    .replace(/ň/g, 'n')
    .replace(/ž/g, 'j')
    .replace(/w/g, 'u')
    .replace(/ä/g, 'e');
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') { res.status(200).end(); return; }
  if (req.method !== 'POST') { res.status(405).json({ error: 'Use POST' }); return; }

  try {
    const { text } = req.body || {};
    if (!text || typeof text !== 'string') {
      res.status(400).json({ error: 'No text provided' });
      return;
    }
    if (text.length > 200) {
      res.status(400).json({ error: 'Text too long' });
      return;
    }

    const safeText = toTurkishSafeText(text);

    const tts = new EdgeTTS();
    await tts.synthesize(safeText, 'tr-TR-AhmetNeural', { rate: '-10%' });
    const audioBuffer = tts.toBuffer();

    res.setHeader('Content-Type', 'audio/mpeg');
    res.status(200).send(audioBuffer);
  } catch (err) {
    console.error('TTS failed:', err);
    res.status(500).json({ error: 'TTS failed', detail: String(err && err.message || err) });
  }
};
