import streamlit as st
import requests
import json

# Set the FastAPI backend URL
FASTAPI_URL = "http://localhost:8000"  # Adjust if FastAPI runs on a different port

st.title("YouTube Video Processor and Query Tool")

# Section 1: Process YouTube Video
st.header("Process YouTube Video and create chunks with llama-3.2-11b-vision-preview")

youtube_url = st.text_input("Enter YouTube URL:", "")

if st.button("Process Video"):
    if youtube_url:
        with st.spinner("Processing..."):
            try:
                response = requests.post(f"{FASTAPI_URL}/process-youtube", json={"youtube_url": youtube_url})
                response.raise_for_status()
                data = response.json()
                st.success("Video processed successfully!")
                st.json(data)
            except requests.exceptions.RequestException as e:
                st.error(f"Error processing video: {e}")
    else:
        st.warning("Please enter a YouTube URL.")

# Section 2: Process YouTube with Chunking
st.header("Process YouTube Video with Whisper Chunking")

if st.button("Process Video with Chunking"):
    if youtube_url:
        with st.spinner("Processing with Chunking..."):
            try:
                response = requests.post(f"{FASTAPI_URL}/process-youtube-chunking", json={"youtube_url": youtube_url})
                response.raise_for_status()
                data = response.json()
                st.success("Video processed with chunking successfully!")
                st.json(data)
            except requests.exceptions.RequestException as e:
                st.error(f"Error processing video with chunking: {e}")
    else:
        st.warning("Please enter a YouTube URL.")

# Section 3: QNA Video
st.header("Ask a Query Based on Video")

query = st.text_input("Enter your query:", "")
json_folder_path = st.text_input("Enter JSON Folder Path:", "")

if st.button("Get Response"):
    if query and json_folder_path:
        with st.spinner("Answering the query..."):
            try:
                payload = {
                    "query": query,
                    "json_folder_path": json_folder_path
                }
                response = requests.post(f"{FASTAPI_URL}/qna", json=payload)
                response.raise_for_status()
                data = response.json()
                st.success("Answer generated successfully!")
                st.text_area("Answer:", value=data["answer"], height=200)
            except requests.exceptions.RequestException as e:
                st.error(f"Error analysing query: {e}")
    else:
        st.warning("Please enter both query and JSON folder path.")
