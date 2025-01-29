# app/utils/whisper_chunking.py
import whisper
import os
import json
import re

def sanitize_filename(name: str) -> str:
    """
    Sanitizes the filename by removing or replacing invalid characters.
    """
    # Remove invalid characters
    sanitized = re.sub(r'[\\/*?:"<>|]', "", name)
    # Replace spaces with underscores
    sanitized = re.sub(r'\s+', '_', sanitized)
    return sanitized

def transcribe_and_chunk_audio(audio_filepath: str, output_folder: str, video_title: str) -> tuple:
    """
    Transcribes the audio using Whisper and performs fixed-duration chunking.
    Saves the fixed and semantic chunks as JSON files.
    
    Returns:
        fixed_chunks (list): List of fixed-duration chunks.
        semantic_chunks (list): List of semantic chunks.
    """
    # Load Whisper model
    model = whisper.load_model("small")  # You can choose "tiny", "small", "base", "large"

    # Perform transcription
    result = model.transcribe(audio_filepath)
    segments = result["segments"]  # Contains start, end, and text for each segment
    full_text = result["text"]     # Complete transcription

    # Define sanitized title
    sanitized_title = sanitize_filename(video_title)

    # Initialize lists for chunks
    fixed_chunks = []
    semantic_chunks = []

    # Fixed-duration chunking parameters
    chunk_duration = 15  # seconds
    current_chunk = {"start": 0, "end": chunk_duration, "text": ""}

    for segment in segments:
        start = segment["start"]
        end = segment["end"]
        text = segment["text"]

        # Add text to the current chunk
        if start < current_chunk["end"]:
            current_chunk["text"] += text + " "
        else:
            # Append the completed chunk and start a new one
            fixed_chunks.append(current_chunk)
            current_chunk = {"start": current_chunk["end"], "end": current_chunk["end"] + chunk_duration, "text": text}

    # Append the last chunk
    fixed_chunks.append(current_chunk)

    # Extract semantic chunks (can be refined as needed)
    semantic_chunks = [{"start": seg["start"], "end": seg["end"], "text": seg["text"]} for seg in segments]

    # Save fixed chunks
    fixed_chunks_path = os.path.join(output_folder, f"{sanitized_title}_fixed_chunks.json")
    with open(fixed_chunks_path, "w") as f:
        json.dump(fixed_chunks, f, indent=2)

    # Save semantic chunks
    semantic_chunks_path = os.path.join(output_folder, f"{sanitized_title}_semantic_chunks.json")
    with open(semantic_chunks_path, "w") as f:
        json.dump(semantic_chunks, f, indent=2)

    return fixed_chunks, semantic_chunks
