"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { X, Send, RotateCcw } from "lucide-react"

interface ChatUIProps {
  onClose: () => void
  darkMode: boolean
}

export function ChatUI({ onClose, darkMode }: ChatUIProps) {
  const [messages, setMessages] = useState<{ role: string; content: string; start_time?: number; end_time?: number }[]>(() => {
    // Load messages from localStorage on initial render
    const savedMessages = localStorage.getItem('chatHistory');
    return savedMessages ? JSON.parse(savedMessages) : [];
  });
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  // Save messages to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('chatHistory', JSON.stringify(messages));
  }, [messages]);

  // Clear chat history when URL changes or page refreshes
  useEffect(() => {
    const clearChat = () => {
      setMessages([]);
      localStorage.removeItem('chatHistory');
    };

    const handleBeforeUnload = () => {
      localStorage.removeItem('chatHistory');
    };

    window.addEventListener('popstate', clearChat);
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('popstate', clearChat);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  const sendMessage = async () => {
    if (!input.trim()) return
    setIsLoading(true)

    const userMessage = { role: "user", content: input }
    setMessages((prev) => [...prev, userMessage])

    try {
      const response = await fetch("http://localhost:8000/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_message: input }),
      })
      const data = await response.json()
      const assistantMessage = {
        role: "assistant",
        content: data.response,
        start_time: data.start_time,
        end_time: data.end_time
      }

      setMessages((prev) => [...prev, assistantMessage])
    } catch (error) {
      setMessages((prev) => [...prev, { role: "assistant", content: "Error fetching response." }])
    } finally {
      setInput("")
      setIsLoading(false)
    }
  }

  const resetChat = () => {
    setMessages([]);
    localStorage.removeItem('chatHistory');
  };

  return (
    <div className={`fixed bottom-20 right-4 z-50`}>
      <div className="w-96 h-[500px] rounded-lg shadow-lg flex flex-col bg-gradient-to-b from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 border border-gray-200 dark:border-gray-700">
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="font-semibold">YTAChunker AI Chat</h2>
          <div className="flex gap-2">
            <button
              onClick={resetChat}
              className="p-1 hover:bg-muted rounded-full transition-colors"
              title="Reset Chat"
            >
              <RotateCcw className="w-5 h-5" />
            </button>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50 dark:bg-gray-900/50">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${
                message.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              <div
                className={`max-w-[80%] rounded-lg p-3 ${
                  message.role === 'user'
                    ? 'bg-blue-500 text-white shadow-sm'
                    : 'bg-white dark:bg-gray-700 text-gray-800 dark:text-white shadow-sm'
                }`}
              >
                {message.content}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-white dark:bg-gray-700 rounded-lg p-3 shadow-sm">
                <div className="flex space-x-2">
                  <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce delay-100" />
                  <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce delay-200" />
                </div>
              </div>
            </div>
          )}
        </div>
        <div className="p-4 border-t dark:border-gray-700 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
          <form
            onSubmit={(e) => {
              e.preventDefault()
              sendMessage()
            }}
            className="flex space-x-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your message..."
              className="flex-1 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 
                       bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
            />
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 
                       disabled:bg-blue-300 disabled:cursor-not-allowed transition-colors
                       dark:disabled:bg-blue-800"
            >
              Send
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

