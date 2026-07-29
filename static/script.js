/* === TripMate AI — Frontend Logic === */
const chatArea = document.getElementById("chat-area");
const welcome = document.getElementById("welcome-screen");
const form = document.getElementById("travel-form");
const input = document.getElementById("user-input");
const sendBtn = document.getElementById("send-btn");
const sendIcon = sendBtn.querySelector(".send-icon");
const sendLoader = sendBtn.querySelector(".send-loader");
const charCount = document.getElementById("char-count");
const newChatBtn = document.getElementById("new-chat-btn");
const cards = document.querySelectorAll(".suggestion-card");

let threadId = null;
let busy = false;

/* --- Character counter --- */
input.addEventListener("input", () => {
    charCount.textContent = `${input.value.length}/500`;
});

/* --- Suggestion cards --- */
cards.forEach(c => c.addEventListener("click", () => {
    if (busy) return;
    input.value = c.dataset.query;
    charCount.textContent = `${input.value.length}/500`;
    send();
}));

/* --- New chat --- */
newChatBtn.addEventListener("click", () => {
    threadId = null;
    chatArea.innerHTML = "";
    welcome.style.display = "";
    welcome.style.opacity = "1";
    welcome.style.transform = "translateY(0)";
    input.value = "";
    charCount.textContent = "0/500";
});

/* --- Form --- */
form.addEventListener("submit", e => { e.preventDefault(); send(); });

/* --- Send --- */
async function send() {
    const msg = input.value.trim();
    if (!msg || busy) return;

    setLoading(true);
    hideWelcome();
    addUser(msg);
    input.value = "";
    charCount.textContent = "0/500";

    const typing = addTyping();

    try {
        const res = await fetch("/api/travel", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ message: msg, thread_id: threadId })
        });
        const data = await res.json();
        typing.remove();

        if (data.success) {
            threadId = data.thread_id;
            addAI(data);
        } else {
            addError(data.error || "Something went wrong.");
        }
    } catch (e) {
        typing.remove();
        addError("Network error. Check your connection.");
        console.error(e);
    } finally {
        setLoading(false);
        scroll();
    }
}

/* --- Helpers --- */
function setLoading(on) {
    busy = on;
    sendBtn.disabled = on;
    sendIcon.hidden = on;
    sendLoader.hidden = !on;
    input.disabled = on;
}

function hideWelcome() {
    if (!welcome) return;
    welcome.style.transition = "opacity .3s, transform .3s";
    welcome.style.opacity = "0";
    welcome.style.transform = "translateY(-8px)";
    setTimeout(() => welcome.style.display = "none", 300);
}

function scroll() {
    const m = document.getElementById("main-content");
    setTimeout(() => m.scrollTo({ top: m.scrollHeight, behavior: "smooth" }), 80);
}

function now() {
    return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

/* --- User message --- */
function addUser(text) {
    const d = document.createElement("div");
    d.className = "message message-user";
    d.innerHTML = `
        <div class="msg-avatar">You</div>
        <div class="msg-body">
            <div class="msg-meta"><span>${now()}</span></div>
            <div class="msg-bubble">${esc(text)}</div>
        </div>`;
    chatArea.appendChild(d);
    scroll();
}

/* --- AI response --- */
function addAI(data) {
    const d = document.createElement("div");
    d.className = "message message-ai";

    const sections = [];
    if (data.answer) sections.push(sec("✨", "Trip Summary", fmt(data.answer), true));
    if (data.flight_results) sections.push(sec("✈️", "Flight Information", fmt(data.flight_results), false));
    if (data.hotel_results) sections.push(sec("🏨", "Hotel Suggestions", fmt(data.hotel_results), false));
    if (data.itinerary) sections.push(sec("📅", "Day-by-Day Itinerary", fmt(data.itinerary), false));

    d.innerHTML = `
        <div class="msg-avatar">AI</div>
        <div class="msg-body">
            <div class="msg-meta"><span>TripMate AI</span><span>${now()}</span></div>
            <div class="msg-bubble">
                <div class="response-sections">${sections.join("")}</div>
                <div class="stats-row">
                    <span class="stat-chip">🤖 LLM Calls: <span class="stat-val">${data.llm_calls||0}</span></span>
                    <span class="stat-chip">🧵 Thread: <span class="stat-val">${data.thread_id?data.thread_id.slice(0,10)+"…":"—"}</span></span>
                </div>
            </div>
        </div>`;

    chatArea.appendChild(d);

    d.querySelectorAll(".sect-head").forEach(h => h.addEventListener("click", () => {
        const body = h.nextElementSibling;
        const chev = h.querySelector(".sect-chevron");
        body.classList.toggle("show");
        chev.classList.toggle("open");
    }));

    scroll();
}

function sec(icon, title, content, open) {
    return `<div class="resp-section">
        <div class="sect-head">
            <span class="sect-icon">${icon}</span>
            <span class="sect-title">${title}</span>
            <span class="sect-chevron ${open?"open":""}">▼</span>
        </div>
        <div class="sect-body ${open?"show":""}">${content}</div>
    </div>`;
}

/* --- Typing --- */
function addTyping() {
    const d = document.createElement("div");
    d.className = "typing-row";
    d.innerHTML = `
        <div class="msg-avatar" style="background:var(--grad);color:#fff;width:32px;height:32px;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:.7rem;font-weight:700">AI</div>
        <div class="typing-bubble">
            <div class="typing-dots"><span></span><span></span><span></span></div>
            <span class="typing-label">Planning your trip…</span>
        </div>`;
    chatArea.appendChild(d);
    scroll();
    return d;
}

/* --- Error --- */
function addError(text) {
    const d = document.createElement("div");
    d.className = "message message-ai";
    d.innerHTML = `
        <div class="msg-avatar" style="background:linear-gradient(135deg,#dc2626,#b91c1c)">!</div>
        <div class="msg-body">
            <div class="msg-meta"><span>Error</span><span>${now()}</span></div>
            <div class="msg-bubble" style="border-color:rgba(220,38,38,.25)">
                <strong style="color:#fca5a5">Something went wrong</strong><br/>${esc(text)}
            </div>
        </div>`;
    chatArea.appendChild(d);
    scroll();
}

/* --- Format (light markdown) --- */
function fmt(t) {
    if (!t) return "";
    let h = esc(t);
    h = h.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
    h = h.replace(/^### (.+)$/gm, "<h4>$1</h4>");
    h = h.replace(/^## (.+)$/gm, "<h3>$1</h3>");
    h = h.replace(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
    h = h.replace(/\n/g, "<br/>");
    return h;
}

function esc(t) {
    const d = document.createElement("div");
    d.textContent = t;
    return d.innerHTML;
}
