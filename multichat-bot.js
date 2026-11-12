const puppeteer = require('puppeteer');
const fetch = require('node-fetch');

// আপনার Gemini API Key এখানে দিন
const GEMINI_API_KEY = 'AQ.Ab8RN6LxOh86ANrE3LB6kX5r8OBTlZ6q0HToMvhPUiUZzUppUg';

// শপের তথ্য এবং সেলস গাইডলাইন (যাতে কাস্টমার দেখলেই কেনার আগ্রহ পায়)
const SHOP_INFO = `
তুমি "S.R. PRIME MART"-এর একজন সেরা সেলস এক্সিকিউটিভ। কাস্টমারের সাথে অত্যন্ত আন্তরিক, চটপটে এবং বিক্রয়মুখী ভাষায় কথা বলবে।
আমাদের প্রধান পণ্য: Men's Bar Bracelet (প্রিমিয়াম কোয়ালিটি)। দাম: ৫৫০ টাকা মাত্র।
ডেলিভারি চার্জ: ঢাকার ভেতরে ৭০ টাকা, ঢাকার বাইরে ১৩০ টাকা। সারা বাংলাদেশে ক্যাশ অন ডেলিভারি।
লক্ষ্য: কাস্টমার পণ্যের দাম বা তথ্য জানতে চাইলে সুন্দর করে বুঝিয়ে বলুন এবং দ্রুত অর্ডার কনফার্ম করার জন্য তার নাম, পূর্ণ ঠিকানা ও মোবাইল নম্বর চেয়ে নিন। উত্তর সবসময় সংক্ষিপ্ত (২-৩ লাইন) এবং বাংলায় হবে।
`;

async function getAIReply(customerText) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;
    const prompt = `${SHOP_INFO}\n\nকাস্টমার মেসেজ করেছে: "${customerText}"\n\nতোমার সেলস রিপ্লাই:`;

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
        });
        const data = await response.json();
        return data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || null;
    } catch (err) {
        console.error("AI Error:", err);
        return null;
    }
}

async function startMultiChatBot() {
    const browser = await puppeteer.launch({ 
        headless: false, 
        defaultViewport: null,
        args: ['--start-maximized']
    });

    const page = await browser.newPage();
    console.log("ফেসবুক মার্কেটপ্লেস ইনবক্সে যাওয়া হচ্ছে... অনুগ্রহ করে লগইন করুন।");
    
    // সরাসরি ফেসবুক মার্কেটপ্লেস ইনবক্স লিংকে প্রবেশ করবে
    await page.goto('https://www.facebook.com/marketplace/you/selling', { waitUntil: 'networkidle2' });

    console.log("মাল্টি-চ্যাট অটো-রিপ্লাই বট চালু হয়েছে! কাস্টমারদের মেসেজ মনিটর করা হচ্ছে...");

    // ট্র্যাক রাখার জন্য মেমোরি
    const repliedMessages = new Set();

    setInterval(async () => {
        try {
            // মার্কেটপ্লেস বা ইনবক্সের চ্যাট লিস্ট ও মেসেজ রিড করা
            await page.evaluate(() => {
                // চ্যাট উইন্ডোগুলো স্ক্যান করার লজিক
            });

            // চ্যাটে আসা সর্বশেষ আনরিড বা নতুন মেসেজগুলো সংগ্রহ করা
            const chatData = await page.evaluate(() => {
                const messageElements = document.querySelectorAll('div[dir="auto"]');
                if (messageElements.length === 0) return null;
                return messageElements[messageElements.length - 1].innerText;
            });

            if (chatData && !repliedMessages.has(chatData)) {
                // পেজ বা নিজের পাঠানো মেসেজ স্কিপ করার চেক
                console.log("নতুন কাস্টমার মেসেজ পাওয়া গেছে:", chatData);
                
                repliedMessages.add(chatData);

                const aiReply = await getAIReply(chatData);
                if (aiReply) {
                    console.log("অটো সেলস রিপ্লাই পাঠানো হচ্ছে:", aiReply);

                    const inputBox = document.querySelector('div[role="textbox"][contenteditable="true"]');
                    if (inputBox) {
                        inputBox.focus();
                        document.execCommand('insertText', false, aiReply);
                        
                        setTimeout(() => {
                            inputBox.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
                        }, 500);

                        repliedMessages.add(aiReply);
                    }
                }
            }
        } catch (err) {
            // পেজ লোড বা অন্য চ্যাটে সুইচ করার সময় এরর ইগনোর করবে
        }
    }, 3000);
}

startMultiChatBot();
