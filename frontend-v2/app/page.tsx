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
  Github,
  Linkedin,
} from "lucide-react"
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Elephant, Lion, Penguin } from "@/components/Animals"
import { ChatUI } from "@/components/ChatUI"
import styled from 'styled-components';
import { toast } from "react-hot-toast";

// Add this type definition at the top of the file
type HistoryItem = {
  url: string;
  timestamp: string;
};

function getYouTubeVideoId(url: string) {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return match && match[2].length === 11 ? match[2] : null;
}

// Add the styled switch component
const StyledWrapper = styled.div<{ isDarkMode: boolean }>`
  .checkbox-wrapper-8 .tgl {
    display: none;
  }

  .checkbox-wrapper-8 .tgl,
  .checkbox-wrapper-8 .tgl:after,
  .checkbox-wrapper-8 .tgl:before,
  .checkbox-wrapper-8 .tgl *,
  .checkbox-wrapper-8 .tgl *:after,
  .checkbox-wrapper-8 .tgl *:before,
  .checkbox-wrapper-8 .tgl + .tgl-btn {
    box-sizing: border-box;
  }

  .checkbox-wrapper-8 .tgl::-moz-selection,
  .checkbox-wrapper-8 .tgl:after::-moz-selection,
  .checkbox-wrapper-8 .tgl:before::-moz-selection,
  .checkbox-wrapper-8 .tgl *::-moz-selection,
  .checkbox-wrapper-8 .tgl *:after::-moz-selection,
  .checkbox-wrapper-8 .tgl *:before::-moz-selection,
  .checkbox-wrapper-8 .tgl + .tgl-btn::-moz-selection,
  .checkbox-wrapper-8 .tgl::selection,
  .checkbox-wrapper-8 .tgl:after::selection,
  .checkbox-wrapper-8 .tgl:before::selection,
  .checkbox-wrapper-8 .tgl *::selection,
  .checkbox-wrapper-8 .tgl *:after::selection,
  .checkbox-wrapper-8 .tgl *:before::selection,
  .checkbox-wrapper-8 .tgl + .tgl-btn::selection {
    background: none;
  }

  .checkbox-wrapper-8 .tgl + .tgl-btn {
    outline: 0;
    display: block;
    width: 7em;
    height: 2em;
    position: relative;
    cursor: pointer;
    user-select: none;
  }

  .checkbox-wrapper-8 .tgl + .tgl-btn:after,
  .checkbox-wrapper-8 .tgl + .tgl-btn:before {
    position: relative;
    display: block;
    content: "";
    width: 50%;
    height: 100%;
  }

  .checkbox-wrapper-8 .tgl + .tgl-btn:after {
    left: 0;
  }

  .checkbox-wrapper-8 .tgl + .tgl-btn:before {
    display: none;
  }

  .checkbox-wrapper-8 .tgl:checked + .tgl-btn:after {
    left: 50%;
  }

  .checkbox-wrapper-8 .tgl-skewed + .tgl-btn {
    overflow: hidden;
    transform: skew(-10deg);
    backface-visibility: hidden;
    transition: all 0.2s ease;
    font-family: sans-serif;
    background: ${props => props.isDarkMode ? '#374151' : '#888'};
  }

  .checkbox-wrapper-8 .tgl-skewed + .tgl-btn:after,
  .checkbox-wrapper-8 .tgl-skewed + .tgl-btn:before {
    transform: skew(10deg);
    display: inline-block;
    transition: all 0.2s ease;
    width: 100%;
    text-align: center;
    position: absolute;
    line-height: 2em;
    font-weight: bold;
    color: #fff;
    text-shadow: 0 1px 0 rgba(0, 0, 0, 0.4);
  }

  .checkbox-wrapper-8 .tgl-skewed + .tgl-btn:after {
    left: 100%;
    content: attr(data-tg-on);
  }

  .checkbox-wrapper-8 .tgl-skewed + .tgl-btn:before {
    left: 0;
    content: attr(data-tg-off);
  }

  .checkbox-wrapper-8 .tgl-skewed + .tgl-btn:active {
    background: ${props => props.isDarkMode ? '#4B5563' : '#888'};
  }

  .checkbox-wrapper-8 .tgl-skewed + .tgl-btn:active:before {
    left: -10%;
  }

  .checkbox-wrapper-8 .tgl-skewed:checked + .tgl-btn {
    background: ${props => props.isDarkMode ? '#60A5FA' : '#86d993'};
  }

  .checkbox-wrapper-8 .tgl-skewed:checked + .tgl-btn:before {
    left: -100%;
  }

  .checkbox-wrapper-8 .tgl-skewed:checked + .tgl-btn:after {
    left: 0;
  }

  .checkbox-wrapper-8 .tgl-skewed:checked + .tgl-btn:active:after {
    left: 10%;
  }
`;

