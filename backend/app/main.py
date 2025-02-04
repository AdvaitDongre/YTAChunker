from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from pydantic import BaseModel
from app.utils.downloader import download_video_and_audio, transcribe_audio_with_timestamps
from app.utils.llama_segmenter import segment_text_with_llama70b
from app.utils.groq_client import GroqClient
from pydub import AudioSegment
import os
import json
import logging
import asyncio
import signal
import psutil
import threading
import subprocess
from typing import Optional
import yt_dlp  # Make sure to use yt-dlp instead of youtube-dl
from app.utils.folder_monitor import check_temp_folder_size, clean_temp_folder

logging.basicConfig(level=logging.ERROR)

app = FastAPI(
    title="YTAChunker API",
    description="Backend API for YTAChunker - Intelligent YouTube Video Processing",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

groq_client = GroqClient()

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global variables to track processes and tasks
current_processes = set()
current_download_process = None
cancel_event = threading.Event()

# Add this near your other configuration variables
TEMP_FOLDER = os.path.join(os.path.dirname(__file__), "temp")
SIZE_LIMIT_GB = 1

class YouTubeRequest(BaseModel):
    youtube_url: str

class ChatRequest(BaseModel):
    user_message: str

def split_audio_by_chunks(audio_path: str, text_chunks: list[str], output_folder: str) -> list[dict]:
    """
    Splits audio into segments based on the number of text chunks and saves them.
    """
    audio = AudioSegment.from_wav(audio_path)
    os.makedirs(output_folder, exist_ok=True)

    total_audio_duration = len(audio) / 1000  # Convert ms to seconds
    average_chunk_duration = total_audio_duration / len(text_chunks)

    audio_text_pairs = []
    current_time = 0.0

    for i, text in enumerate(text_chunks):
        start_time = current_time
        end_time = min(current_time + average_chunk_duration, total_audio_duration)

        # Extract audio chunk
        start_ms = int(start_time * 1000)
        end_ms = int(end_time * 1000)
        audio_chunk = audio[start_ms:end_ms]

        # Save audio chunk
        chunk_path = os.path.join(output_folder, f"chunk_{i + 1}.wav")
        audio_chunk.export(chunk_path, format="wav")

        audio_text_pairs.append({
            "start_time": start_time,
            "end_time": end_time,
            "text": text,
            "audio_path": f"/segments/chunk_{i + 1}.wav"
        })
        current_time = end_time

    return audio_text_pairs

def force_kill_process_tree(pid):
    try:
        parent = psutil.Process(pid)
        children = parent.children(recursive=True)
        
        # First, try to kill children
        for child in children:
            try:
                os.kill(child.pid, signal.SIGKILL)  # Using SIGKILL for immediate termination
            except (psutil.NoSuchProcess, ProcessLookupError):
                pass
        
        # Then kill parent
        try:
            os.kill(pid, signal.SIGKILL)  # Using SIGKILL for immediate termination
        except (psutil.NoSuchProcess, ProcessLookupError):
            pass
    except (psutil.NoSuchProcess, ProcessLookupError):
        pass

def kill_all_processes():
    """Kill all processes immediately with SIGKILL"""
    try:
        # Kill all ffmpeg processes
        subprocess.run(['pkill', '-9', '-f', 'ffmpeg'], stderr=subprocess.DEVNULL)
        
        # Kill all yt-dlp processes
        subprocess.run(['pkill', '-9', '-f', 'yt-dlp'], stderr=subprocess.DEVNULL)
        
        # Kill all python processes related to our application
        for pid in current_processes.copy():
            force_kill_process_tree(pid)
            current_processes.discard(pid)
            
        # Kill current download process if exists
        global current_download_process
        if current_download_process:
            force_kill_process_tree(current_download_process.pid)
            current_download_process = None
            
    except Exception as e:
        logging.error(f"Error in kill_all_processes: {e}")

def cleanup_resources():
    """Clean up temporary files and directories"""
    try:
        kill_all_processes()  # First kill all processes
        
        # Then clean up files
        temp_paths = [
            "temp/video.mp4",
            "temp/audio.wav",
            "temp/transcript_original.json"
        ]
        
        for path in temp_paths:
            if os.path.exists(path):
                try:
                    os.remove(path)
                except Exception as e:
                    logging.error(f"Error removing {path}: {e}")
                    
        # Clean segments directory
        segments_dir = "temp/segments"
        if os.path.exists(segments_dir):
            for file in os.listdir(segments_dir):
                try:
                    os.remove(os.path.join(segments_dir, file))
                except Exception as e:
                    logging.error(f"Error removing segment file: {e}")
    except Exception as e:
        logging.error(f"Error in cleanup: {e}")

@app.post("/cancel-process")
async def cancel_process():
    try:
        # Set cancel event
        cancel_event.set()
        
        # Immediate process termination
        kill_all_processes()
        
        # Clean up resources
        cleanup_resources()
        
        return {"message": "Process cancelled successfully"}
    except Exception as e:
        logging.error(f"Error in cancel_process: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cancel_event.clear()

def download_video_and_audio(youtube_url: str, video_path: str, audio_path: str):
    global current_download_process
    
    try:
        # Configure yt-dlp options
        ydl_opts = {
            'format': 'best',
            'outtmpl': video_path,
            'quiet': True,
        }
        
        # Download video using subprocess for better control
        download_command = [
            'yt-dlp',
            '-f', 'best',
            '-o', video_path,
            youtube_url
        ]
        
        current_download_process = subprocess.Popen(
            download_command,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE
        )
        
        # Check for cancellation during download
        while current_download_process.poll() is None:
            if cancel_event.is_set():
                force_kill_process_tree(current_download_process.pid)
                raise Exception("Download cancelled")
            asyncio.sleep(0.1)
            
        # Extract audio using ffmpeg
        ffmpeg_command = [
            'ffmpeg',
            '-i', video_path,
            '-vn',
            '-acodec', 'pcm_s16le',
            '-ar', '44100',
            '-ac', '2',
            audio_path,
            '-y'
        ]
        
        current_download_process = subprocess.Popen(
            ffmpeg_command,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE
        )
        
        # Check for cancellation during audio extraction
        while current_download_process.poll() is None:
            if cancel_event.is_set():
                force_kill_process_tree(current_download_process.pid)
                raise Exception("Audio extraction cancelled")
            asyncio.sleep(0.1)
            
        return video_path, audio_path
        
    except Exception as e:
        logging.error(f"Error in download_video_and_audio: {e}")
        raise
    finally:
        current_download_process = None

@app.post("/process-youtube")
async def process_youtube(request: YouTubeRequest):
    cancel_event.clear()
    current_processes.add(os.getpid())
    
    try:
        # Check temp folder size before processing
        is_exceeded, current_size = check_temp_folder_size(TEMP_FOLDER, SIZE_LIMIT_GB)
        if is_exceeded:
            # Clean up and return error
            clean_temp_folder(TEMP_FOLDER)
            return JSONResponse(
                status_code=507,  # Insufficient Storage
                content={
                    "error": f"Temp folder size ({current_size:.2f}GB) exceeded limit of {SIZE_LIMIT_GB}GB. Processing terminated."
                }
            )

        if cancel_event.is_set():
            raise HTTPException(status_code=400, detail="Process was cancelled")

        youtube_url = request.youtube_url
        video_path = "temp/video.mp4"
        audio_path = "temp/audio.wav"
        output_folder = "temp/segments"
        json_path = "temp/transcript_original.json"

        # Download video and extract audio with cancellation support
        await asyncio.to_thread(download_video_and_audio, youtube_url, video_path, audio_path)
        
        if cancel_event.is_set():
            raise HTTPException(status_code=400, detail="Process was cancelled")

        # Check size after download
        is_exceeded, current_size = check_temp_folder_size(TEMP_FOLDER, SIZE_LIMIT_GB)
        if is_exceeded:
            clean_temp_folder(TEMP_FOLDER)
            return JSONResponse(
                status_code=507,
                content={
                    "error": f"Temp folder size ({current_size:.2f}GB) exceeded limit of {SIZE_LIMIT_GB}GB after download. Operation terminated."
                }
            )

        # Transcription and segmentation
        transcript_segments = transcribe_audio_with_timestamps(audio_path)
        
        if cancel_event.is_set():
            raise HTTPException(status_code=400, detail="Process was cancelled")

        full_transcript = " ".join([segment["text"] for segment in transcript_segments])
        
        if cancel_event.is_set():
            raise HTTPException(status_code=400, detail="Process was cancelled")

        text_chunks = segment_text_with_llama70b(full_transcript)

        # Step 4: Split audio by text chunks
        audio_text_pairs = split_audio_by_chunks(audio_path, text_chunks, output_folder)

        # Step 2: Load documents from JSON
        groq_client.load_documents_from_json(json_path)
        
        # Step 5: Query LLM for each chunk
        for segment in audio_text_pairs:
            groq_response = groq_client.query_llm(segment["text"])
            segment["summary"] = groq_response.get("summary", "No summary available.")
            segment["source"] = groq_response.get("source", "No source available.")

        # Step 6: Save metadata
        metadata_path = os.path.join(output_folder, "metadata.json")
        with open(metadata_path, "w") as metadata_file:
            json.dump(audio_text_pairs, metadata_file, indent=4)

        # Final size check before completion
        is_exceeded, current_size = check_temp_folder_size(TEMP_FOLDER, SIZE_LIMIT_GB)
        if is_exceeded:
            clean_temp_folder(TEMP_FOLDER)
            return JSONResponse(
                status_code=507,
                content={
                    "error": f"Temp folder size ({current_size:.2f}GB) exceeded final limit. Operation terminated."
                }
            )

        return {
            "message": "Processing complete",
            "segments": audio_text_pairs,
            "metadata_path": metadata_path
        }

    except Exception as e:
        # Clean temp folder on error
        clean_temp_folder(TEMP_FOLDER)
        if cancel_event.is_set():
            raise HTTPException(status_code=400, detail="Process was cancelled")
        logging.error(f"Error processing YouTube request: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))
        
    finally:
        current_processes.discard(os.getpid())
        # Cleanup specific video files
        try:
            video_specific_files = [
                f for f in os.listdir(TEMP_FOLDER) 
                if f.startswith(os.path.splitext(os.path.basename(video_path))[0])
            ]
            for file in video_specific_files:
                os.remove(os.path.join(TEMP_FOLDER, file))
        except Exception as e:
            print(f"Error cleaning up video files: {e}")

@app.post("/chat")
async def chat(request: ChatRequest):
    try:
        raw_response = groq_client.query_llm(request.user_message)["response"]
        clean_response = groq_client.format_response(raw_response)

        # Get timestamps for the query from the transcript
        start_time, end_time = groq_client.find_timestamps(request.user_message)
        print(end_time)
        return {
            "response": clean_response,
            "start_time": start_time,
            "end_time": end_time
        }
    except Exception as e:
        logging.error(f"Error in chat: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


SEGMENT_FOLDER = "temp/segments"

@app.get("/temp/segments/{filename}")
async def get_segment(filename: str):   
    file_path = os.path.join(SEGMENT_FOLDER, f"{filename}.wav")

    if not os.path.exists(file_path):
        return {"error": "File not found", "filename": file_path}

    return FileResponse(file_path, media_type="audio/wav", filename=f"{filename}.wav")
