chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type !== 'chat') return;

  // We return true to keep the channel open
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 150000); // 150s timeout

  fetch(request.url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request.body),
    signal: controller.signal
  })
  .then(async (response) => {
    clearTimeout(timeoutId);
    const text = await response.text();
    if (!response.ok) throw new Error(`Ollama Error ${response.status}: ${text}`);
    return JSON.parse(text);
  })
  .then(data => {
    // Check if the port is still open before sending
    sendResponse({ data });
  })
  .catch(err => {
    console.error("Background Fetch Error:", err);
    sendResponse({ error: err.message });
  });

  return true; 
});