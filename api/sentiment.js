export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(400).json({ error: 'API key not configured on Vercel' });
  const { instrument } = req.body;
  if (!instrument) return res.status(400).json({ error: 'Missing instrument' });
  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        tools: [{ type: 'web_search_20250305', name: 'web_search' }],
        system: 'You are a trading analyst. Search for the latest social media sentiment, retail trader positioning data, and analyst opinions. Be concise and specific.',
        messages: [{
          role: 'user',
          content: `Search for the latest trader sentiment, positioning data and analysis about ${instrument} from the last 24-48 hours.

Search for: "${instrument} trader sentiment", "${instrument} long short ratio", "${instrument} retail positioning", "${instrument} analysis today"

Respond in this exact format:
SENTIMENT: [Bullish / Bearish / Mixed]
POSITIONING: Longs [X]% · Shorts [Y]% (find actual COT, broker sentiment, or exchange data if available — estimate if not)
COMMUNITY BIAS: [1-2 sentences on overall mood]
KEY OPINIONS: 
• [opinion 1]
• [opinion 2]
• [opinion 3]
NOTABLE RISKS: [what traders are warning about]`
        }]
      })
    });
    const data = await response.json();
    const text = (data.content || []).filter(b => b.type === 'text').map(b => b.text).join('\n') || 'No data found.';
    res.json({ sentiment: text });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
