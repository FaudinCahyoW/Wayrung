"use client";

import { useState, useRef, useEffect } from "react";
import { MessageSquare, X, Send, Bot } from "lucide-react";
import { api } from "@/lib/api";

interface Message {
  sender: "user" | "Moblit";
  text: string;
}

const QUICK_QUESTIONS = [
  "Berapa omzet hari ini?",
  "Cek stok barang yang menipis",
  "Apa saja 5 barang paling laku?",
  "Tampilkan semua stok produk",
  "Kebanyakan bayar cash atau QRIS?",
];

export default function FloatingChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { sender: "Moblit", text: "Halo! Ada yang bisa saya bantu terkait stok atau omzet toko?" },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const sendMessage = async (queryText: string) => {
    if (!queryText.trim() || loading) return;

    setInput("");
    setMessages((prev) => [...prev, { sender: "user", text: queryText }]);
    setLoading(true);

    try {
      const res = await api.post("/chat", { message: queryText });
      const botReply = res.data.reply || res.data.data || "Maaf, tidak ada respon.";
      
      setMessages((prev) => [...prev, { sender: "Moblit", text: botReply }]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        { sender: "Moblit", text: "Maaf, terjadi kesalahan saat menghubungi server." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = () => sendMessage(input);
  const handleQuickQuestionClick = (question: string) => sendMessage(question);

  // Helper sederhana untuk merender teks **bold** dari markdown backend
  const renderFormattedText = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return <strong key={i}>{part.slice(2, -2)}</strong>;
      }
      return part;
    });
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {isOpen && (
        <div className="mb-4 w-80 sm:w-96 h-[520px] bg-white border border-gray-200 rounded-2xl shadow-2xl flex flex-col overflow-hidden transition-all duration-300">
          
          {/* Header */}
          <div className="bg-blue-600 text-white p-4 flex justify-between items-center shrink-0">
            <div className="flex items-center gap-2">
              <Bot className="w-5 h-5" />
              <span className="font-semibold text-sm">Moblit Assistant</span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-white/80 hover:text-white p-1 rounded-lg transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body / Chat Messages */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-gray-50 text-sm">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] px-3.5 py-2.5 rounded-2xl whitespace-pre-line ${
                    msg.sender === "user"
                      ? "bg-blue-600 text-white rounded-br-none"
                      : "bg-white border border-gray-200 text-gray-800 rounded-bl-none shadow-sm"
                  }`}
                >
                  {renderFormattedText(msg.text)}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="bg-white border border-gray-200 text-gray-500 px-3.5 py-2.5 rounded-2xl rounded-bl-none text-xs animate-pulse">
                  Sedang berpikir...
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Quick Questions Block (Menumpuk Rapi dengan flex-wrap) */}
          <div className="p-3 bg-white border-t border-gray-100 shrink-0">
            <p className="text-[11px] font-medium text-gray-400 mb-2">Rekomendasi Pertanyaan:</p>
            <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
              {QUICK_QUESTIONS.map((question, idx) => (
                <button
                  key={idx}
                  disabled={loading}
                  onClick={() => handleQuickQuestionClick(question)}
                  className="bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-[11px] px-2.5 py-1 rounded-lg transition-all text-left disabled:opacity-50 active:scale-95"
                >
                  {question}
                </button>
              ))}
            </div>
          </div>

          {/* Footer / Input Bar */}
          <div className="p-3 bg-white border-t border-gray-100 flex items-center gap-2 shrink-0">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder="Tanyakan stok atau omzet..."
              className="flex-1 text-sm border border-gray-300 rounded-xl px-3 py-2 outline-none focus:border-blue-600 text-black"
            />
            <button
              onClick={handleSend}
              disabled={loading || !input.trim()}
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white p-2 rounded-xl transition cursor-pointer"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="cursor-pointer bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center"
      >
        {isOpen ? <X className="w-6 h-6" /> : <MessageSquare className="w-6 h-6" />}
      </button>
    </div>
  );
}