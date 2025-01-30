import os
import yt_dlp
import subprocess
import whisper
import shutil

def download_video_and_audio(url, video_output_path="temp/video.mp4", audio_output_path="temp/audio.wav"):
    """
    Downloads the lowest quality video with the best audio from a YouTube video,
    converts the video to MP4 if necessary, extracts audio using FFmpeg, and saves both files.
    """
    # Ensure the output folder exists
    output_folder = os.path.dirname(video_output_path)
    if os.path.exists(output_folder):
        shutil.rmtree(output_folder)
    os.makedirs(os.path.dirname(video_output_path), exist_ok=True)

    # Temporary file to download the raw video
    raw_video_path = "temp/raw_video"

    # Step 1: Download the lowest quality video + best audio (merged) in its original format
    ydl_opts = {
        'format': 'worstvideo+bestaudio/worst',  # Lowest video quality with the best audio
        'outtmpl': raw_video_path,  # Save the raw video file (extension will be added by yt-dlp)
        'noplaylist': True,  # Do not download playlists
    }
    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        ydl.download([url])

    # Detect the actual downloaded video file with its extension
    raw_video_path_with_extension = None
    for file in os.listdir("temp"):
        if file.startswith("raw_video"):
            raw_video_path_with_extension = os.path.join("temp", file)
            break

    if not raw_video_path_with_extension:
        raise Exception("Video download failed.")

    # Step 2: Convert the raw video to MP4 using FFmpeg if it's not already in MP4 format
    if not raw_video_path_with_extension.endswith(".mp4"):
        command = f"ffmpeg -i {raw_video_path_with_extension} -c:v libx264 -preset fast -crf 23 -c:a aac {video_output_path}"
        subprocess.run(command, shell=True, check=True)
        os.remove(raw_video_path_with_extension)  # Clean up the raw video file
    else:
        # If already in MP4 format, just rename it
        os.rename(raw_video_path_with_extension, video_output_path)

    # Step 3: Extract the audio from the MP4 video using FFmpeg
    command = f"ffmpeg -i {video_output_path} -vn -acodec pcm_s16le -ar 44100 -ac 2 {audio_output_path}"
    subprocess.run(command, shell=True, check=True)

    return video_output_path, audio_output_path

def transcribe_audio(audio_path, model_type="base"):
    """
    Transcribes audio using OpenAI's Whisper model.
    """
    model = whisper.load_model(model_type)  # Load Whisper model (e.g., "base", "small", "large")
    result = model.transcribe(audio_path)
    transcript = result['text']
    return transcript
def transcribe_audio_with_timestamps(audio_filepath: str, max_chunk_duration: int = 15):
    """
    Transcribes audio and aligns text with timestamps, ensuring each chunk is <= max_chunk_duration.
    Saves the original transcript in the /temp folder.
    """
    import json

    model = whisper.load_model("base")  # Load the Whisper model
    result = model.transcribe(audio_filepath, task="transcribe", verbose=True)

    # Save the original transcript to a file in the /temp folder
    original_transcript_path = "temp/transcript_original.json"
    os.makedirs(os.path.dirname(original_transcript_path), exist_ok=True)
    with open(original_transcript_path, "w") as transcript_file:
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
            text = text[len(text)//2:]  # Keep splitting the remaining text
            start_time = mid_time

        # Add the final (or single) chunk
        aligned_transcript.append({
            "start": start_time,
            "end": end_time,
            "text": text
        })

    return aligned_transcript
