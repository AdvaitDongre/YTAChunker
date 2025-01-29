# YTAChunker

YTAChunker is a Python-based application that takes a YouTube video as input and segments its audio into smaller, manageable chunks. The project uses several audio processing techniques to ensure accurate segmentation based on speech patterns and silence intervals.

## Features

- **Audio Segmentation**: The core functionality of YTAChunker is to divide the audio track of a YouTube video into smaller chunks.
- **Multiple Segmenting Strategies**: The application offers various ways to process and segment audio files, including methods like whisper chunking and semantic segmentation.
- **Integration with External Libraries**: It leverages libraries such as LangChain, Whisper, and LLaMA for accurate speech-to-text transcription and intelligent chunking.
- **Streamlit Interface**: A simple Streamlit application to interact with the tool, providing a UI to upload videos and download segmented audio.
- **Automatic Download**: Download YouTube videos and extract audio automatically.

## Installation

### Prerequisites
Before running this application, ensure you have Python 3.8+ installed and a virtual environment set up. You also need the following libraries:

- `whisper`
- `pydub`
- `langchain`
- `streamlit`
- `yt_dlp` (for downloading YouTube videos)

To install the necessary dependencies, run:

```bash
pip install -r requirements.txt
```

## Usage

### 1. Download YouTube Video
To download a YouTube video and extract its audio, use the `downloader.py` script, which utilizes the `pytube` library to fetch the video.

### 2. Segmentation
Use the provided segmentation scripts to process the audio. There are several strategies available for segmentation, which can be customized:

- **Whisper Chunking**: Utilizes OpenAI's Whisper model to transcribe and split the audio based on detected speech.
- **Semantic Segmentation**: Uses semantic models like LLaMA to divide audio into meaningful segments based on the context of the conversation.

### 3. Streamlit Application
To launch a user-friendly interface for uploading a YouTube URL and receiving the segmented audio, run:

```bash
streamlit run app/streamlit_app.py
```

This will start a local web server where you can interact with the tool.

### 4. Access Segments
Once the segmentation is done, the audio will be divided into smaller files, located in the `temp/segments` folder. You can find the segmented audio files (e.g., `chunk_1.wav`, `chunk_2.wav`) there.

## Project Structure

```bash
YTAChunker/
│
├── app/
│   ├── __init__.py
│   ├── main.py
│   ├── streamlit_app.py
│   └── utils/
│       ├── __init__.py
│       ├── audio_segmenter.py
│       ├── langchain_qna.py
│       ├── semantic_audio_segmenter.py
│       ├── downloader.py
│       ├── llama_segmenter.py
│       ├── whisper_chunking.py
│       └── whisper_transcriber.py
│
├── temp/
│   ├── Java_in_100_Seconds_audio_transcript_original.json
│   ├── Java_in_100_Seconds_audio.wav
│   ├── Machine_Learning_Explained_in_100_Seconds_audio.wav
│   └── segments/
│       ├── chunk_1.wav
│       ├── chunk_2.wav
│       └── ...
│
├── __init__.py
├── requirements.txt
└── README.md
```

## Contributing

Feel free to open issues and submit pull requests for bug fixes, enhancements, or new features. Contributions are welcome!