const StyledButtonWrapper = styled.div<{ isDarkMode: boolean }>`
  .cta {
    position: relative;
    margin: auto;
    padding: 12px 18px;
    transition: all 0.2s ease;
    border: none;
    background: none;
    cursor: pointer;
    display: flex;
    align-items: center;
  }

  .cta:before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    display: block;
    border-radius: 50px;
    background: ${props => props.isDarkMode ? '#60A5FA' : '#b1dae7'};
    width: 45px;
    height: 45px;
    transition: all 0.3s ease;
  }

  .cta span {
    position: relative;
    font-family: "Ubuntu", sans-serif;
    font-size: 16px;
    font-weight: 700;
    letter-spacing: 0.05em;
    color: ${props => props.isDarkMode ? '#fff' : '#234567'};
  }

  .cta svg {
    position: relative;
    top: 0;
    margin-left: 10px;
    fill: none;
    stroke-linecap: round;
    stroke-linejoin: round;
    stroke: ${props => props.isDarkMode ? '#fff' : '#234567'};
    stroke-width: 2;
    transform: translateX(-5px);
    transition: all 0.3s ease;
  }

  .cta:hover:before {
    width: 100%;
    background: ${props => props.isDarkMode ? '#60A5FA' : '#b1dae7'};
  }

  .cta:hover svg {
    transform: translateX(0);
  }

  .cta:active {
    transform: scale(0.95);
  }
`;

const StyledInputWrapper = styled.div<{ isDarkMode: boolean }>`
  .brutalist-container {
    position: relative;
    width: 100%;
    font-family: monospace;
  }

  .brutalist-input {
    width: 100%;
    padding: 15px;
    padding-right: 45px; // Space for YouTube icon
    font-size: 16px;
    font-weight: bold;
    color: ${props => props.isDarkMode ? '#fff' : '#000'};
    background-color: ${props => props.isDarkMode ? '#374151' : '#fff'};
    border: 4px solid ${props => props.isDarkMode ? '#fff' : '#000'};
    position: relative;
    overflow: hidden;
    border-radius: 0;
    outline: none;
    transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
    box-shadow: 5px 5px 0 ${props => props.isDarkMode ? '#fff' : '#000'}, 
                10px 10px 0 ${props => props.isDarkMode ? '#60A5FA' : '#4a90e2'};
  }

  @keyframes glitch {
    0% { transform: translate(0); }
    20% { transform: translate(-2px, 2px); }
    40% { transform: translate(-2px, -2px); }
    60% { transform: translate(2px, 2px); }
    80% { transform: translate(2px, -2px); }
    100% { transform: translate(0); }
  }

  .brutalist-input:focus {
    animation: focus-pulse 4s cubic-bezier(0.25, 0.8, 0.25, 1) infinite,
              glitch 0.3s cubic-bezier(0.25, 0.8, 0.25, 1) infinite;
  }

  .brutalist-input:focus::after {
    content: "";
    position: absolute;
    top: -2px;
    left: -2px;
    right: -2px;
    bottom: -2px;
    background: ${props => props.isDarkMode ? '#374151' : 'white'};
    z-index: -1;
  }

  .brutalist-label {
    position: absolute;
    left: -3px;
    top: -35px;
    font-size: 14px;
    font-weight: bold;
    color: ${props => props.isDarkMode ? '#000' : '#fff'};
    background-color: ${props => props.isDarkMode ? '#fff' : '#000'};
    padding: 5px 10px;
    transform: rotate(-1deg);
    z-index: 1;
    transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  }

  .brutalist-input:focus + .brutalist-label {
    transform: rotate(0deg) scale(1.05);
    background-color: ${props => props.isDarkMode ? '#60A5FA' : '#4a90e2'};
  }

  .brutalist-input::placeholder {
    color: ${props => props.isDarkMode ? '#9CA3AF' : '#888'};
    transition: color 0.3s ease;
  }

  .brutalist-input:focus::placeholder {
    color: transparent;
  }

  @keyframes focus-pulse {
    0%, 100% {
      border-color: ${props => props.isDarkMode ? '#fff' : '#000'};
    }
    50% {
      border-color: ${props => props.isDarkMode ? '#60A5FA' : '#4a90e2'};
    }
  }
`;

const StyledSubmitWrapper = styled.div<{ isDarkMode: boolean }>`
  button {
    background-color: ${props => props.isDarkMode ? '#374151' : 'white'};
    color: ${props => props.isDarkMode ? 'white' : 'black'};
    border-radius: 10em;
    font-size: 17px;
    font-weight: 600;
    padding: 0.7em 2em;
    cursor: pointer;
    transition: all 0.3s ease-in-out;
    border: 1px solid ${props => props.isDarkMode ? 'white' : 'black'};
    box-shadow: 0 0 0 0 ${props => props.isDarkMode ? 'white' : 'black'};
  }

  button:hover {
    transform: translateY(-4px) translateX(-2px);
    box-shadow: 2px 5px 0 0 ${props => props.isDarkMode ? 'white' : 'black'};
  }

  button:active {
    transform: translateY(2px) translateX(1px);
    box-shadow: 0 0 0 0 ${props => props.isDarkMode ? 'white' : 'black'};
  }

  button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }
`;

