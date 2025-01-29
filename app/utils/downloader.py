# app/utils/downloader.py
import os
import yt_dlp
import subprocess
import whisper
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

def download_video_and_audio(url, temp_folder="temp") -> tuple:
    """
    Downloads the lowest quality video with the best audio from a YouTube video,
    extracts the video title, converts the video to MP4 if necessary, extracts audio using FFmpeg,
    and returns the sanitized video title along with paths to the video and audio files.
    """
    # Ensure the temp folder exists
    os.makedirs(temp_folder, exist_ok=True)

    ydl_opts = {
        'format': 'worstvideo+bestaudio/best',  # Lowest video quality with the best audio
        'noplaylist': True,  # Do not download playlists
        'quiet': True,
        'no_warnings': True,
        'outtmpl': os.path.join(temp_folder, '%(title)s.%(ext)s'),
    }

    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        info_dict = ydl.extract_info(url, download=True)
        video_title = info_dict.get('title', 'video')
        video_ext = info_dict.get('ext', 'mp4')
        video_filename = ydl.prepare_filename(info_dict)
        sanitized_title = sanitize_filename(video_title)
        video_output_path = os.path.join(temp_folder, f"{sanitized_title}_video.mp4")
        audio_output_path = os.path.join(temp_folder, f"{sanitized_title}_audio.wav")

        # Convert to MP4 if not already
        if not video_filename.endswith(".mp4"):
            command = [
                "ffmpeg",
                "-i", video_filename,
                "-c:v", "libx264",
                "-preset", "fast",
                "-crf", "23",
                "-c:a", "aac",
                video_output_path,
                "-y"  # Overwrite without asking
            ]
            subprocess.run(command, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
            os.remove(video_filename)  # Clean up the raw video file
        else:
            # Rename the file to include the sanitized title
            os.rename(video_filename, video_output_path)

        # Extract audio using FFmpeg
        command = [
            "ffmpeg",
            "-i", video_output_path,
            "-vn",
            "-acodec", "pcm_s16le",
            "-ar", "44100",
            "-ac", "2",
            audio_output_path,
            "-y"  # Overwrite without asking
        ]
        subprocess.run(command, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

        return sanitized_title, video_output_path, audio_output_path

def transcribe_audio_with_timestamps(audio_filepath: str, model_type="base", max_chunk_duration: int = 15) -> list:
    """
    Transcribes audio and aligns text with timestamps, ensuring each chunk is <= max_chunk_duration.
    Returns a list of transcript segments with timestamps.
    """
    import json

    model = whisper.load_model(model_type)  # Load Whisper model
    result = model.transcribe(audio_filepath, task="transcribe", verbose=False)

    # Save the original transcript to a file in the same directory as the audio file
    transcript_original_path = os.path.splitext(audio_filepath)[0] + "_transcript_original.json"
    with open(transcript_original_path, "w") as transcript_file:
        json.dump(result, transcript_file, indent=4)

    # Extract segments with text and timestamps
    aligned_transcript = []
    for segment in result["segments"]:
        start_time = segment["start"]
        end_time = segment["end"]
        text = segment["text"].strip()

        # If segment duration exceeds the max_chunk_duration, split it
        while end_time - start_time > max_chunk_duration:
            mid_time = start_time + max_chunk_duration
            aligned_transcript.append({
                "start": start_time,
                "end": mid_time,
                "text": f"{text[:len(text)//2]} (truncated)"
            })
            text = text[len(text)//2:].strip()
            start_time = mid_time

        # Add the final (or single) chunk
        aligned_transcript.append({
            "start": start_time,
            "end": end_time,
            "text": text
        })

    return aligned_transcript
