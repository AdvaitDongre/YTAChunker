import os
from pydub import AudioSegment
from sentence_transformers import SentenceTransformer
import spacy

# Load SpaCy and SentenceTransformer models
nlp = spacy.load("en_core_web_sm")
sentence_model = SentenceTransformer("all-MiniLM-L6-v2")


def segment_text_semantically(text):
    """
    Segments text into sentences using SpaCy.
    """
    doc = nlp(text)
    sentences = [sent.text.strip() for sent in doc.sents]
    return sentences


def cluster_sentences_by_topic(sentences, max_sentences_per_chunk=5):
    """
    Clusters sentences semantically using SentenceTransformer.
    Groups sentences into chunks with a maximum of 'max_sentences_per_chunk'.
    """
    embeddings = sentence_model.encode(sentences)
    clusters = []
    current_chunk = []

    for i, (sentence, embedding) in enumerate(zip(sentences, embeddings)):
        if len(current_chunk) < max_sentences_per_chunk:
            current_chunk.append(sentence)
        else:
            clusters.append(current_chunk)
            current_chunk = [sentence]

    if current_chunk:  # Append any remaining sentences
        clusters.append(current_chunk)

    return clusters


from pydub import AudioSegment
import os
from app.utils.llama_segmenter import segment_text_with_llama70b

def split_audio_by_timestamps(audio_filepath, transcript, output_folder="segments"):
    """
    Splits audio into chunks based on LLaMA-generated semantic text segments and saves them.
    """
    # Segment the transcript semantically using LLaMA
    text_chunks = segment_text_with_llama70b(transcript)

    # Approximate timestamps for chunks
    timestamps = []
    total_time = 0
    for chunk in text_chunks:
        chunk_duration = len(chunk) * 0.075  # Approximation: 1 character = ~0.075 seconds
        start_time = total_time
        end_time = total_time + chunk_duration
        timestamps.append((start_time, end_time, chunk))
        total_time = end_time

    # Split the audio based on the calculated timestamps
    audio = AudioSegment.from_wav(audio_filepath)
    os.makedirs(output_folder, exist_ok=True)
    audio_text_pairs = []

    for i, (start_time, end_time, text) in enumerate(timestamps):
        start_ms = int(start_time * 1000)
        end_ms = int(end_time * 1000)
        chunk_audio = audio[start_ms:end_ms]
        chunk_path = os.path.join(output_folder, f"chunk_{i + 1}.wav")
        chunk_audio.export(chunk_path, format="wav")
        audio_text_pairs.append({"audio_path": chunk_path, "text": text})

    return audio_text_pairs



from app.utils.audio_segmenter import split_audio_by_timestamps

def process_audio_and_transcript(audio_filepath, transcript):
    """
    Processes the audio and transcript to create semantically aligned chunks using LLaMA.
    """
    audio_text_pairs = split_audio_by_timestamps(audio_filepath, transcript)
    return audio_text_pairs

