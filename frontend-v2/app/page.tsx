"use client"

import { useState, useEffect, useRef } from "react"
import {
  Youtube,
  Sun,
  Moon,
  ChevronDown,
  ChevronUp,
  Trash2,
  Download,
  Share2,
  Upload,
  MessageCircle,
} from "lucide-react"
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Elephant, Lion, Penguin } from "@/components/Animals"
import { ChatUI } from "@/components/ChatUI"

export default function Home() {
  const [youtubeUrl, setYoutubeUrl] = useState("")
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [darkMode, setDarkMode] = useState(false)
  const [history, setHistory] = useState<string[]>([])
  const [showHistory, setShowHistory] = useState(false)
  const [autoTranscribe, setAutoTranscribe] = useState(false)
  const [language, setLanguage] = useState("en")
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [showChat, setShowChat] = useState(false)

  useEffect(() => {
    const savedMode = localStorage.getItem("darkMode")
    if (savedMode) {
      setDarkMode(JSON.parse(savedMode))
    }
    const savedHistory = localStorage.getItem("urlHistory")
    if (savedHistory) {
      setHistory(JSON.parse(savedHistory))
    }
  }, [])

  useEffect(() => {
    document.body.classList.toggle("dark", darkMode)
    localStorage.setItem("darkMode", JSON.stringify(darkMode))
  }, [darkMode])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!youtubeUrl) return
    setLoading(true)
    setResult(null)

    try {
      const response = await fetch("http://localhost:8000/process-youtube", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ youtube_url: youtubeUrl, auto_transcribe: !autoTranscribe, language }),
      })

      if (!response.ok) {
        throw new Error(`Error: ${response.statusText}`)
      }

      const data = await response.json()
      setResult(data)
      updateHistory(youtubeUrl)
    } catch (error: any) {
      setResult({ error: error.message })
    } finally {
      setLoading(false)
    }
  }

  const updateHistory = (url: string) => {
    const updatedHistory = [url, ...history.filter((item) => item !== url)].slice(0, 5)
    setHistory(updatedHistory)
    localStorage.setItem("urlHistory", JSON.stringify(updatedHistory))
  }

  const toggleDarkMode = () => {
    setDarkMode(!darkMode)
  }

  const clearHistory = () => {
    setHistory([])
    localStorage.removeItem("urlHistory")
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // Handle file upload logic here
      console.log("File uploaded:", file.name)
    }
  }

  const shareResults = () => {
    if (result) {
      const shareText = `Check out these YouTube segments I processed with YTAChunker: ${youtubeUrl}`
      navigator.clipboard.writeText(shareText).then(() => {
        alert("Share link copied to clipboard!")
      })
    }
  }

  return (
    <TooltipProvider>
      <div
        className={`min-h-screen flex flex-col transition-colors duration-300 ${darkMode ? "bg-gray-900 text-white" : "bg-gradient-to-b from-blue-100 to-white"}`}
      >
        <header
          className={`bg-primary text-primary-foreground py-6 px-4 shadow-md transition-colors duration-300 relative overflow-hidden`}
        >
          <div className="container mx-auto flex items-center justify-between relative z-10">
            <div className="flex items-center">
              <Youtube className="w-8 h-8 mr-3 animate-bounce" />
              <h1 className="text-3xl font-bold">YTAChunker</h1>
            </div>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleDarkMode}
                  className="rounded-full bg-opacity-20 bg-white hover:bg-opacity-30 transition-all duration-300 focus:ring-2 focus:ring-white focus:ring-opacity-50"
                >
                  {darkMode ? (
                    <Sun className="w-6 h-6 animate-spin-slow" />
                  ) : (
                    <Moon className="w-6 h-6 animate-bounce-slow" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>{darkMode ? "Switch to light mode" : "Switch to dark mode"}</TooltipContent>
            </Tooltip>
          </div>
          <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
            <Elephant className="absolute top-2 left-1/4 transform -translate-x-1/2 animate-float" />
            <Lion className="absolute top-10 right-1/4 transform translate-x-1/2 animate-float-delay-1" />
            <Penguin className="absolute bottom-2 left-1/2 transform -translate-x-1/2 animate-float-delay-2" />
          </div>
        </header>

        <main className="flex-grow container mx-auto px-4 py-8 relative">
          <div className="w-full max-w-5xl mx-auto bg-card text-card-foreground rounded-lg shadow-xl overflow-hidden transition-colors duration-300">
            <div className="p-8">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="relative">
                  <Input
                    type="url"
                    placeholder="Enter YouTube URL"
                    value={youtubeUrl}
                    onChange={(e) => setYoutubeUrl(e.target.value)}
                    required
                    className="pr-12"
                  />
                  <Youtube
                    className={`absolute right-4 top-1/2 transform -translate-y-1/2 text-muted-foreground animate-pulse`}
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="auto-transcribe"
                    checked={!autoTranscribe}
                    onCheckedChange={(checked) => setAutoTranscribe(!checked)}
                  />
                  <Label htmlFor="auto-transcribe">Manual Transcribe</Label>
                </div>
                {!autoTranscribe && (
                  <Select value={language} onValueChange={setLanguage}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Language" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="es">Spanish</SelectItem>
                      <SelectItem value="fr">French</SelectItem>
                      {/* Add more languages as needed */}
                    </SelectContent>
                  </Select>
                )}
                <div className="flex space-x-4">
                  <Button
                    type="submit"
                    disabled={loading}
                    className="flex-grow animate-shimmer hover:animate-pulse transition-all duration-300 bg-black text-white"
                  >
                    {loading ? "Processing..." : "Submit"}
                  </Button>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => fileInputRef.current?.click()}
                        className="animate-pulse hover:animate-bounce transition-all duration-300"
                      >
                        <input
                          type="file"
                          ref={fileInputRef}
                          onChange={handleFileUpload}
                          accept="video/*"
                          className="hidden"
                        />
                        <Upload className="w-5 h-5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Upload local video</TooltipContent>
                  </Tooltip>
                </div>
              </form>

              <div className="mt-6">
                <Button
                  variant="ghost"
                  onClick={() => setShowHistory(!showHistory)}
                  className="flex items-center group"
                >
                  {showHistory ? (
                    <ChevronUp className="mr-2 group-hover:animate-bounce" />
                  ) : (
                    <ChevronDown className="mr-2 group-hover:animate-bounce" />
                  )}
                  Recent URLs
                </Button>
                {showHistory && (
                  <div className="mt-2 space-y-2">
                    {history.map((url, index) => (
                      <div key={index} className="flex items-center justify-between group">
                        <button
                          onClick={() => setYoutubeUrl(url)}
                          className="text-blue-500 hover:underline truncate max-w-xs group-hover:animate-pulse"
                        >
                          {url}
                        </button>
                        <Button
                          variant="link"
                          size="icon"
                          onClick={() => {
                            const updatedHistory = history.filter((item) => item !== url)
                            setHistory(updatedHistory)
                            localStorage.setItem("urlHistory", JSON.stringify(updatedHistory))
                          }}
                        >
                          <Trash2 className="w-4 h-4 group-hover:animate-shake" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {result && (
                <div className="mt-8 animate-fade-in">
                  {result.error ? (
                    <p className={`text-destructive bg-destructive/20 p-4 rounded-md animate-shake`}>{result.error}</p>
                  ) : (
                    <div>
                      <div className="flex justify-between items-center mb-4">
                        <p
                          className={`text-primary bg-primary/20 font-semibold p-4 rounded-md flex-grow mr-4 animate-fade-in`}
                        >
                          Processing complete! Below are the extracted segments:
                        </p>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="outline" size="icon" onClick={shareResults} className="animate-pulse">
                              <Share2 className="w-4 h-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Share results</TooltipContent>
                        </Tooltip>
                      </div>
                      <div className="overflow-x-auto">
                      <table className="w-full border-collapse rounded-lg overflow-hidden" style={{ tableLayout: "fixed" }}>
                        <thead>
  <tr className="bg-muted">
    <th className="px-4 py-3 text-left w-[10%]">Name</th>
    <th className="px-4 py-3 text-left w-[10%]">Start Time</th>
    <th className="px-4 py-3 text-left w-[10%]">End Time</th>
    <th className="px-4 py-3 text-left w-[10%]">Text</th>
    <th className="px-6 py-3 text-left w-[35%]">Summary</th> {/* More width */}
    <th className="px-4 py-3 text-left w-[10%]">Source</th>
    <th className="px-4 py-3 text-left w-[10%]">Actions</th>
  </tr>
</thead>

                          <tbody>
                            {result.segments.map((segment: any, index: number) => (
                              <tr
                                key={index}
                                className="odd:bg-muted/50 even:bg-background hover:bg-muted/80 transition-colors duration-200"
                              >
                                <td className="px-6 py-4 border-t border-border">{segment.audio_path.split('/').pop().split('.')[0]}</td>
                                <td className="px-6 py-4 border-t border-border">{segment.start_time.toFixed(2)}</td>
                                <td className="px-6 py-4 border-t border-border">{segment.end_time.toFixed(2)}</td>
                                <td className="px-6 py-4 border-t border-border w-[50%]">{segment.text}</td>
                                <td className="px-6 py-4 border-t border-border w-[50%] break-words">
                                  {segment.summary || "No summary available."}
                                </td>
                                <td className="px-6 py-4 border-t border-border w-[1%] break-words">
  {segment.source ? (
    <a href={segment.source} target="_blank" rel="noopener noreferrer" className="text-blue-500 underline">
      Source
    </a>
  ) : (
    "No source found."
  )}
</td>

                                <td className="px-6 py-4 border-t border-border">
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button variant="ghost" size="icon" asChild className="group">
                                        <a
                                          download={`chunk_${index + 1}.wav`}
                                          href={`http://localhost:8000/temp/segments/chunk_${index + 1}`}
                                        >
                                          <Download className="w-4 h-4 group-hover:animate-bounce" />
                                        </a>
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>Download audio</TooltipContent>
                                  </Tooltip>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </main>

        <footer className="bg-muted text-muted-foreground text-center py-4 mt-8 transition-colors duration-300">
          <p>&copy; 2023 YTAChunker. All rights reserved.</p>
        </footer>

        {loading && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
            <div className="bg-background rounded-lg p-8 flex flex-col items-center">
              <div className="loader ease-linear rounded-full border-8 border-t-8 border-muted h-24 w-24 mb-4 animate-spin"></div>
              <h2 className="text-center text-xl font-semibold">Processing</h2>
              <p className="w-64 text-center text-muted-foreground">
                This may take a few seconds, please don't close this page.
              </p>
            </div>
          </div>
        )}

        {result && !result.error && (
          <div className="fixed bottom-4 right-4 z-50">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  onClick={() => setShowChat(true)}
                  className="rounded-full w-12 h-12 bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg transition-all duration-300 animate-bounce-slow"
                >
                  <MessageCircle className="w-6 h-6" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Chat with AI</TooltipContent>
            </Tooltip>
          </div>
        )}

        {showChat && <ChatUI onClose={() => setShowChat(false)} darkMode={darkMode} />}
      </div>
    </TooltipProvider>
  )
}

