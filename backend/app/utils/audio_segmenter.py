import os
from pydub import AudioSegment
import whisper

def load_transcription_with_timestamps(audio_filepath, model_type="base"):
    """
    Uses Whisper to transcribe audio and get timestamps for each segment.
    """
    model = whisper.load_model(model_type)
    result = model.transcribe(audio_filepath, task="transcribe", verbose=True)
    return result["segments"]

def segment_audio_text_pairs(audio_filepath, transcript_segments, output_folder="segments", max_chunk_duration=15):
    """
    Segments the audio into chunks aligned with transcript segments.
    Each chunk is no longer than max_chunk_duration seconds.
    """
    # Load audio file
    audio = AudioSegment.from_wav(audio_filepath)
    
    # Ensure the output folder exists
    os.makedirs(output_folder, exist_ok=True)

    # List to store audio-text pair metadata
    audio_text_pairs = []

    for i, segment in enumerate(transcript_segments):
        start_time = segment["start"] * 1000  # Convert to milliseconds
        end_time = segment["end"] * 1000  # Convert to milliseconds
        text = segment["text"].strip()

        # If the segment duration is <= max_chunk_duration, save as-is
        if (end_time - start_time) / 1000 <= max_chunk_duration:
            chunk = audio[start_time:end_time]
            chunk_path = os.path.join(output_folder, f"chunk_{i + 1}.wav")
            chunk.export(chunk_path, format="wav")
            audio_text_pairs.append({"audio_path": chunk_path, "text": text})
        else:
            # Split the segment further if it exceeds max_chunk_duration
            current_start = start_time
            while (end_time - current_start) / 1000 > max_chunk_duration:
                split_end = current_start + max_chunk_duration * 1000
                chunk = audio[current_start:split_end]
                chunk_path = os.path.join(output_folder, f"chunk_{i + 1}_part.wav")
                chunk.export(chunk_path, format="wav")
                
                # Split the text approximately in half
                split_point = len(text) // 2
                first_half = text[:split_point].strip()
                text = text[split_point:].strip()
                
                audio_text_pairs.append({"audio_path": chunk_path, "text": first_half})
                current_start = split_end

            # Handle the final chunk for the remaining audio
            final_chunk = audio[current_start:end_time]
            final_chunk_path = os.path.join(output_folder, f"chunk_{i + 1}_final.wav")
            final_chunk.export(final_chunk_path, format="wav")
            audio_text_pairs.append({"audio_path": final_chunk_path, "text": text})

    return audio_text_pairs
