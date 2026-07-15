from langchain_ollama import ChatOllama
from langchain_groq import ChatGroq

llm = ChatOllama(
    model="qwen2.5-coder:3b",
    temperature=0.1
)

