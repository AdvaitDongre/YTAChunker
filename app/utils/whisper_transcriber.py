# app/utils/whisper_transcribe.py
import whisper
import os
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

def generate_transcript(video_path: str, output_folder="temp") -> str:
    """
    Generates a transcript using Whisper and saves it to a dynamically named text file.
    Returns the path to the transcript file.
    """
    # Ensure the output folder exists
    os.makedirs(output_folder, exist_ok=True)

    # Load Whisper model
    model = whisper.load_model("base")

    # Generate transcript
    result = model.transcribe(video_path)
    transcript = result['text']

    # Extract video title from the video path
    video_filename = os.path.basename(video_path)
    video_title = os.path.splitext(video_filename)[0].replace("_video", "")
    sanitized_title = sanitize_filename(video_title)

    # Save transcript to a dynamically named file
    transcript_file = os.path.join(output_folder, f"{sanitized_title}_transcript.txt")
    with open(transcript_file, 'w') as f:
        f.write(transcript)

    return transcript_file
