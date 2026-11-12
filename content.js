let lastProcessedMessage = "";
let isProcessing = false;

console.log("S.R. PRIME MART AI Bot Active & Monitoring Inbox...");

// Gemini AI থেকে স্মার্ট উত্তর আনা
async function getAIReply(customerText, apiKey, shopInfo) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

  const prompt = `তুমি "S.R. PRIME MART"-এর একজন দক্ষ এবং ভদ্র কাস্টমার সাপোর্ট প্রতিনিধি। 
নিচের শপের তথ্যের ওপর ভিত্তি করে কাস্টমারের মেসেজের উত্তর দাও। উত্তরটি যেন স্বাভাবিক মানুষের মতো, সংক্ষিপ্ত (২-৩ লাইনের মধ্যে) এবং প্রাণবন্ত হয়।

শপের তথ্য:
${shopInfo}

কাস্টমারের মেসেজ: "${customerText}"

তোমার উত্তর:`;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
    });

    const data = await response.json();
    if (data.candidates && data.candidates[0]?.content?.parts[0]?.text) {
      return data.candidates[0].content.parts[0].text.trim();
    }
    return null;
  } catch (error) {
    console.error("AI Error:", error);
    return null;
  }
}

// ফেসবুকের মেসেজ বক্সে টেক্সট টাইপ করে সেন্ড করা
function sendMessageToFacebook(replyText) {
  const inputBox = document.querySelector('div[role="textbox"][contenteditable="true"]');
  if (!inputBox) return false;

  inputBox.focus();
  document.execCommand("insertText", false, replyText);

  setTimeout(() => {
    const enterEvent = new KeyboardEvent("keydown", {
      bubbles: true,
      cancelable: true,
      keyCode: 13,
      which: 13,
      key: "Enter"
    });
    inputBox.dispatchEvent(enterEvent);
  }, 600);

  return true;
}

// প্রতি ৩ সেকেন্ড পরপর ইনবক্সের সর্বশেষ মেসেজ চেক করা
setInterval(async () => {
  if (isProcessing) return;

  chrome.storage.local.get(["botEnabled", "apiKey", "shopInfo"], async (config) => {
    if (!config.botEnabled || !config.apiKey) return;

    const messageElements = document.querySelectorAll('div[dir="auto"]');
    if (messageElements.length === 0) return;

    const latestEl = messageElements[messageElements.length - 1];
    const currentText = latestEl.innerText?.trim();

    if (!currentText || currentText === lastProcessedMessage) return;

    // নিজের পাঠানো মেসেজে যেন রিপ্লাই না দেয়
    const parentRow = latestEl.closest('[role="row"]');
    if (parentRow && parentRow.innerText.includes("You sent")) return;

    isProcessing = true;
    lastProcessedMessage = currentText;

    console.log("নতুন কাস্টমার মেসেজ:", currentText);

    const aiReply = await getAIReply(currentText, config.apiKey, config.shopInfo);
    if (aiReply) {
      lastProcessedMessage = aiReply;
      sendMessageToFacebook(aiReply);
      console.log("অটো রিপ্লাই পাঠানো হয়েছে:", aiReply);
    }

    setTimeout(() => {
      isProcessing = false;
    }, 3000);
  });
}, 3000);
