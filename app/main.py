# app/main.py
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from app.utils.downloader import download_video_and_audio, transcribe_audio_with_timestamps
from app.utils.llama_segmenter import segment_text_with_llama70b
from app.utils.whisper_chunking import transcribe_and_chunk_audio
from pydub import AudioSegment
import os
from app.utils.langchain_qna import answer_query
import json
from dotenv import load_dotenv

app = FastAPI()

# Load environment variables
load_dotenv()

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Update this as needed
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
class QNARequest(BaseModel):
    query: str
    json_folder_path: str

class QNAResponse(BaseModel):
    answer: str

class YouTubeRequest(BaseModel):
    youtube_url: str

global_semantic_chunks_path=None

def split_audio_by_chunks(audio_path: str, text_chunks: list[str], output_folder: str) -> list[dict]:
    """
    Splits audio into segments based on the number of text chunks and saves them.
    """
    audio = AudioSegment.from_wav(audio_path)
    os.makedirs(output_folder, exist_ok=True)

    total_audio_duration = len(audio) / 1000  # Total audio duration in seconds
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
            "audio_path": chunk_path
        })
        current_time = end_time

    return audio_text_pairs

@app.post("/process-youtube")
async def process_youtube(request: YouTubeRequest):
    youtube_url = request.youtube_url
    try:
        # Step 1: Download video and extract audio
        video_title, video_filepath, audio_filepath = download_video_and_audio(youtube_url)

        # Define paths based on video title
        sanitized_title = video_title
        output_folder = os.path.join("temp", f"{sanitized_title}_segments")
        os.makedirs(output_folder, exist_ok=True)

        # Step 2: Generate transcript with timestamps
        transcript_segments = transcribe_audio_with_timestamps(audio_filepath)
        full_transcript = " ".join([segment["text"] for segment in transcript_segments])

        # Step 3: Segment transcript semantically using LLaMA
        text_chunks = segment_text_with_llama70b(full_transcript)

        # Step 4: Split audio by text chunks
        audio_text_pairs = split_audio_by_chunks(audio_filepath, text_chunks, output_folder)

        # Step 5: Save metadata
        metadata_path = os.path.join(output_folder, "metadata.json")
        with open(metadata_path, "w") as metadata_file:
            json.dump(audio_text_pairs, metadata_file, indent=4)

        return {
            "message": "Processing complete",
            "video_title": video_title,
            "segments": audio_text_pairs,
            "metadata_path": metadata_path,
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/process-youtube-chunking")
async def process_youtube_chunking(request: YouTubeRequest):
    youtube_url = request.youtube_url
    global global_semantic_chunks_path
    try:
        # Step 1: Download video and extract audio
        video_title, video_filepath, audio_filepath = download_video_and_audio(youtube_url)

        # Define paths based on video title
        sanitized_title = video_title
        output_folder = os.path.join("temp", f"{sanitized_title}_fixed_chunks")
        os.makedirs(output_folder, exist_ok=True)

        # Step 2: Transcribe and perform fixed-duration chunking
        fixed_chunks, semantic_chunks = transcribe_and_chunk_audio(audio_filepath, output_folder, sanitized_title)

        return {
            "message": "Fixed-duration chunking complete",
            "video_title": video_title,
            "fixed_chunks": fixed_chunks,
            "semantic_chunks": semantic_chunks,
            "fixed_chunks_path": os.path.join(output_folder, f"{sanitized_title}_fixed_chunks.json"),
            "semantic_chunks_path": os.path.join(output_folder, f"{sanitized_title}_semantic_chunks.json"),
        }
        global_semantic_chunks_path = os.path.join(output_folder, f"{sanitized_title}_semantic_chunks.json")


    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/qna", response_model=QNAResponse)
async def qna_query(request: QNARequest):
    """
    Endpoint to summarize a query based on semantic JSON files.
    Args:
        request (SummarizeRequest): The request containing the query and JSON file path.
    Returns:
        SummarizeResponse: The summarized answer.
    """
    global global_semantic_chunks_path
    try:
        # Ensure the JSON file path is valid and properly formatted
        json_file_path = request.json_folder_path.replace("\\", "/")   # Replace backslashes with forward slashes

        # Check if the JSON file exists
        if not os.path.isfile(json_file_path):
            raise HTTPException(status_code=404, detail="Semantic JSON file not found.")

        answer = answer_query(request.query, json_file_path)
        return QNAResponse(answer=answer)
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/")
async def read_root():
    return {"Welcome to Youtube Chunking and video querying ;)"}

