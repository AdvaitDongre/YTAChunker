import whisper
import os

# Load Whisper model
model = whisper.load_model("base")

def generate_transcript(video_path, output_folder="temp"):
    # Ensure the output folder exists
    os.makedirs(output_folder, exist_ok=True)

    # Generate transcript
    result = model.transcribe(video_path)
    transcript = result['text']

    # Save transcript to file
    transcript_file = os.path.join(output_folder, "transcript.txt")
    with open(transcript_file, 'w') as f:
        f.write(transcript)

    return transcript_file
