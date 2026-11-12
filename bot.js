const puppeteer = require('puppeteer');
const fetch = require('node-fetch');

// আপনার কপি করা Gemini API Key এখানে বসিয়ে দিন
const GEMINI_API_KEY = 'AQ.Ab8RN6LxOh86ANrE3LB6kX5r8OBTlZ6q0HToMvhPUiUZzUppUg';

// কাস্টমারের সাথে কথা বলার জন্য একদম ফ্রেন্ডলি এবং সেলস-ফোকাসড প্রম্পট
const SALES_PERSONA = `
তুমি "S.R. PRIME MART"-এর একজন অত্যন্ত বন্ধুভাবাপন্ন, বিশ্বস্ত এবং চতুর সেলস এক্সিকিউটিভ। 
তোমার কাজ হলো কাস্টমারের সাথে খুব সুন্দর, মিষ্টি ও চটপটে বাংলায় আড্ডার ছলে কথা বলা। 

আমাদের প্রধান পণ্য: Men's Bar Bracelet (প্রিমিয়াম কোয়ালিটি)। দাম: ৫৫০ টাকা মাত্র।
ডেলিভারি চার্জ: ঢাকার ভেতরে ৭০ টাকা, ঢাকার বাইরে ১৩০ টাকা। সারা বাংলাদেশে ক্যাশ অন ডেলিভারি।

কথা বলার স্টাইল:
1. কাস্টমারকে বন্ধু বা আপনজনের মতো সম্বোধন করবে (যেমন: "আসসালামু আলাইকুম ভাইয়া/আপু, কেমন আছেন?").
2. পণ্যের ভালো দিকগুলো সুন্দরভাবে বুঝিয়ে বলবে (যেমন: এটি হাতে পরলে লুক দারুণ জোস লাগে, লং-লাস্টিং কালার, কোনো সমস্যা হবে না)।
3. কাস্টমার দাম বেশি বা অন্য কিছু বললে বুদ্ধিমত্তার সাথে পণ্যের প্রিমিয়াম কোয়ালিটির মান বুঝিয়ে তার মন জয় করবে এবং পজিটিভ কনভেন্স করবে।
4. কাস্টমার রাজি হলে দ্রুত তার নাম, পূর্ণ ঠিকানা ও ফোন নম্বর চেয়ে অর্ডার কনফার্ম করে ফেলবে।
5. উত্তর সবসময় সংক্ষিপ্ত (২-৩ লাইনের মধ্যে) এবং স্বাভাবিক রাখবে যাতে মানুষ মনে করে।
`;

async function getFriendlySalesReply(customerText) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;
    
    const prompt = `${SALES_PERSONA}\n\nকাস্টমার বলেছে: "${customerText}"\n\nতোমার বন্ধুভাবাপন্ন সেলস উত্তর:`;

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

async function startSalesBot() {
    console.log("S.R. PRIME MART ফ্রেন্ডলি সেলস বট চালু হচ্ছে...");

    const browser = await puppeteer.launch({ 
        headless: false, 
        defaultViewport: null,
        args: ['--start-maximized']
    });

    const page = await browser.newPage();
    
    // সরাসরি ফেসবুক মেসেঞ্জার বা ইনবক্স ওপেন হবে
    await page.goto('https://www.messenger.com/', { waitUntil: 'networkidle2' });
    console.log("ব্রাউজারে আপনার ফেসবুক আইডি লগইন করুন এবং কাস্টমারের চ্যাট ওপেন করে রাখুন।");

    let lastProcessedMsg = "";

    // প্রতি ৪ সেকেন্ড পর পর চ্যাট চেক করবে
    setInterval(async () => {
        try {
            const customerMsg = await page.evaluate(() => {
                const messageElements = document.querySelectorAll('div[dir="auto"]');
                if (messageElements.length === 0) return null;
                return messageElements[messageElements.length - 1].innerText;
            });

            if (customerMsg && customerMsg !== lastProcessedMsg) {
                lastProcessedMsg = customerMsg;
                console.log("কাস্টমারের টেক্সট পাওয়া গেছে:", customerMsg);

                // AI থেকে ফ্রেন্ডলি এবং কনভেন্সিং উত্তর জেনারেট করা
                const aiReply = await getFriendlySalesReply(customerMsg);
                
                if (aiReply) {
                    console.log("বটের ফ্রেন্ডলি সেলস উত্তর:", aiReply);

                    const inputBox = document.querySelector('div[role="textbox"][contenteditable="true"]');
                    if (inputBox) {
                        inputBox.focus();
                        document.execCommand('insertText', false, aiReply);
                        
                        setTimeout(() => {
                            inputBox.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
                        }, 500);

                        lastProcessedMsg = aiReply; // নিজের উত্তর ট্র্যাক রাখা
                    }
                }
            }
        } catch (e) {
            // পেজ লোড বা অন্য চ্যাটে যাওয়ার সময় ছোট এরর ইগনোর করবে
        }
    }, 4000);
}

startSalesBot();
