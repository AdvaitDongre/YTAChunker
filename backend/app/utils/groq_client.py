import os
import json
import re
from groq import Groq
from typing import List
from sentence_transformers import SentenceTransformer
import faiss  # Vector database for retrieval

class GroqClient:
    def __init__(self):
        self.client = Groq()
        self.temp_dir = "temp"
        os.makedirs(self.temp_dir, exist_ok=True)

        # Initialize the embedding model and FAISS index
        self.embedding_model = SentenceTransformer("all-MiniLM-L6-v2")
        self.index = faiss.IndexFlatL2(384)
        self.documents = []

    def add_documents(self, docs: List[str]):
        embeddings = self.embedding_model.encode(docs)
        self.index.add(embeddings)
        self.documents.extend(docs)

    def load_documents_from_json(self, file_path: str):
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"File not found: {file_path}")

        with open(file_path, 'r', encoding='utf-8') as file:
            data = json.load(file)
            if "segments" in data:
                docs = [segment["text"] for segment in data["segments"] if "text" in segment]
                self.add_documents(docs)
            else:
                raise ValueError("JSON file does not contain 'segments' key.")

    def retrieve_context(self, query: str, top_k: int = 5) -> List[str]:
        query_embedding = self.embedding_model.encode([query])
        distances, indices = self.index.search(query_embedding, top_k)
        return [self.documents[i] for i in indices[0] if i < len(self.documents)]

    def query_llm(self, user_message: str):
        retrieved_docs = self.retrieve_context(user_message)
        retrieved_text = "\n\n".join(retrieved_docs)

        if not retrieved_docs:
            return {
                "response": "I'm sorry, I couldn't find relevant information in the provided document.",
                "summary": "No relevant information found.",
                "source": "No relevant source found."
            }

        prompt = f"""
        You are an AI assistant providing structured, high-quality responses.
        - Context is provided below.
        - Respond concisely but with useful details.
        - Mention key facts, definitions, and examples.
        - Provide a **single** reliable source link that is **directly related** to the text.
        - Ensure the source is valid and properly formatted.
        - If no suitable source is found, return "No relevant source found."
        - Format sources under a 'Sources' section.

        **Context:**
        {retrieved_text}

        **Query:** {user_message}
        """

        completion = self.client.chat.completions.create(
            model="llama-3.2-11b-vision-preview",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.6,
            max_tokens=1024,
            top_p=0.9,
            stream=False
        )

        full_response = completion.choices[0].message.content.strip()
        source = self.extract_source(full_response)
        summary = self.clean_summary(self.generate_summary(full_response))

        return {
            "response": full_response,
            "summary": summary,
            "source": source
        }

    def extract_source(self, text: str):
        urls = re.findall(r'https?://[^\s()]+', text)
        if urls:
            return urls[0].strip("()")
        return "No relevant source found."

    def generate_summary(self, text: str):
        summary_prompt = f"""
        Summarize the following text in bullet points.

        **Text to summarize:** {text[:2000]}

        **Instructions:**
        - Write the summary in a **single paragraph**.
        - Do not use bullet points.
        - Preserve key facts and important details.
        - Do not include any URLs in the summary.
        - Retain the source if applicable.
        Summary:
        """

        summary_completion = self.client.chat.completions.create(
            model="llama-3.2-11b-vision-preview",
            messages=[{"role": "user", "content": summary_prompt}],
            temperature=0.6,
            max_tokens=500,
            top_p=0.9,
            stream=False
        )

        return summary_completion.choices[0].message.content.strip()

    def clean_summary(self, summary: str) -> str:
        cleaned_summary = re.sub(r"<think>.*?</think>", "", summary, flags=re.DOTALL).strip()
        return cleaned_summary
    def format_response(self, response: str) -> str:
        """
        Cleans the response to return a simple plain-text paragraph:
        - Removes formatting (*, **, bullet points, headers)
        - Strips extra whitespace and newlines
        - Removes sources and URLs
        """
        # Remove markdown formatting
        response = re.sub(r"[*_#>-]", "", response)
        # Remove excessive newlines
        response = re.sub(r"\n+", " ", response).strip()
        # Remove URLs
        response = re.sub(r'https?://[^\s]+', "", response)
        return response