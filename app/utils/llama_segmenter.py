# app/utils/llama_segmenter.py
from typing import List
from pydantic import BaseModel
import os
from groq import Groq
from dotenv import load_dotenv
import re

# Load environment variables from .env file
load_dotenv()

# Access the GROQ_API_KEY
api_key = os.getenv("GROQ_API_KEY")
if not api_key:
    raise ValueError("GROQ_API_KEY is not set. Please check your .env file.")

# Initialize the Groq client with the API key
client = Groq(api_key=api_key)

# Data models for handling segments
class Segment(BaseModel):
    text: str
    start_time: float
    end_time: float

def sanitize_text(text: str) -> str:
    """
    Sanitizes text to remove any unwanted characters.
    """
    return re.sub(r'\s+', ' ', text).strip()

def segment_text_with_llama70b(input_text: str, max_chunk_duration: float = 15.0) -> List[str]:
    """
    Segments the given text using the LLaMA model.
    Ensures segmentation adheres strictly to the input text and uses a simple output format.
    """
    system_message = (
        "You are a text segmentation assistant. Your task is to split the provided text "
        "into chunks based on semantic meaning. Respond strictly in this format:\n\n"
        "CHUNK_NO.1: {TEXT}\nCHUNK_NO.2: {TEXT}\n\n"
        "Do not include anything else in your response. Only provide the chunks."
    )

    completion = client.chat.completions.create(
        model="llama-3.2-11b-vision-preview",
        messages=[
            {"role": "system", "content": system_message},
            {"role": "user", "content": f"Segment this text:\n\n{input_text}"},
        ],
        temperature=0.6,
        max_completion_tokens=4096,
        top_p=0.95,
        stream=False,
    )

    response = completion.choices[0].message.content.strip()

    # Ensure the response is not empty
    if not response:
        raise ValueError("The model returned an empty response.")

    # Split the response into individual chunks
    try:
        chunks = [sanitize_text(line.split(": ", 1)[-1]) for line in response.splitlines() if line.strip()]
        return chunks
    except Exception as e:
        print("Failed to parse response:", repr(response))
        raise ValueError("The model returned an invalid response format.") from e
