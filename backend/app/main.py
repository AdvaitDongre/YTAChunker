from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse  # ✅ Add this import
from pydantic import BaseModel
from app.utils.downloader import download_video_and_audio, transcribe_audio_with_timestamps
from app.utils.llama_segmenter import segment_text_with_llama70b
from app.utils.groq_client import GroqClient
from pydub import AudioSegment
import os
import json
import logging

logging.basicConfig(level=logging.ERROR)

app = FastAPI()

groq_client = GroqClient()

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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

@app.post("/process-youtube")
async def process_youtube(request: YouTubeRequest):
    youtube_url = request.youtube_url

    try:
        # Paths
        video_path = "temp/video.mp4"
        audio_path = "temp/audio.wav"
        output_folder = "temp/segments"
        json_path = "temp/transcript_original.json"  # Correct JSON file path

        # Step 1: Download video and extract audio
        video_filepath, audio_filepath = download_video_and_audio(youtube_url, video_path, audio_path)

        # Step 3: Transcription and segmentation
        transcript_segments = transcribe_audio_with_timestamps(audio_filepath)
        full_transcript = " ".join([segment["text"] for segment in transcript_segments])
        text_chunks = segment_text_with_llama70b(full_transcript)

        # Step 4: Split audio by text chunks
        audio_text_pairs = split_audio_by_chunks(audio_filepath, text_chunks, output_folder)

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

        return {
            "message": "Processing complete",
            "segments": audio_text_pairs,
            "metadata_path": metadata_path
        }

    except Exception as e:
        logging.error(f"Error processing YouTube request: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/chat")
async def chat(request: ChatRequest):
    try:
        response = groq_client.query_llm(request.user_message)
        return {"response": response["response"]}
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
