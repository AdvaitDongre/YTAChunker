"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { X, Send } from "lucide-react"

interface ChatUIProps {
  onClose: () => void
  darkMode: boolean
}

export function ChatUI({ onClose, darkMode }: ChatUIProps) {
  const [chatMessages, setChatMessages] = useState<{ role: string; content: string }[]>([])
  const [chatInput, setChatInput] = useState("")
  const [chatLoading, setChatLoading] = useState(false)

  const sendMessage = async () => {
    if (!chatInput.trim()) return
    setChatLoading(true)

    const userMessage = { role: "user", content: chatInput }
    setChatMessages((prev) => [...prev, userMessage])

    try {
      const response = await fetch("http://localhost:8000/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_message: chatInput }),
      })

      const data = await response.json()
      setChatMessages((prev) => [...prev, { role: "assistant", content: data.response }])
    } catch (error) {
      setChatMessages((prev) => [...prev, { role: "assistant", content: "Error fetching response." }])
    } finally {
      setChatInput("")
      setChatLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={onClose}></div>
      <div className="relative w-full max-w-2xl h-[70vh] bg-card rounded-lg shadow-xl overflow-hidden">
        <div className="flex justify-between items-center p-4 border-b border-border">
          <h2 className="text-xl font-semibold text-card-foreground">Chat with AI</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-6 w-6" />
          </Button>
        </div>
        <ScrollArea className="h-[calc(70vh-8rem)] p-4">
          {chatMessages.map((msg, idx) => (
            <div key={idx} className={`mb-4 ${msg.role === "user" ? "text-right" : "text-left"}`}>
              <span
                className={`inline-block p-2 rounded-lg ${
                  msg.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                }`}
              >
                {msg.content}
              </span>
            </div>
          ))}
        </ScrollArea>
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-border">
          <form
            onSubmit={(e) => {
              e.preventDefault()
              sendMessage()
            }}
            className="flex items-center space-x-2"
          >
            <Input
              type="text"
              placeholder="Type your message..."
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              className="flex-1"
            />
            <Button type="submit" disabled={chatLoading}>
              {chatLoading ? (
                "Sending..."
              ) : (
                <>
                  Send <Send className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}

