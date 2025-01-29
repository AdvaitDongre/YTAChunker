# utils/langchain_summarize.py

from langchain_huggingface import HuggingFaceEmbeddings
from langchain_community.vectorstores import FAISS
from langchain_groq import ChatGroq
from langchain_core.prompts import ChatPromptTemplate
from langchain_community.document_loaders import TextLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain.chains.combine_documents import create_stuff_documents_chain
from langchain.chains import create_retrieval_chain
from dotenv import load_dotenv
import os
import json
import tempfile

# Load environment variables
load_dotenv()
groq_api_key = os.getenv('GROQ_API_KEY')

# Initialize embeddings and text splitter
embeddings = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")
text_splitter = RecursiveCharacterTextSplitter(
    chunk_size=1000,
    chunk_overlap=200,
    length_function=len,
    is_separator_regex=False,
)

def convert_json_to_text(json_file_path):
    """
    Convert a single semantic JSON file to a text file.

    Args:
        json_file_path (str): Path to the semantic JSON file.

    Returns:
        str: Path to the temporary text file containing concatenated text.
    """
    all_text = []
    try:
        with open(json_file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
            # Check if the JSON is a list of segments
            if isinstance(data, list):
                for segment in data:
                    text = segment.get('text', '')
                    all_text.append(text)
            elif isinstance(data, dict):
                # If the JSON is a single object with a 'text' field
                text = data.get('text', '')
                all_text.append(text)
            else:
                # Unsupported JSON structure
                pass
    except Exception as e:
        raise ValueError(f"Error reading JSON file: {e}")

    concatenated_text = "\n".join(all_text)

    # Write to a temporary text file
    temp_text_file = tempfile.NamedTemporaryFile(delete=False, suffix='.txt', mode='w', encoding='utf-8')
    temp_text_file.write(concatenated_text)
    temp_text_file.close()

    return temp_text_file.name

def answer_query(query: str, json_file_path: str):
    """
    Answer the query based on the semantic JSON file.

    Args:
        query (str): The user's query.
        json_file_path (str): Path to the semantic JSON file.

    Returns:
        str: The response.
    """
    # Convert JSON file to a temporary text file
    text_file_path = convert_json_to_text(json_file_path)

    # Load documents from the text file
    loader = TextLoader(text_file_path, encoding="utf-8")
    docs = loader.load()

    if not docs:
        raise ValueError("No documents found in the JSON file.")

    # Split documents into chunks
    text_docs = text_splitter.split_documents(docs)

    if not text_docs:
        raise ValueError("No text chunks created from the documents.")

    # Initialize the language model
    model = 'llama-3.1-8b-instant'  # Ensure this model is available and properly configured
    groq_llm = ChatGroq(
        model=model,
        api_key=groq_api_key
    )

    # Create FAISS vector store from documents
    faiss_vectorstore = FAISS.from_documents(text_docs, embeddings)

    if not faiss_vectorstore:
        raise ValueError("Failed to create FAISS vector store from text chunks.")

    # Define the prompt template
    prompt_template = ChatPromptTemplate([
        ("system", "You are a YouTube Video transcript explainer. Your job is to answer the query with respect to the {context}."),
        ("user", "{input}")
    ])

    # Create the document chain
    chain = create_stuff_documents_chain(llm=groq_llm, prompt=prompt_template)

    # Create retriever and retrieval chain
    retriever = faiss_vectorstore.as_retriever()
    retriever_chain = create_retrieval_chain(retriever, chain)

    # Invoke the chain with the user's query
    response = retriever_chain.invoke({'input': query})

    # Check if 'answer' exists in the response
    if 'answer' not in response:
        raise KeyError("The response does not contain an 'answer' field.")

    return str(response['answer'])
