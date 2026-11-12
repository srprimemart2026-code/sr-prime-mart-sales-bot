document.addEventListener("DOMContentLoaded", () => {
  const botEnabled = document.getElementById("botEnabled");
  const apiKey = document.getElementById("apiKey");
  const shopInfo = document.getElementById("shopInfo");
  const saveBtn = document.getElementById("saveBtn");
  const status = document.getElementById("status");

  // আগে সেভ করা তথ্য লোড করা
  chrome.storage.local.get(["botEnabled", "apiKey", "shopInfo"], (data) => {
    if (data.botEnabled !== undefined) botEnabled.checked = data.botEnabled;
    if (data.apiKey) apiKey.value = data.apiKey;
    if (data.shopInfo) shopInfo.value = data.shopInfo;
  });

  // সেভ বাটনে ক্লিক করলে তথ্য সংরক্ষণ
  saveBtn.addEventListener("click", () => {
    chrome.storage.local.set(
      {
        botEnabled: botEnabled.checked,
        apiKey: apiKey.value.trim(),
        shopInfo: shopInfo.value.trim()
      },
      () => {
        status.textContent = "সেটিংস সেভ হয়েছে! ফেসবুক ট্যাব রিফ্রেশ করুন।";
        setTimeout(() => (status.textContent = ""), 3000);
      }
    );
  });
});