// Add this style to handle the emoji colors based on theme
const StyledSwitchWrapper = styled.div<{ isDarkMode: boolean }>`
  .switch-emoji::after {
    color: ${props => props.isDarkMode ? '#374151' : '#000000'};
  }
  
  input:checked + .switch-emoji::after {
    color: ${props => props.isDarkMode ? '#374151' : '#000000'};
  }
`;

export default function Home() {
  const [youtubeUrl, setYoutubeUrl] = useState("")
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [darkMode, setDarkMode] = useState(false)
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [showHistory, setShowHistory] = useState(false)
  const [autoTranscribe, setAutoTranscribe] = useState(false)
  const [language, setLanguage] = useState("en")
  const [showChat, setShowChat] = useState(false)
  const [isCancelled, setIsCancelled] = useState(false)

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

  useEffect(() => {
    // Clear chat history on page refresh
    const handleBeforeUnload = () => {
      localStorage.removeItem('chatHistory');
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!youtubeUrl) return
    setLoading(true)
    setResult(null)
    setIsCancelled(false)

    // Create an AbortController
    const controller = new AbortController();
    const { signal } = controller;

    try {
      // Store the controller in a ref or state if you need to access it elsewhere
      const processResponse = await fetch("http://localhost:8000/process-youtube", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          youtube_url: youtubeUrl, 
          auto_transcribe: !autoTranscribe, 
          language 
        }),
        signal, // Add the abort signal to the fetch request
      });

      if (isCancelled) {
        controller.abort();
        setLoading(false);
        return;
      }

      if (!processResponse.ok) {
        throw new Error(`Error: ${processResponse.statusText}`);
      }

      const data = await processResponse.json();
      if (!isCancelled) {
        setResult(data);
        updateHistory(youtubeUrl);
      }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.log('Fetch aborted');
      } else if (!isCancelled) {
        setResult({ error: error.message });
      }
    } finally {
      if (!isCancelled) {
        setLoading(false);
      }
    }
  };

  const updateHistory = (url: string) => {
    const newHistoryItem: HistoryItem = {
      url,
      timestamp: new Date().toLocaleString(),
    };
    
    const updatedHistory = [newHistoryItem, ...history].slice(0, 5); // Changed from 10 to 5
    setHistory(updatedHistory);
    localStorage.setItem("urlHistory", JSON.stringify(updatedHistory));
  };

  const handleHistoryClick = (url: string) => {
    setYoutubeUrl(url);
    setShowHistory(false);
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem("urlHistory");
  };

  const toggleDarkMode = () => {
    setDarkMode(!darkMode)
  }

  const shareResults = () => {
    if (result) {
      const shareText = `Check out these YouTube segments I processed with YTAChunker: ${youtubeUrl}`
      navigator.clipboard.writeText(shareText).then(() => {
        alert("Share link copied to clipboard!")
      })
    }
  }

  const handleCancel = async () => {
    try {
      // First, set the cancelled state and remove loading state immediately
      setIsCancelled(true);
      setLoading(false);
      setResult(null);

      // Then send the cancel request to the backend
      await fetch("http://localhost:8000/cancel-process", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

    } catch (error) {
      console.error("Error cancelling process:", error);
    }
  };

  const processVideo = async (url: string) => {
    setLoading(true);
    try {
      const response = await fetch('/api/process-video', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        
        // Handle storage limit exceeded error
        if (response.status === 507) {
          toast.error('Processing terminated: Storage limit exceeded. Please try again later.');
          return;
        }

        throw new Error(errorData.error || 'Failed to process video');
      }

      // ... rest of your existing success handling code ...

    } catch (error) {
      console.error('Error processing video:', error);
      toast.error(error.message || 'Failed to process video');
    } finally {
      setLoading(false);
    }
  };

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
                  <StyledInputWrapper isDarkMode={darkMode}>
                    <div className="brutalist-container">
                      <input
                        type="url"
                        placeholder="ENTER YOUTUBE URL"
                        value={youtubeUrl}
                        onChange={(e) => setYoutubeUrl(e.target.value)}
                        onFocus={() => setShowHistory(true)}
                        required
                        className="brutalist-input smooth-type"
                      />
                      <label className="brutalist-label">YOUTUBE URL</label>
                    </div>
                  </StyledInputWrapper>
                  <Youtube
                    className={`absolute right-6 top-1/2 transform -translate-y-1/2 text-muted-foreground animate-pulse`}
                  />
                </div>
                <div className="flex items-center space-x-4 bg-secondary/50 p-3 rounded-lg h-12">
                  <StyledWrapper isDarkMode={darkMode}>
                    <div className="checkbox-wrapper-8">
                      <input 
                        type="checkbox" 
                        id="manual-transcribe" 
                        className="tgl tgl-skewed" 
                        checked={!autoTranscribe}
                        onChange={(e) => setAutoTranscribe(!e.target.checked)}
                      />
                      <label 
                        htmlFor="manual-transcribe" 
                        data-tg-on="MANUAL" 
                        data-tg-off="AUTO" 
                        className="tgl-btn" 
                      />
                    </div>
                  </StyledWrapper>
                </div>
                {!autoTranscribe && (
                  <Select value={language} onValueChange={setLanguage}>
                    <SelectTrigger className={`h-12 ${darkMode ? 'bg-gray-800 text-white border-gray-700' : 'bg-white text-gray-900 border-gray-200'}`}>
                      <SelectValue placeholder="Select Language" />
                    </SelectTrigger>
                    <SelectContent className={darkMode ? 'bg-gray-800 text-white border-gray-700' : 'bg-white text-gray-900 border-gray-200'}>
                      <SelectItem value="en" className={`${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}>English</SelectItem>
                      <SelectItem value="es" className={`${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}>Spanish</SelectItem>
                      <SelectItem value="fr" className={`${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}>French</SelectItem>
                    </SelectContent>
                  </Select>
                )}
                <div className="flex justify-start pr-[44px]">
                  <StyledSubmitWrapper isDarkMode={darkMode}>
                    <button
                      type="submit"
                      disabled={loading}
                    >
                      {loading ? "Processing..." : "Submit"}
                    </button>
                  </StyledSubmitWrapper>
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
                    {history.map((item, index) => (
                      <div key={index} className="flex items-center justify-between group">
                        <button
                          onClick={() => handleHistoryClick(item.url)}
                          className="text-blue-500 hover:underline truncate max-w-xs group-hover:animate-pulse"
                        >
                          {item.url}
                        </button>
                        <span className="text-sm text-muted-foreground group-hover:text-foreground">
                          {item.timestamp}
                        </span>
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

                      <div className="mb-6">
                        {youtubeUrl && getYouTubeVideoId(youtubeUrl) ? (
                          <div className="relative pt-[56.25%]"> {/* 16:9 aspect ratio */}
                            <iframe
                              className="absolute top-0 left-0 w-full h-full rounded-lg shadow-lg"
                              src={`https://www.youtube.com/embed/${getYouTubeVideoId(youtubeUrl)}`}
                              title="YouTube video player"
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                              allowFullScreen
                            />
                          </div>
                        ) : (
                          <div className="text-center p-4 bg-muted rounded-lg">
                            Invalid YouTube URL
                          </div>
                        )}
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

        <footer className={`bg-muted text-muted-foreground py-6 mt-8 transition-colors duration-300`}>
          <div className="container mx-auto text-center">
            <div className="flex justify-center items-center space-x-4">
              <p>&copy; 2023 YTAChunker. All rights reserved.</p>
              <div className="flex space-x-4">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <a
                      href="https://github.com/AdvaitDongre"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-primary transition-colors duration-300"
                    >
                      <Github className="w-6 h-6" />
                    </a>
                  </TooltipTrigger>
                  <TooltipContent>GitHub</TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <a
                      href="https://www.linkedin.com/in/advait-dongre-259075257/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-primary transition-colors duration-300"
                    >
                      <Linkedin className="w-6 h-6" />
                    </a>
                  </TooltipTrigger>
                  <TooltipContent>LinkedIn</TooltipContent>
                </Tooltip>
              </div>
            </div>
          </div>
        </footer>

        {loading && (
          <div className="fixed inset-0 flex items-center justify-center bg-black/70 backdrop-blur-sm z-50">
            <div className="bg-gradient-to-b from-slate-800 to-slate-900 rounded-lg p-8 flex flex-col items-center border border-slate-700 shadow-xl">
              <div className="loader ease-linear rounded-full border-8 border-t-8 border-primary h-24 w-24 mb-4 animate-spin"></div>
              <h2 className="text-center text-xl font-semibold text-white mb-2">Processing</h2>
              <p className="w-64 text-center text-slate-300 mb-4">
                This may take a few seconds, please don't close this page.
              </p>
              <Button 
                variant="destructive" 
                onClick={handleCancel}
                className="mt-4 animate-pulse hover:animate-none bg-red-600 hover:bg-red-700"
              >
                Cancel Processing
              </Button>
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

        {showChat && (
          <ChatUI 
            onClose={() => setShowChat(false)} 
            darkMode={darkMode} 
          />
        )}
      </div>
    </TooltipProvider>
  )
}

