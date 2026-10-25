// netlify/functions/tts.js
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

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type'
};
const JSON_HEADERS = { ...CORS, 'Content-Type': 'application/json' };

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers: CORS, body: '' };
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: JSON_HEADERS, body: JSON.stringify({ error: 'Use POST' }) };
  }
  try {
    const raw = event.isBase64Encoded
      ? Buffer.from(event.body || '', 'base64').toString('utf8')
      : (event.body || '');
    let text;
    try { text = JSON.parse(raw || '{}').text; } catch (e) { text = undefined; }
    if (!text || typeof text !== 'string') {
      return { statusCode: 400, headers: JSON_HEADERS, body: JSON.stringify({ error: 'No text provided' }) };
    }
    if (text.length > 200) {
      return { statusCode: 400, headers: JSON_HEADERS, body: JSON.stringify({ error: 'Text too long' }) };
    }
    const tts = new EdgeTTS();
    await tts.synthesize(toTurkishSafeText(text), 'tr-TR-AhmetNeural', { rate: '-10%' });
    const audio = Buffer.from(tts.toBuffer());
    return {
      statusCode: 200,
      headers: { ...CORS, 'Content-Type': 'audio/mpeg' },
      body: audio.toString('base64'),
      isBase64Encoded: true
    };
  } catch (err) {
    console.error('TTS failed:', err);
    return {
      statusCode: 500,
      headers: JSON_HEADERS,
      body: JSON.stringify({ error: 'TTS failed', detail: String((err && err.message) || err) })
    };
  }
};
