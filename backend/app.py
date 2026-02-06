import os
os.environ['NLTK_DATA'] = os.path.join(os.getcwd(),'nltk_data')

from openai import OpenAI
import os
import ast
import json
from flask import Flask, request, jsonify, Response, stream_with_context, send_from_directory
from flask_executor import Executor
# from flask_pymongo import PyMongo
# from flask_session import Session
from docx import Document
from datetime import timedelta
# import pickle
from pymongo import MongoClient
import faiss
import fitz
from docx import Document
from sentence_transformers import SentenceTransformer
from sumy.summarizers.lex_rank import LexRankSummarizer
from sumy.parsers.plaintext import PlaintextParser
from sumy.nlp.tokenizers import Tokenizer
from werkzeug.security import generate_password_hash, check_password_hash
from flask_cors import CORS
from datetime import datetime
# from bson.json_util import dumps
# import hashlib
# import matplotlib.pyplot as plt
import pygraphviz as pgv
import base64
from io import BytesIO
import scrypt
from bson import ObjectId, json_util
import stripe 
import re
from dotenv import load_dotenv

from dataclasses import dataclass, field, asdict
import uuid
from typing import Dict, Any, List, Optional

import logging
from bson import BSON
import shutil
import tempfile
from google.cloud import storage

app = Flask(__name__, static_folder="build", static_url_path="/")

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s - %(message)s"
)
app.logger.setLevel(logging.INFO)

def _log_future_result(job_name: str, filename: str):
    def _cb(fut):
        try:
            fut.result()
            app.logger.info("%s finished OK for %s", job_name, filename)
        except Exception:
            app.logger.exception("%s FAILED for %s", job_name, filename)
    return _cb

CORS(app, supports_credentials=True)

# Load environment variables and configuration
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
load_dotenv(os.path.join(BASE_DIR, '.env'))
 
with open(os.path.join(BASE_DIR, 'config.json'), 'r') as f:
    config = json.load(f)
 
# Override secrets/config from environment when available
config.setdefault('OPENAI', {})
config['OPENAI']['API_KEY'] = os.getenv('OPENAI_API_KEY', config['OPENAI'].get('API_KEY'))
config['OPENAI']['ORG_CODE'] = os.getenv('OPENAI_ORG', config['OPENAI'].get('ORG_CODE'))
config['OPENAI']['OPENAI_CHATGPT_PROMPT_KEY'] = os.getenv(
    'OPENAI_MODEL',
    config['OPENAI'].get('OPENAI_CHATGPT_PROMPT_KEY', config['OPENAI'].get('MODEL'))
)
 
config.setdefault('MongoDB', {})
config['MongoDB']['TEST_URI'] = os.getenv('MONGODB_TEST_URI', config['MongoDB'].get('TEST_URI'))
config['MongoDB']['PROD_URI'] = os.getenv('MONGODB_PROD_URI', config['MongoDB'].get('PROD_URI'))
 
config.setdefault('STRIPE', {})
config['STRIPE']['API_KEY'] = os.getenv('STRIPE_API_KEY', config['STRIPE'].get('API_KEY'))
config['STRIPE']['endpoint_secret'] = os.getenv('STRIPE_ENDPOINT_SECRET', config['STRIPE'].get('endpoint_secret'))

app.config['SECRET_KEY'] = 'your_secret_key'
stripe.api_key = config['STRIPE']['API_KEY']

try:
    client = MongoClient(config["MongoDB"]["TEST_URI"])
    db = client['RxApp']
    users_collection = db['Users'] 
    files_collection = db['Files']   
    saved_collection = db['Saved'] 
    posts_collection = db['Posts']
    notifications_collection = db['Notifications']
    codes_collection = db['Codes']
    print("MongoDB connection established successfully.")
except Exception as e:
    print(f"Failed to connect to MongoDB: {e}")

# Executor for asynchronous tasks
executor = Executor(app)

num_docs = 5

if not os.path.exists("uploads"):
    os.makedirs("uploads")

if not os.path.exists("tmp"):
    os.makedirs("tmp")


UPLOAD_FOLDER = 'uploads/'
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

# Sentence Transformer model initialization
model = SentenceTransformer('paraphrase-MiniLM-L6-v2')

# Summarizer initialization
summarizer = LexRankSummarizer()

def read_pdf(pdf_path):
    text = ""
    doc = fitz.open(pdf_path)
    for page in doc:
        text += page.get_text()
    return text

def read_docx(docx_path):
    text = ""
    doc = Document(docx_path)
    for paragraph in doc.paragraphs:
        text += paragraph.text
    return text

class ChatApp:
    def __init__(self):
        self.messages = [
            {"role": "system", "content": "You are a helpful assistant."},
        ]
        self.client =  OpenAI(
            organization=config['OPENAI']['ORG_CODE'], api_key = config['OPENAI']['API_KEY']
        )

    def chat(self, message):
        self.messages.append({"role": "user", "content": message})
        response = self.client.chat.completions.create(
            model=config['OPENAI']['OPENAI_CHATGPT_PROMPT_KEY'],
            messages=self.messages
        )
        self.messages.append({"role": "assistant", "content": response.choices[0].message.content})
        return response
    def chatStream(self, message):
        try:
            self.messages.append({"role": "user", "content": message})
            for chunk in self.client.chat.completions.create(
                model=config['OPENAI']['OPENAI_CHATGPT_PROMPT_KEY'],
                messages=self.messages,
                stream=True
            ):
                content = chunk.choices[0].delta.content
                if content is not None:
                    # yield only the new content, not the whole resp
                    yield content
        except Exception as e:
            print(e)
            return str(e)

def find_list_in_string(input_string):
    start_index = input_string.find('[')
    end_index = input_string.rfind(']')

    if start_index != -1 and end_index != -1 and start_index < end_index:
        list_str = input_string[start_index:end_index+1]
        return list_str
    else:
        return None    

def find_dict_in_string(input_string):
    start_index = input_string.find('{')
    end_index = input_string.rfind('}')
    if start_index != -1 and end_index != -1 and start_index < end_index:
        dict_str = input_string[start_index:end_index+1]
        return dict_str
    else:
        return None

def read_index(filename):
    index_record = files_collection.find_one({"filename": f'data/{filename}.index'})
    if index_record:
        index_bytes = index_record['index']

        # Save the byte stream to a temporary file
        temp_index_file = f'tmp/{filename}.index'
        with open(temp_index_file, 'wb') as f:
            f.write(index_bytes)

        # Read the index from the temporary file
        index = faiss.read_index(temp_index_file)

        # Remove the temporary file
        os.remove(temp_index_file)

        print(f'Index for {filename} read successfully at ', datetime.now())
        return index
    else:
        print(f'Index for {filename} not found.')
        return None

def create_index(filename):
    # Works with existing read_index() + chat APIs schema:
    # - index doc: {"filename": f"data/{filename}.index", "index": <bytes>}
    # - paragraphs doc: {"filename": f"data/paragraphs_{filename}.pkl", "paragraphs": <list[str]>}
    try:
        # common uploads save into UPLOAD_FOLDER
        pdf_path = os.path.join(app.config["UPLOAD_FOLDER"], filename)

        text = read_pdf(pdf_path)
        if not text:
            return None

        sentences = [sent for sent in text.split('.') if len(sent.split()) > 8]
        paragraphs = [". ".join(sentences[i:i+5]) for i in range(0, len(sentences), 5)]

        if not paragraphs:
            return None

        document_embeddings = model.encode(paragraphs)
        faiss.normalize_L2(document_embeddings)

        dimension = document_embeddings.shape[1]
        index = faiss.IndexFlatIP(dimension)
        index.add(document_embeddings)

        # write faiss index -> bytes
        temp_index_file = f"tmp/{filename}.index"
        faiss.write_index(index, temp_index_file)
        with open(temp_index_file, "rb") as f:
            index_bytes = f.read()
        os.remove(temp_index_file)

        # upsert index
        files_collection.update_one(
            {"filename": f"data/{filename}.index"},
            {"$set": {"index": index_bytes}},
            upsert=True
        )

        # upsert paragraphs
        files_collection.update_one(
            {"filename": f"data/paragraphs_{filename}.pkl"},
            {"$set": {"paragraphs": paragraphs}},
            upsert=True
        )

        return "index"

    except Exception as e:
        app.logger.exception("create_index failed for %s", filename)
        raise

def create_index_bulk(filenames, group_name):
    text = ""

    for filename in filenames:
        if filename.endswith('.pdf'):
            text += read_pdf(os.path.join(app.config['UPLOAD_FOLDER'], filename))
        elif filename.endswith('.docx'):
            text += read_docx(os.path.join(app.config['UPLOAD_FOLDER'], filename))
        elif filename.endswith('.txt'):
            with open(os.path.join(app.config['UPLOAD_FOLDER'], filename), 'r', encoding='utf-8') as file:
                text += file.read()
    if text:
        sentences = [sent for sent in text.split('.') if len(sent.split()) > 8] 
        paragraphs = [". ".join(sentences[i:i+5]) for i in range(0, len(sentences), 5)]
        document_embeddings = model.encode(paragraphs)

        faiss.normalize_L2(document_embeddings)
        dimension = document_embeddings.shape[1]
        index = faiss.IndexFlatIP(dimension) 
        index.add(document_embeddings)
        # Save the index to a temporary file
        temp_index_file = f'tmp/{group_name}.index'
        faiss.write_index(index, temp_index_file)

        # Read the file content into a byte stream
        with open(temp_index_file, 'rb') as f:
            index_bytes = f.read()

        # Remove the temporary file
        os.remove(temp_index_file)
        
        if not files_collection.find_one({"filename": f'data/{group_name}.index'}):
            files_collection.insert_one({
                "filename": f'data/{group_name}.index', 
                "index": index_bytes
            })
        files_collection.insert_one({"filename":f'data/paragraphs_{group_name}.pkl', "paragraphs":paragraphs})
        # faiss.write_index(index, f'data/{filename}.index')
        # with open(f'data/paragraphs_{filename}.pkl', 'wb') as file:
        #     pickle.dump(paragraphs, file)

        print(f'Index created and saved for {group_name} at ', datetime.now())

        return "index"
    return None
        

def create_summary(filename):
    text = None
    if filename.endswith('.pdf'):
        text = read_pdf(os.path.join(app.config['UPLOAD_FOLDER'], filename))
    elif filename.endswith('.docx'):
        text = read_docx(os.path.join(app.config['UPLOAD_FOLDER'], filename))
    elif filename.endswith('.txt'):
        with open(os.path.join(app.config['UPLOAD_FOLDER'], filename), 'r', encoding='utf-8') as file:
            text = file.read()
    if text:
        parser = PlaintextParser.from_string(text, Tokenizer("english"))
        summary = summarizer(parser.document, int(len(re.split(r'[.!?]', text))*.1))
        # summary = summarizer(parser.document, 12)
        lex_summary = ""
        for sentence in summary:
            lex_summary += str(sentence)
        
        summary_filename = f'data/{filename}.txt'
        try:
            if not files_collection.find_one({"filename": summary_filename}):
                files_collection.insert_one({"filename": summary_filename, "summary": lex_summary})
        except Exception as e:
            print("An error occurred while writing the summary file:", e)
                
        print(f'Summary created and saved for {filename} at ', datetime.now())

        return "summary"
    return None

def create_summary_bulk(filenames, group_name):
    text = ""

    for filename in filenames:
        if filename.endswith('.pdf'):
            text += read_pdf(os.path.join(app.config['UPLOAD_FOLDER'], filename))
        elif filename.endswith('.docx'):
            text += read_docx(os.path.join(app.config['UPLOAD_FOLDER'], filename))
        elif filename.endswith('.txt'):
            with open(os.path.join(app.config['UPLOAD_FOLDER'], filename), 'r', encoding='utf-8') as file:
                text += file.read()
    if text:
        parser = PlaintextParser.from_string(text, Tokenizer("english"))
        summary = summarizer(parser.document, int(len(re.split(r'[.!?]', text))*.1))
        # summary = summarizer(parser.document, 12)
        lex_summary = ""
        for sentence in summary:
            lex_summary += str(sentence)
        
        summary_filename = f'data/{group_name}.txt'
        try:
            if not files_collection.find_one({"filename": summary_filename}):
                files_collection.insert_one({"filename": summary_filename, "summary": lex_summary})
        except Exception as e:
            print("An error occurred while writing the summary file:", e)
                
        print(f'Summary created and saved for {group_name} at ', datetime.now())

        return "summary"
    return None

@app.route("/")
def index():
    return app.send_static_file("index.html")


@app.route('/exam')
def exam():
    return app.send_static_file("index.html")

@app.route("/pricing")
def pricing():
    return app.send_static_file("index.html")

@app.route('/dashboard', defaults={'path': ''})
@app.route('/dashboard/<path:path>')
def get_dashboard(path):
    return app.send_static_file("index.html")

@app.route('/community', defaults={'path': ''})
@app.route('/community/<path:path>')
def community(path):
    return app.send_static_file("index.html")

@app.route('/about')
def about():
    return app.send_static_file("index.html")

@app.route('/privacy-policy')
def privacy_policy():
    return app.send_static_file("index.html")

@app.route('/terms-of-service')
def terms_of_service():
    return app.send_static_file("index.html")


@app.route('/api/upload', methods=['POST'])
def upload_files():
    if 'files[]' not in request.files:
        return jsonify({'error': 'No files found in the request'}), 400

    user_email = request.form.get('email')  # Assuming 'email' is sent along with the files
    folder_name = request.form.get('folder_name', None)

    if not user_email:
        return jsonify({'error': 'Email parameter missing'}), 400

    try:
        # Fetch files from the request
        filenames = []
        files = request.files.getlist('files[]')

        # Save each file and collect filenames
        for file in files:
            if file:
                filename = file.filename
                file.save(os.path.join(app.config['UPLOAD_FOLDER'], filename))
                filenames.append(filename)

        # Find or create user based on email
        user = users_collection.find_one({'email': user_email})
        if not user:
            # Create user if not exists
            user_data = {
                'email': user_email,
                'created_at': datetime.now()
                # Add more user-related fields as needed
            }
            users_collection.insert_one(user_data)
            print(f"User created: {user_email}")

        # Store filenames associated with the user
        for filename in filenames:
            file_data = {
                'filename': filename,
                'uploaded_at': datetime.now(),
                'user_email': user_email
                # Add more file-related fields as needed
            }
            if folder_name:
                file_data['folder_name'] = folder_name
            files_collection.insert_one(file_data)
            print(f"File saved: {filename}")

        # Example: Count files for the user


        for filename in filenames:
            executor.submit(create_index, filename)
            executor.submit(create_summary, filename)

        return jsonify({'message': 'Files uploaded successfully'}), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/upload-files-bulk', methods=['POST'])
def upload_files_bulk():
    if 'files[]' not in request.files:
        return jsonify({'error': 'No files found in the request'}), 400

    user_email = request.form.get('email')
    group_name = request.form.get('group_name')
    folder_name = request.form.get('folder_name', None)
    if not user_email:
        return jsonify({'error': 'Email parameter missing'}), 400

    try:
        # Fetch files from the request
        filenames = []
        files = request.files.getlist('files[]')

        # Save each file and collect filenames
        for file in files:
            if file:
                filename = file.filename
                file.save(os.path.join(app.config['UPLOAD_FOLDER'], filename))
                filenames.append(filename)

        # Find or create user based on email
        user = users_collection.find_one({'email': user_email})
        if not user:
            # Create user if not exists
            user_data = {
                'email': user_email,
                'created_at': datetime.now()
                # Add more user-related fields as needed
            }
            users_collection.insert_one(user_data)
            print(f"User created: {user_email}")

        # Store filenames associated with the user
        file_data = {
            'filename': group_name,
            'uploaded_at': datetime.now(),
            'user_email': user_email, 
            'filenames': filenames,
            'bulk': True
            # Add more file-related fields as needed
        }
        if folder_name:
            file_data['folder_name'] = folder_name
        files_collection.insert_one(file_data)


        executor.submit(create_index_bulk, filenames, group_name)
        executor.submit(create_summary_bulk, filenames, group_name)

        return jsonify({'message': 'Files uploaded successfully'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/get-disabled-buttons', methods=['POST'])
def dashboard():
    filenames = request.json.get('filenames', []) if request.json else []
    index_disabled = True
    summary_disabled = True
    all_summary_disabled = True
    all_index_disabled = True

    found_indicies = []
    found_summaries = []
    for filename in filenames:
        if files_collection.find_one({"filename":f'data/{filename}.index'}): #os.path.exists(f'data/{filename}.index'):
            index_disabled = False
            found_indicies.append(filename)
        if  files_collection.find_one({"filename":f'data/{filename}.txt'}):#os.path.exists(f'data/{filename}.txt'
            summary_disabled = False
            found_summaries.append(filename)
    # print(found_indicies, found_summaries)
    # print(len(filenames))
    if len(found_summaries) == len(filenames):
        all_summary_disabled = False
    if len(found_indicies) == len(filenames):
        all_index_disabled = False


    return {'index_disabled': index_disabled, 'summary_disabled': summary_disabled, 'all_summary_disabled': all_summary_disabled, 'all_index_disabled': all_index_disabled, 'filenames': filenames}


@app.route('/api/chat', methods=['POST'])
def chat():
    prompt = request.json.get('prompt')
    filenames = request.json.get('filenames', [])
    language = request.json.get('language', None)

    found_texts = []
    query = [prompt]
    query_embedding = model.encode(query)
    for filename in filenames:

        # index = faiss.read_index(f'data/{filename}.index')
        # index_bytes = files_collection.find_one({"filename":f'data/{filename}.index'})['index']
        # index = faiss.deserialize_index(index_bytes)
        index = read_index(filename)
        # with open(f'data/paragraphs_{filename}.pkl', 'rb') as file:
        #     paragraphs = pickle.load(file)
        paragraphs = files_collection.find_one({"filename":f'data/paragraphs_{filename}.pkl'})['paragraphs']
        distances, indices = index.search(query_embedding, num_docs)
        
        found_docs = []
        print(indices)
        for i in range(num_docs):
            found_docs.append(paragraphs[indices[0][i]])
        
        found_texts.append(found_docs)
    response = "Could not generate response"
    if found_texts:    
        print(found_texts)
        new_line = "\n"
        join_clause = "\n\n\nRelevant exerpts from one paper:\n"
        query_text = f"""
        Answer the question based on the following exerpts from multiple research paper, and compapre if requested:
        Prompt:{prompt}
        

        {new_line}{new_line}{new_line}Relevant exerpts from one paper:{new_line}{join_clause.join([" ".join(found_docs) for found_docs in found_texts])}"""
        if language:
            query_text +=  f"\n\nResponse should be in {language}."
        print(query_text)
        chat_app = ChatApp()
        response = chat_app.chatStream(query_text)

        return Response(stream_with_context(response) , headers={'X-Accel-Buffering': 'no', "Cache-Control": "no-cache", "Content-Type": "text/event-stream"})
    else:
        return response


@app.route('/api/chat_paper', methods=['POST'])
def chat_paper():
    prompt = request.json.get('prompt')
    filename = request.json.get("filename")
    language = request.json.get('language', None)

    index = read_index(filename)
    paragraphs = files_collection.find_one({"filename": f'data/paragraphs_{filename}.pkl'})['paragraphs']

    query = [prompt]
    query_embedding = model.encode(query)
    distances, indices = index.search(query_embedding, num_docs)
    chat_app = ChatApp()
    found_docs = []
    print(indices)
    for i in range(num_docs):
        found_docs.append(paragraphs[indices[0][i]])
    
    print(language)
    query_text = f"""
    Answer the question based on the following exerpts from an educational content:
    Prompt:{prompt}
    
    Found:
    {" ".join(found_docs)}"""

    if language:
        query_text +=  f"Response should be in {language}."
    response = chat_app.chatStream(query_text)

    return Response(stream_with_context(response), headers={'X-Accel-Buffering': 'no', "Cache-Control": "no-cache", "Content-Type": "text/event-stream"})

@app.route("/api/chat-all", methods=['POST'])
def chat_all():
    print("Chat all")
    filenames = request.json.get('filenames', [])
    language = request.json.get('language', None)
    paper_summaries= []
    for filename in filenames:
        # with open(f'data/{filename}.txt', 'r', encoding= 'utf-8') as file:
        #     paper_summaries.append(file.read())
        paper_summaries.append(files_collection.find_one({"filename":f'data/{filename}.txt'})['summary'])
    print(paper_summaries)
    response = "Could not generate response"
    if paper_summaries:
        chat_app = ChatApp()
        newlines = "\n\n"
        query_text = f"""
        Compare the following research papers baseed off their summaries of important information
        
        Summaries:
        {newlines.join(paper_summaries)}"""
        if language:
            query_text +=  f"Response should be in {language}."
        response = chat_app.chatStream(query_text)

        return Response(stream_with_context(response), headers={'X-Accel-Buffering': 'no', "Cache-Control": "no-cache", "Content-Type": "text/event-stream"})
    return {"error": "Could not generate response"}

@app.route("/api/individual-summary", methods=['POST'])
def chat_individual_summary():
    filename = request.json.get("filename")
    language = request.json.get('language', None)
    # with open(f'data/{filename}.txt', 'r', encoding= 'utf-8') as file:
    #     summary = file.read()
    summary = files_collection.find_one({"filename":f'data/{filename}.txt'})['summary']
    chat_app = ChatApp()
    query_text = f"""
    Correct the following summary of the research paper:
    {summary}"""

    if language:
        query_text +=  f"Response should be in {language}."
    response = chat_app.chatStream(query_text)
    return Response(stream_with_context(response), headers={'X-Accel-Buffering': 'no', "Cache-Control": "no-cache", "Content-Type": "text/event-stream"})


@app.route('/api/get-filenames', methods=['GET'])
def get_filenames():
    try:
        user_email = request.args.get('email')

        if not user_email:
            return jsonify({"error": "Email is required"}), 400

        filenames = []
        folders = {}

        for file_entry in files_collection.find({
            'user_email': {'$in': [user_email, 'common']}
        }):
            filename = file_entry['filename']

            if not (filename.startswith('data/') and (filename.endswith('.txt') or filename.endswith('.index'))):
                if 'folder_name' in file_entry:
                    folder_name = file_entry['folder_name']
                    folders.setdefault(folder_name, []).append(filename)
                else:
                    filenames.append(filename)

        return jsonify({"filenames": filenames, "folders": folders}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/api/delete-file', methods=['POST'])
def delete_file():
    data = request.json
    filename = data.get('filename')
    if filename:
        file_data = files_collection.find_one({"filename": filename})
        if file_data and 'filenames' not in file_data:
            # Delete files from filesystem
            file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
            index_path = f'data/{filename}.index'
            summary_path = f'data/{filename}.txt'
            paragraph_path = f'data/paragraphs_{filename}.pkl'
            name_path = f'{filename}'

            if os.path.exists(file_path):
                os.remove(file_path)
            # if os.path.exists(index_path):
            #     os.remove(index_path)
            # if os.path.exists(summary_path):
            #     os.remove(summary_path)
            # if os.path.exists(paragraph_path):
            #     os.remove(paragraph_path)

        elif file_data and 'filenames' in file_data:
            group_name = filename
            filenames = file_data['filenames']
            for file in filenames:
                try:
                    file_path = os.path.join(app.config['UPLOAD_FOLDER'], file)
                    if os.path.exists(file_path):
                        os.remove(file_path)
                except:
                    pass
            
            index_path = f'data/{group_name}.index'
            summary_path = f'data/{group_name}.txt'
            paragraph_path = f'data/paragraphs_{group_name}.pkl'
            name_path = f'{group_name}'

            # if os.path.exists(index_path):
            #     os.remove(index_path)
            # if os.path.exists(summary_path):
            #     os.remove(summary_path)
            # if os.path.exists(paragraph_path):
            #     os.remove(paragraph_path)
        try:
            files_collection.delete_one({"filename":index_path})
        except:
            pass
        
        try:
            files_collection.delete_one({"filename":summary_path})
        except:
            pass

        try:
            files_collection.delete_one({"filename":paragraph_path})
        except:
            pass

        try:
            files_collection.delete_one({"filename":name_path})
        except:
            pass

        return jsonify(success=True)
    return jsonify(success=False, error="No filename provided.")


from bson import ObjectId

@app.route('/api/login', methods=['POST'])
def login():
    if request.method == 'POST':
        email = request.json.get('email')
        password = request.json.get('password')
        user = users_collection.find_one({'email': email})
        if user and check_password_hash(user['password'], password):
            # Safely extract and stringify ID regardless of type
            partner_id = user.get('partner_user_id')

            # Normalize to string always
            try:
                if isinstance(partner_id, ObjectId):
                    partner_id = str(partner_id)
                elif isinstance(partner_id, dict):
                    partner_id = partner_id.get('$oid') or str(partner_id)
                elif not isinstance(partner_id, str):
                    partner_id = str(partner_id)
            except Exception:
                partner_id = str(user.get('_id'))  # fallback

            return jsonify({
                'message': 'Login successful',
                'user_id': partner_id
            }), 200
        else:
            return jsonify({'message': 'Invalid email or password'}), 401


@app.route('/api/logout', methods=['GET'])
def logout():
    return jsonify({'message': 'Logged out successfully'}), 200


@app.route('/api/signup', methods=['POST'])
def signup():
    if request.method == 'POST':
        email = request.json.get('email')
        
        if users_collection.find_one({'email': email}):
            return jsonify({'message': 'Email already exists'}), 400
        
        name = request.json.get('name')
        cellNumber = request.json.get('cellNumber')
        collegeName = request.json.get('collegeName')
        country = request.json.get('country')
        password = request.json.get('password')
        invitation_code = request.json.get('invitation_code', "")

        
        hashed_password = generate_password_hash(password)
        
        try:
            result = users_collection.insert_one({
                'name': name,
                'email': email,
                'cellNumber': cellNumber,
                'collegeName': collegeName,
                'country': country,
                'password': hashed_password,
                'invitation_code': invitation_code,
                'followers': [],
                'following': [],
                'liked_posts_or_replies': [],
                'notes': []
            })
            print(f"Inserted document ID: {result.inserted_id}")
        except Exception as e:
            print(f"An error occurred while inserting the document: {e}")
            return jsonify({'message': 'Signup failed'}), 500
        
        return jsonify({'message': 'Signup successful'}), 201


@app.route("/api/add-note", methods=['POST'])
def add_note():
    data = request.json
    filename = data.get('filename')
    note = data.get('note')
    email = data.get('email')
    if filename and note:
        users_collection.update_one({"email":email}, {"$push": {"notes": {"filename":filename, "note":note}}})
        return jsonify(success=True)
    return jsonify(success=False, error="No filename or note provided.")


@app.route("/api/delete-note", methods=['POST'])
def delete_note():
    data = request.json
    filename = data.get('filename')
    note_text = data.get('note')
    email = data.get('email')
    if filename and note_text:
        users_collection.update_one({"email":email}, {"$pull": {"notes": {"filename":filename, "note":note_text}}})
        return jsonify(success=True)
    return jsonify(success=False, error="No filename or note provided.")

@app.route("/api/ai-generated-notes", methods=['POST'])
def ai_generated_note():
    data = request.json
    filename = data.get('filename')
    content = data.get('content')
    language = data.get('language', None)
    folder_name = data.get('folder_name', None)
    email = data.get('email')
    
    chat_app = ChatApp()
    query_text = f"""Generate detailed notes based on the following content:
                                {content}. Notes should be consise and to the point. Only include the notes in the response."""
    if language:
        query_text += f"\nResponse should be in {language}."

    response = chat_app.chat(query_text).choices[0].message.content
    if response:
        users_collection.update_one({"email":email}, {"$push": {"notes": {"filename":filename, "note":response, "folder_name": folder_name}}})
        return {"success": True, "notes": response}
        
    return {"success": False, "error": "No notes generated."}


@app.route("/api/get-notes", methods=['POST'])
def get_notes():
    data = request.json
    email = data.get('email')
    notes = []
    folders = {}
    if email:
        user = users_collection.find_one({"email":email})
        if user and 'notes' in user:
            for note in user['notes']:
                filename = note['filename']
                note_text = note['note']
                folder_name = note.get('folder_name', None)
                if folder_name:
                    if folder_name not in folders:
                        folders[folder_name] = []
                    folders[folder_name].append({"filename": filename, "note": note_text})
                else:
                    notes.append({"filename": filename, "note": note_text})
            return jsonify(success=True, notes=notes, folders=folders)
        elif user:
            return jsonify(success=True, notes=notes, folders=folders)
        else:
            return jsonify(success=False, error="User not found.")
    return jsonify(success=False, error="No email provided.")

@app.route("/api/individual-notes", methods=['POST'])
def generate_individual_notes():
    data = request.json
    filename = data.get("filename")
    language = data.get('language', None)

    # Retrieve paragraphs from MongoDB based on the provided filename
    file_data = files_collection.find_one({"filename": f'data/paragraphs_{filename}.pkl'})

    if not file_data:
        return Response("File not found in database", status=404)

    paragraphs = file_data.get('paragraphs', [])

    # Join paragraphs into a single text for notes generation
    paragraphs_text = '\n\n'.join(paragraphs)

    # Initialize your ChatApp instance (or API request handler)
    chat_app = ChatApp()

    # Construct the query text for generating notes
    query_text = f"""
    Detailed notes based on the paragraphs:
    {paragraphs_text}"""

    if language:
        query_text += f"\nResponse should be in {language}."

    # Simulate generating notes (replace with actual logic if not using ChatApp)
    response = chat_app.chatStream(query_text)

    # Return the response as a streaming response
    return Response(stream_with_context(response), headers={
        'X-Accel-Buffering': 'no',
        'Cache-Control': 'no-cache',
        'Content-Type': 'text/event-stream'
    })



@app.route("/api/get-quiz", methods=['POST'])
def get_quiz():
    data = request.json
    filename = data.get('filename')
    language = data.get('language', "English")
    number_of_questions = data.get('number_of_questions', 5)
    if filename:
        # with open(f'data/{filename}.txt', 'r', encoding= 'utf-8') as file:
        #     summary = file.read()
        print(f'data/{filename}.txt')
        summary = files_collection.find_one({"filename": f'data/paragraphs_{filename}.pkl'})['paragraphs']

        query_text = """Generate a %d-question quiz based on the following content from the educational PDF, focusing on comprehension, key concepts, and application of ideas. Include some questions that encourage connecting related topics and practical understanding:
                      
                      %s
                      
                      The result should be in the following JSON format:
                      [
                      {"question":questionText, "options":[option1, option2, option3, option4], "answer":correctOption, "explanation":explanation},
                      {"question":questionText, "options":[option1, option2, option3, option4], "answer":correctOption, "explanation":explanation},
                      {"question":questionText, "options":[option1, option2, option3, option4], "answer":correctOption, "explanation":explanation},
                      ...
                      ]

                      The quiz should be in %s.
                      """ % (number_of_questions, summary, language)
        
        chat_app = ChatApp()
        response = chat_app.chat(query_text).choices[0].message.content
        list_str = find_list_in_string(response)
        if list_str:
            quiz = ast.literal_eval(list_str)
            return jsonify(success=True, quiz=quiz)
        else:
            return jsonify(success=False, error="No quiz generated.")
    return jsonify(success=False, error="No filename provided.")

# @app.route("/api/generate-exam", methods=['POST'])
# def generate_exam():
#     data = request.json
#     exam = data.get('exam', 'USMLE')
#     topics = data.get('topics', [])
#     language = data.get('language', None)
#     num_questions = data.get('num_questions', None)
#     difficulty = data.get('difficulty', 'medium')

#     query_text = f"""
#     Generate a {exam} exam"
#     """

#     if num_questions:
#         query_text += f" with {num_questions} questions "

#     if difficulty:
#         query_text += f" of {difficulty} difficulty "

#     if language:
#         query_text += f" in {language}."
#     else:
#         query_text += "."
    
#     if topics:
#         query_text += f"""
#         Topics to include:
#         {', '.join(topics)}"""
    
#     query_text += """\n
#     The result should be in the following JSON format:
#     [
#     {"question":questionText, "options":[option1, option2, option3, option4], "answer":correctOption, "explanation":explanation},
#     {"question":questionText, "options":[option1, option2, option3, option4], "answer":correctOption, "explanation":explanation},
#     {"question":questionText, "options":[option1, option2, option3, option4], "answer":correctOption, "explanation":explanation},
#     ...
#     ]
#     """

#     chat_app = ChatApp()

#     response = chat_app.chat(query_text).choices[0].message.content
#     list_str = find_list_in_string(response)
#     if list_str:
#         exam = ast.literal_eval(list_str)
#         return jsonify(success=True, exam=exam)
#     else:
#         return jsonify(success=False, error="No exam generated.")


@app.route("/api/generate-mind-map", methods=['POST'])
def generate_mind_map():
    data = request.json
    filename = data.get('filename')
    language = data.get('language', None)
    if filename:
        summary = files_collection.find_one({"filename": f'data/{filename}.txt'})['summary']
        language_text = f"in {language}" if language else ""
        chat_app = ChatApp()
        response = chat_app.chat("""Generate a nested mind map %s based on the following educational content:
                      
                      %s

                      The result should be a nested dictionary of ideas, eg:
                        [
                            {
                                "idea": idea1,
                                "children": [
                                    {
                                        "idea": subIdea1,
                                        "children": []
                                    },
                                    {
                                        "idea": subIdea2,
                                        "children": []
                                    }
                                ]    
                            },
                            {
                                "idea": idea2,
                                "children": []
                            }
                        ]
                        
                        Go into as much detail and create as much depth as possible. Make the mind map more deep rather than wide.
                        Do not create ideas about refrences or any non content topics.
                        """% (language_text, summary)).choices[0].message.content

        processed_response = ast.literal_eval(find_list_in_string(response))

        # Function to generate image bytes
        def generate_image_bytes(mind_map):
            G = pgv.AGraph(directed=True)
            add_nodes_edges(G, mind_map)
            G.layout(prog='dot')
            buf = BytesIO()
            G.draw(buf, format='png')
            image_bytes = buf.getvalue()
            return base64.b64encode(image_bytes).decode('utf-8')

        main_ideas = [mind_map['idea'] for mind_map in processed_response]
        for mind_map in processed_response:
            executor.submit_stored(mind_map['idea'], generate_image_bytes, [mind_map])
        
        finished_image_bytes = {}

        for main_idea in main_ideas:
            future = executor.futures.pop(main_idea)
            finished_image_bytes[main_idea] = future.result()

        return jsonify(success=True, mind_map_image_bytes=finished_image_bytes)

    return jsonify(success=False, error="No filename provided.")

def add_nodes_edges(graph, data, parent=None):
    for item in data:
        if not item or 'idea' not in item:
            continue
        idea = item["idea"]
        graph.add_node(idea)
        if parent:
            graph.add_edge(parent, idea)
        add_nodes_edges(graph, item["children"], idea)



@app.route('/api/get-profile', methods=['POST'])
def get_profile():
    try:
        data = request.get_json()
        email = data.get('email')

        if not email:
            return jsonify({'success': False, 'error': 'Email not provided'}), 400

        # Fetch user profile from MongoDB
        user_profile = users_collection.find_one({'email': email}, {'_id': 0, 'password': 0})

        if user_profile:
            return jsonify({'success': True, 'profile': user_profile})
        else:
            return jsonify({'success': False, 'error': 'User profile not found'}), 404

    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

#Update user profile route
@app.route('/api/update-profile', methods=['POST'])
def update_profile():
    try:
        # Assuming email is not editable from frontend
        email = request.form.get('email', '')
        name = request.form.get('name', '')
        cellNumber = request.form.get('cellNumber', '')
        collegeName = request.form.get('collegeName', '')
        country = request.form.get('country', '')
        bio = request.form.get('bio', '')

        profilePic = None
        profilePicType = None
        if 'profilePic' in request.files:
            file = request.files['profilePic']
            if file and allowed_file(file.filename): #check if allowed file type
                file_bytes = file.read()
                
                profilePic = base64.b64encode(file_bytes).decode('utf-8')
                profilePicType = file.filename.split('.')[-1]
        if not email:
            return jsonify({'success': False, 'error': 'Email not provided'}), 400

        update_query = {}
        if name:
            update_query['name'] = name
        if cellNumber:
            update_query['cellNumber'] = cellNumber
        if collegeName:
            update_query['collegeName'] = collegeName
        if country:
            update_query['country'] = country
        if bio:
            update_query['bio'] = bio
        if profilePic:
            update_query['profilePic'] = profilePic
            update_query['profilePicType'] = profilePicType
        
        # Update user profile in MongoDB
        result = users_collection.update_one(
            {'email': email},
            {'$set': update_query}
        )

        if result.modified_count > 0:
            return jsonify({'success': True})
        else:
            return jsonify({'success': False, 'error': 'Failed to update user profile'}), 500

    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/update-password', methods=['POST'])
def update_password():
    try:
        data = request.get_json()
        email = data.get('email')
        current_password = data.get('currentPassword')
        new_password = data.get('newPassword')

        if not email or not current_password or not new_password:
            return jsonify({'success': False, 'error': 'Email, currentPassword, and newPassword are required'}), 400

        # Fetch user from MongoDB
        user = users_collection.find_one({'email': email})

        if not user:
            return jsonify({'success': False, 'error': 'User not found'}), 404

        # Validate current password
        stored_hash = user.get('password')  # Assume password is stored as 'scrypt:N:r:p$salt$hashed_password'

        if not stored_hash:
            return jsonify({'success': False, 'error': 'User password not found in database'}), 500

        # # Extract scrypt parameters and salt from stored_hash
        # hash_params, salt, stored_hashed_password = stored_hash.split('$')

        # # Verify the current password
        # computed_hash = scrypt.hash(current_password, salt=salt, N=int(hash_params.split(':')[1]), r=int(hash_params.split(':')[2]), p=int(hash_params.split(':')[3]))
        # print(computed_hash,"~~~~~~~~~~~~~:~~~~~~~~~~~~~~", stored_hashed_password)

        if not check_password_hash(stored_hash, current_password):
            return jsonify({'success': False, 'error': 'Incorrect current password'}), 401

        # Hash the new password
        # hashed_password = scrypt.hash(new_password, salt=salt, N=int(hash_params.split(':')[1]), r=int(hash_params.split(':')[2]), p=int(hash_params.split(':')[3]))
        hashed_password = generate_password_hash(new_password) 
        # Update user's password in MongoDB
        result = users_collection.update_one(
            {'email': email},
            {'$set': {'password': hashed_password}}
        )

        if result.modified_count > 0:
            return jsonify({'success': True})
        else:
            return jsonify({'success': False, 'error': 'Failed to update password'}), 500

    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/save', methods=['POST'])
def save_text():
    data = request.get_json()
    text = data.get('text', '')
    title = data.get('title', '')
    tags = data.get('tags', '')
    type = data.get('type', '')
    email = data.get('email', '')  # Added email field

    summary = {
        'text': text,
        'title': title,
        'tags': tags,
        'type': type,
        'email': email  # Include email in the summary
    }

    saved_collection.insert_one(summary)
    return jsonify({'message': 'Saved successfully'})


@app.route('/api/fetch', methods=['GET'])
def fetch_files():
    try:
        email = request.args.get('email')
        files = list(saved_collection.find(
            {'email': {'$in': [email, 'common']}},
            {'_id': 0}
        )) if email else []
        return jsonify(files)
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/update', methods=['POST'])
def update_file():
    try:
        data = request.get_json()
        title = data.get('title', '')
        email = data.get('email', '')
        text = data.get('text', '')

        query = {'title': title, 'email': email}
        update_data = {'$set': {'text': text}}

        result = saved_collection.update_one(query, update_data)
        if result.matched_count > 0:
            return jsonify({'message': 'File updated successfully'})
        else:
            return jsonify({'message': 'No matching file found'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/delete', methods=['DELETE'])
def delete_files():
    try:
        data = request.get_json()
        title = data.get('title', '')
        email = data.get('email', '')

        query = {'title': title, 'email': email}
        result = saved_collection.delete_one(query)
        if result.deleted_count > 0:
            return jsonify({'message': 'File deleted successfully'})
        else:
            return jsonify({'message': 'No matching file found'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500

ALLOWED_EXTENSIONS = ['png', 'jpg', 'jpeg', 'gif', 'mp4']


def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@app.route('/api/create-post', methods=['POST'])
def create_post():
    try:
        email = request.form.get('email', '')
        text = request.form.get('text', '')
        title = request.form.get('title', '')
        topics = request.form.get('topics', '')
        
        topics = json.loads(topics)

        media = None
        media_type = None
        if 'media' in request.files:
            file = request.files['media']
            if file and allowed_file(file.filename): #check if allowed file type
                file_bytes = file.read()
                
                media = base64.b64encode(file_bytes).decode('utf-8')
                media_type = file.filename.split('.')[-1]
        
        insert_obj = {
            "_id": ObjectId(),
            'email': email,
            'text': text,
            'title': title,
            'topics': topics,
            'likes': [],
            'replies': []
        }
        if media:
            insert_obj['media'] = media
            insert_obj['media_type'] = media_type
        result = posts_collection.insert_one(insert_obj)

        followers = users_collection.find_one({'email': email}).get('followers', [])
        for follower in followers:
            notifications_collection.insert_one({
                '_id': ObjectId(),  
                'user_id': follower,
                'type': 'post',
                'post_id': str(result.inserted_id),
                'from_user_id': email,
                'created_at': datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            })
        return jsonify({'message': 'Post created successfully', 'id': str(result.inserted_id)})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/fetch-all-posts', methods=['GET'])
def fetch_all_posts():
    try:
        all_posts = posts_collection.find({})
        return jsonify(json_util.dumps(all_posts))
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/delete-post', methods=['POST'])
def delete_post():
    try:
        data = request.get_json()
        id = data.get('id', '')
        result = posts_collection.delete_one({'_id': ObjectId(id)})
        if result.deleted_count > 0:
            users_collection.update_many({}, {'$pull': {'liked_posts_or_replies': id}})
            return jsonify({'message': 'Post deleted successfully'})
        else:
            return jsonify({'message': 'No matching post found'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/update-post', methods=['POST'])
def update_post():
    try:
        data = request.get_json()
        id = data.get('id', '') # id for matching
        title = data.get('title', '')
        text = data.get('text', '')
        topics = data.get('topics', '')
        update_query = {}
        if title:
            update_query['title'] = title
        if text:
            update_query['text'] = text
        if topics:
            update_query['topics'] = topics

        result = posts_collection.update_one( {'_id': ObjectId(id)}, {'$set': update_query } )
        if result.matched_count > 0:
            return jsonify({'message': 'Post updated successfully'})
        else:
            return jsonify({'message': 'No matching post found'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/fetch-posts-by-filter', methods=['POST'])
def fetch_posts_by_filter():
    try:
        data = request.get_json()
        user = data.get('user') or data.get('email', '')
        topics = data.get('topics', '')
        posts = None
        if user and topics:
            posts = list(posts_collection.find({'email': user, 'topics': {'$in': topics}}))
        elif user:
            posts = list(posts_collection.find({'email': user}))
        elif topics:
            posts = list(posts_collection.find({'topics': {'$in': topics}}))
        else:
            posts = list(posts_collection.find({}))

        return jsonify(json_util.dumps(posts))
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/fetch-post', methods=['POST'])
def fetch_post():
    try:
        data = request.get_json()
        id = data.get('id', '')
        post = posts_collection.find_one({'_id': ObjectId(id)})
        if post:
            return jsonify(json_util.dumps(post))
        else:
            return jsonify({'error': 'Post not found'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    
@app.route('/api/toggle-like-post', methods=['POST'])
def toggle_like_post():
    try:
        data = request.get_json()
        id = data.get('post_id', '')
        email = data.get('email', '')
        post = posts_collection.find_one({'_id': ObjectId(id)})
        if not post:
            return jsonify({'error': 'Post not found'}), 404

        likes = post.get('likes', [])
        if email in likes:
            likes.remove(email)
            users_collection.update_one({'email': email}, {'$pull': {'liked_posts_or_replies': id}})
        else:
            likes.append(email)
            users_collection.update_one({'email': email}, {'$push': {'liked_posts_or_replies': id}})
            notifications_collection.insert_one({
                '_id': ObjectId(),  
                'user_id': post['email'],
                'type': 'like',
                'post_id': id,
                'from_user_id': email,
                'created_at': datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            })

        posts_collection.update_one({'_id': ObjectId(id)}, {'$set': {'likes': likes}})
        
        return jsonify({'message': 'Post liked successfully'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/toggle-like-reply', methods=['POST'])
def toggle_like_reply():
    try:
        data = request.get_json()
        post_id = data.get('post_id', '')
        reply_id = data.get('reply_id', '')
        email = data.get('email', '')
        post = posts_collection.find_one({'_id': ObjectId(post_id)})

        def toggle_like(reply_list, reply_id, email):
            for reply in reply_list:
                if str(reply['_id']) == reply_id:
                    likes = reply.get('likes', [])
                    if email in likes:
                        likes.remove(email)
                        users_collection.update_one({'email': email}, {'$pull': {'liked_posts_or_replies': reply_id}})
                    else:
                        likes.append(email)
                        users_collection.update_one({'email': email}, {'$push': {'liked_posts_or_replies': reply_id}})
                        notifications_collection.insert_one({
                            '_id': ObjectId(),  
                            'user_id': reply['email'],
                            'type': 'like',
                            'post_id': post_id,
                            'reply_id': reply_id,
                            'from_user_id': email,
                            'created_at': datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                        })
                    reply['likes'] = likes
                    return True
                if toggle_like(reply['replies'], reply_id, email):
                    return True
            return False

        if not post:
            return jsonify({'error': 'Post not found'}), 404

        if not toggle_like(post['replies'], reply_id, email):
            return jsonify({'error': 'Reply ID not found'}), 404

        posts_collection.update_one({'_id': ObjectId(post_id)}, {'$set': {'replies': post['replies']}})
        return jsonify({'message': 'Reply liked successfully'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/create-reply', methods=['POST'])
def create_reply():
    try:
        data = request.get_json()
        post_id = data.get('post_id', '')
        reply_to_id = data.get('reply_to_id', None)  # ID of the post or reply being replied to
        email = data.get('email', '')
        text = data.get('text', '')

        # Fetch the post
        post = posts_collection.find_one({'_id': ObjectId(post_id)})

        if not post:
            return jsonify({'error': 'Post not found'}), 404

        # Function to recursively add the reply to the correct place
        def add_reply(reply_list, reply_to_id, new_reply):
            for reply in reply_list:
                if str(reply['_id']) == reply_to_id:
                    reply['replies'].append(new_reply)
                    return True
                if add_reply(reply['replies'], reply_to_id, new_reply):
                    return True
            return False

        # Create the new reply
        new_reply = {
            '_id': ObjectId(),  # Generate a new ObjectId for the reply
            'email': email,
            'text': text,
            "created_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S"), 
            "likes": [],
            'replies': []
        }

        notifications_collection.insert_one({
            '_id': ObjectId(),  
            'user_id': post['email'],
            'type': 'reply',
            'post_id': post_id,
            'reply_id': str(new_reply['_id']),
            'from_user_id': email,
            'created_at': datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        })

        # If reply_to_id is None, it's a reply to the main post
        if reply_to_id is None:
            post['replies'].append(new_reply)
        else:
            if not add_reply(post['replies'], reply_to_id, new_reply):
                return jsonify({'error': 'Reply-to ID not found'}), 404

        # Update the post in the database
        posts_collection.update_one({'_id': ObjectId(post_id)}, {'$set': {'replies': post['replies']}})
        
        return jsonify({'message': 'Reply added successfully', 'id': str(new_reply['_id'])})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/delete-reply', methods=['POST'])
def delete_reply():
    try:
        data = request.get_json()
        post_id = data.get('post_id', '')
        reply_id = data.get('reply_id', '')
        post = posts_collection.find_one({'_id': ObjectId(post_id)})

        def delete_reply(reply_list, reply_id):
            for reply in reply_list:
                if str(reply['_id']) == reply_id:
                    reply_list.remove(reply)
                    return True
                if delete_reply(reply['replies'], reply_id):
                    return True
            return False

        if not post:
            return jsonify({'error': 'Post not found'}), 404

        if not delete_reply(post['replies'], reply_id):
            return jsonify({'error': 'Reply ID not found'}), 404

        posts_collection.update_one({'_id': ObjectId(post_id)}, {'$set': {'replies': post['replies']}})
        users_collection.update_many({}, {'$pull': {'liked_posts_or_replies': reply_id}})

        return jsonify({'message': 'Reply deleted successfully'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/update-reply', methods=['POST'])
def update_reply():
    try:
        data = request.get_json()
        post_id = data.get('post_id', '')
        reply_id = data.get('reply_id', '')
        text = data.get('text', '')

        post = posts_collection.find_one({'_id': ObjectId(post_id)})

        def update_reply_text(reply_list, reply_id, text):
            for reply in reply_list:
                if str(reply['_id']) == reply_id:
                    reply['text'] = text
                    return True
                if update_reply_text(reply['replies'], reply_id, text):
                    return True
            return False

        if not post:
            return jsonify({'error': 'Post not found'}), 404

        if not update_reply_text(post['replies'], reply_id, text):
            return jsonify({'error': 'Reply ID not found'}), 404

        posts_collection.update_one({'_id': ObjectId(post_id)}, {'$set': {'replies': post['replies']}})
        return jsonify({'message': 'Reply updated successfully'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/fetch-user-by-id', methods=['POST'])
def fetch_user_by_id():
    try:
        data = request.get_json()
        email_id = data.get('email_id', '')
        user = users_collection.find_one({'email':email_id}, {'name': 1, 'email': 1, 'cellNumber': 1, 'collegeName': 1, 'country': 1, 'bio':1, 'profilePic':1, 'profilePicType':1, 'followers': 1, 'following': 1, 'invitation_code': 1, 'subscription_id': 1, 'subscription_status': 1})
        if user:
            return jsonify(json_util.dumps(user))
        else:
            return jsonify({'error': 'User not found'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/get-user-by-userid', methods=['POST'])
def get_user_by_userid():
    try:
        data = request.get_json()
        user_id = data.get('user_id', '')
        
        if not user_id:
            return jsonify({'error': 'user_id is required'}), 400
        
        user = users_collection.find_one(
            {'partner_user_id': user_id}, 
            {
                'name': 1, 
                'email': 1, 
                'cellNumber': 1, 
                'collegeName': 1, 
                'country': 1, 
                'bio': 1, 
                'profilePic': 1, 
                'profilePicType': 1, 
                'followers': 1, 
                'following': 1, 
                'invitation_code': 1, 
                'subscription_id': 1, 
                'subscription_status': 1,
                'plan': 1
            }
        )
        
        if user:
            return jsonify(json_util.dumps(user))
        else:
            return jsonify({'error': 'User not found'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/get-user-by-email', methods=['POST'])
def get_user_by_email():
    try:
        data = request.get_json()
        email = data.get('email', '')
        
        if not email:
            return jsonify({'error': 'email is required'}), 400
        
        user = users_collection.find_one(
            {'email': email}, 
            {
                'name': 1, 
                'email': 1, 
                'cellNumber': 1, 
                'collegeName': 1, 
                'country': 1, 
                'bio': 1, 
                'profilePic': 1, 
                'profilePicType': 1, 
                'followers': 1, 
                'following': 1, 
                'invitation_code': 1, 
                'subscription_id': 1, 
                'subscription_status': 1,
                'plan': 1
            }
        )
        
        if user:
            return jsonify(json_util.dumps(user))
        else:
            return jsonify({'error': 'User not found'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/toggle-follow-user', methods=['POST'])
def toggle_follow_user():
    try:
        data = request.get_json()
        follower_id = data.get('follower_id', '')
        following_id = data.get('following_id', '')
        follower = users_collection.find_one({'email': follower_id})
        following = users_collection.find_one({'email': following_id})

        if not follower or not following:
            return jsonify({'error': 'User not found'}), 404

        followers = following.get('followers', [])
        following_list = follower.get('following', [])

        if follower_id in followers:
            followers.remove(follower_id)
            following_list.remove(following_id)
        else:
            followers.append(follower_id)
            following_list.append(following_id)
            notifications_collection.insert_one({
                '_id': ObjectId(),  
                'user_id': following_id,
                'type': 'follow',
                'from_user_id': follower_id,
                'created_at': datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            })

        users_collection.update_one({'email': following_id}, {'$set': {'followers': followers}})
        users_collection.update_one({'email': follower_id}, {'$set': {'following': following_list}})

        return jsonify({'message': 'Follow status updated successfully'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/get-users-by-emails', methods=['POST'])
def get_users_by_emails():
    try:
        data = request.get_json()
        emails = data.get('emails', [])
        users = list(users_collection.find({'email': {'$in': emails}}, {'name': 1, 'email': 1, 'cellNumber': 1, 'collegeName': 1, 'country': 1, 'bio':1, 'profilePic':1, 'profilePicType':1, 'followers': 1, 'following': 1}))
        return jsonify(json_util.dumps(users))
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/get-trending-posts', methods=['GET'])
def get_trending_posts():
    try:
        most_liked_posts = posts_collection.find().sort([('likes', -1)]).limit(5)
        most_replied_posts = posts_collection.find().sort([('replies', -1)]).limit(5)
        return jsonify(json_util.dumps({
            'most_liked_posts': most_liked_posts,
            'most_replied_posts': most_replied_posts,
        }))
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    
@app.route('/api/get-notifications', methods=['POST'])
def get_notifications():
    try:
        data = request.get_json()
        user_id = data.get('user_id', '')
        notifications = list(notifications_collection.find({'user_id': user_id}))
        return jsonify(json_util.dumps(notifications))
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/delete-notification', methods=['POST'])
def delete_notification():
    try:
        data = request.get_json()
        ids = data.get('ids', '')
        ids = [ObjectId(id) for id in ids]
        result = notifications_collection.delete_many({'_id': {'$in': ids}})
        if result.deleted_count > 0:
            return jsonify({'message': 'Notification deleted successfully'})
        else:
            return jsonify({'message': 'No matching notification found'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/fetch-all-user-ids', methods=['GET'])
def fetch_all_user_ids():
    try:
        all_users = users_collection.find({}, {'email': 1})
        emails = [user['email'] for user in all_users]
        return emails
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/subscriptions', methods=['POST'])
def save_subscription():
    data = request.json
    user_id = data.get('user_id')
    subscription_id = data.get('subscription_id')
    dev = data.get('dev', False)

    if not user_id or not subscription_id:
        return jsonify({'message': 'User ID and Subscription ID are required'}), 400

    try:
        update_obj = {'subscription_id': subscription_id, 'subscription_status': 'active'}
        if dev:
            update_obj['dev'] = True
        result = users_collection.update_one(
            {'_id': ObjectId(user_id)},
            {'$set': {update_obj}}
        )
        if result.matched_count == 0:
            return jsonify({'message': 'User not found'}), 404

        return jsonify({'message': 'Subscription saved successfully'}), 200

    except Exception as e:
        return jsonify({'message': str(e)}), 500

# Endpoint to get user subscription status
@app.route('/api/subscriptions/<user_id>', methods=['GET'])
def get_subscription(user_id):
    try:
        user = users_collection.find_one({'_id': ObjectId(user_id)})
        if not user:
            return jsonify({'message': 'User not found'}), 404

        subscription_id = user.get('subscription_id')
        subscription_status = user.get('subscription_status', 'inactive')
        dev = user.get('dev', False)
        return jsonify({
            'subscription_id': subscription_id,
            'subscription_status': subscription_status,
            'developer_account': dev
        }), 200

    except Exception as e:
        return jsonify({'message': str(e)}), 500

@app.route('/api/create-invitation-code', methods=['POST'])
def create_invite_code():
    try:
        data = request.get_json()
        code = data.get('code', '')
        duration = data.get('duration', 0)
        num_users = data.get('num_users', None)

        expires_at = None  
        if duration:
            expires_at = datetime.now() + timedelta(days=duration)

        if codes_collection.find_one({'code': code}):
            return jsonify({'message': 'Invitation code already exists'}), 400
        

        result = codes_collection.insert_one(        
            {
                'code': code,
                'expires_at': expires_at,
                'num_users': num_users
            })

        return jsonify({'message': 'Invitation code created successfully', 'id': str(result.inserted_id)}), 200

    except Exception as e:
        return jsonify({'message': str(e)}), 500

@app.route('/api/validate-invitation-code', methods=['POST'])
def validate_invite_code():
    try:
        data = request.get_json()
        code = data.get('code', '')
        user_id = data.get('email', '')
        code_obj = codes_collection.find_one({'code': code})
        user = users_collection.find_one({"email":user_id})
        if not code_obj:
            return jsonify({'success':False, 'message': 'Invalid code'}), 404
        else:
            expires_at = code_obj.get('expires_at', None)
            user_limit = code_obj.get('num_users', None)
            users = code_obj.get('users', [])
            
            if user_limit and len(users) >= user_limit and user_id not in users:
                return jsonify({'success':False, 'message': 'Code limit reached'}), 403
            elif user_limit and len(users) < user_limit and user_id not in users:
                users.append(user_id)
                codes_collection.update_one({'code':code}, {'$set': {'users': users}})

                
            if expires_at and expires_at < datetime.now():
                codes_collection.delete_one({'code':code})
                if user and 'subscription_status' in user:
                    users_collection.update_one({"email":user_id}, {'$set': {'subscription_id': None, 'subscription_status': 'inactive'}})
                return jsonify({'sucess':False, 'message': 'Code expired'}), 403
            else:
                if user and ('subscription_status' not in user or user['subscription_status'] == 'inactive'):
                    users_collection.update_one({"email":user_id}, {'$set': {'subscription_id': code, 'subscription_status': 'active'}})
                return jsonify({'success':True, 'message': 'Code is valid'}), 200
    except Exception as e:
        return jsonify({'message': str(e), 'success':False}), 500

@app.route('/api/delete-invitation-code', methods=['POST'])
def delete_invite_code():
    try:
        data = request.get_json()
        code = data.get('code', '')

        result = codes_collection.delete_one({'code': code})
        if result.deleted_count > 0:
            return jsonify({'message': 'Invitation code deleted successfully', 'success':True})
        else:
            return jsonify({'message': 'No matching code found', 'success':False}), 404
    except Exception as e:
        return jsonify({'message': str(e), 'success':False}), 500

@app.route('/api/generate-case-study', methods=['POST'])
def generate_case_study():
    data = request.get_json()
    category = data.get('category', '')

    query_text = """
    Generate a unique case study on %s.
    The case study should include the following sections in the format below(JSON Dictionary):
    {
        "Patient Name": 'Patient Name',
        "Age": 'Patient Age',
        "Gender": "Patient Gender",
        "Chief Complaint": "Chief Complaint",
        "Case Summary": "Case Summary",
        "Differential Diagnosis": "Differential Diagnosis",
        "Symptoms": ["Symptom 1", "Symptom 2", "Symptom 3"],
        "Risk Factors": ["Risk Factor 1", "Risk Factor 2", "Risk Factor 3"],
        "Injury History": ["Injury 1", "Injury 2", "Injury 3"],
        "Past Medical History": ["History 1", "History 2", "History 3"],
        "Medication Use": ["Medication 1", "Medication 2", "Medication 3"],
        "Family History": ["Family History 1", "Family History 2", "Family History 3"],
        "Travel History": ["Travel History 1", "Travel History 2", "Travel History 3"],
        "Allergies": ["Allergy 1", "Allergy 2", "Allergy 3"]
    }

    The Differential Diagnosis should be one or more value from the following dictionary:
    {
      "Cardiovascular": [
        "Myocardial infarction",
        "Angina",
        "Heart failure",
        "Arrhythmias",
        "Valvular heart disease",
        "Pericarditis",
        "Hypertensive crisis",
        "Aortic dissection",
        "Coronary artery disease",
        "Cardiomyopathy",
        "Endocarditis",
        "Myocarditis",
        "Cardiac tamponade"
      ],
      "Respiratory": [
        "Pneumonia",
        "COPD",
        "Asthma",
        "Pulmonary embolism",
        "Pleural effusion",
        "Interstitial lung disease",
        "Tuberculosis",
        "Lung cancer",
        "Acute bronchitis",
        "Acute respiratory distress syndrome (ARDS)",
        "Pneumothorax",
        "Hemothorax",
        "Aspiration pneumonia"
      ],
      "Gastrointestinal": [
        "Peptic ulcer disease",
        "Gastroenteritis",
        "Hepatitis",
        "Cholecystitis",
        "Pancreatitis",
        "IBD",
        "GI bleeding",
        "Gastric cancer",
        "Colorectal cancer",
        "Gallstones",
        "Diverticulitis",
        "Esophageal varices",
        "Gastric outlet obstruction"
      ],
      "Musculoskeletal": [
        "Fractures",
        "Sprains",
        "Dislocations",
        "Arthritis",
        "Bursitis",
        "Tendinitis",
        "Infections (osteomyelitis, septic arthritis)",
        "Gout",
        "Rheumatoid arthritis",
        "Osteoarthritis",
        "Ankylosing spondylitis",
        "Fibromyalgia",
        "Lupus",
        "Osteoporosis"
      ],
      "Hematological": [
        "Anemia",
        "Leukemia",
        "Lymphoma",
        "Coagulation disorders",
        "Infections",
        "Nutritional deficiencies",
        "Thrombocytopenia",
        "Hemophilia",
        "Deep vein thrombosis",
        "Sickle cell disease",
        "Hemochromatosis",
        "Polycythemia",
        "Thrombotic thrombocytopenic purpura (TTP)",
        "Disseminated intravascular coagulation (DIC)"
      ]
    }
    """%category

    chat_app = ChatApp()

    response = chat_app.chat(query_text).choices[0].message.content
    case_info_dict = json.loads(find_dict_in_string(response))

    return jsonify({'case_study': case_info_dict})

@app.route('/api/case-study-response', methods=['POST'])
def case_study_response():
    data = request.get_json()
    case_info = data.get('case_info', '')
    section = data.get('section', '')
    action = data.get('action', '')

    action_text = ""

    if section == 'physical':
        action_text = f"Provide only the specific physical examination findings or vital signs for {action}."
    elif section == 'stabilization':
        action_text = f"Show the patient's updated condition or vital signs immediately after providing {action}."
    elif section == 'diagnosis':
        action_text = f"Give concise feedback on the diagnosis '{action}' without revealing the final diagnosis."
    elif section == 'interventions':
        action_text = f"Describe the patient's updated vitals or status right after {action}."
    elif section == 'investigations':
        action_text = f"Provide the actual results or key findings for the {action} test."
    elif section == 'consultations':
        action_text = f"Give the one-line feedback or recommendation from the {action} consultation."
    elif section == 'handover':
        action_text = f"Provide a one-line status summary for handover to {action}."

    query_text = f"""
Given this case: {case_info}.
{action_text}
Keep your response under 50 words. Respond directly — for vitals or tests, give the values only without explanations. 
Do not mention differential diagnosis. If the value is not specified, analyze the case and give a value.
"""

    chat_app = ChatApp()
    response = chat_app.chat(query_text)
    full_text = response.choices[0].message.content

    return jsonify({"response": full_text})


@app.route('/api/score-case-study', methods=['POST'])
def score_case_study():
    data = request.get_json()
    case_info = data.get('case_info', '')
    response_window = data.get('response_window', '')

    user_responses = []
    bot_responses = []

    for response in response_window:
        if response['sender'] == 'user':
            user_responses.append(response['message'])
        elif response['sender'] == 'bot':
            bot_responses.append(response['message'])

    query_text = f"""
    Score the following case study based only on the steps taken by the user: {case_info}.
    The user's steps are: {user_responses}.
    Study the following bot responses to understand the context: {bot_responses}"""

    chat_app = ChatApp()
    response = chat_app.chatStream(query_text)
    return Response(stream_with_context(response), headers={'X-Accel-Buffering': 'no', "Cache-Control": "no-cache", "Content-Type": "text/event-stream"})

@app.route('/api/generate-flashcards', methods=['POST'])
def generate_flashcards():
    data = request.json
    filename = data.get('filename')
    language = data.get('language', "English")
    if filename:
        language_text = f"in {language}" if language else ""
        summary = files_collection.find_one({"filename": f'data/paragraphs_{filename}.pkl'})['paragraphs']
    
        query_text = """
        Generate flashcards %s based off the following educational content.

        The flashcards should include the following sections in the format below(JSON Dictionary):
        {
            "Flashcard 1": {
                "Question": "Question 1",
                "Answer": "Answer 1"
            },
            "Flashcard 2": {
                "Question": "Question 2",
                "Answer": "Answer 2"
            },
            "Flashcard 3": {
                "Question": "Question 3",
                "Answer": "Answer 3"
            }

            Here is the summary:
            %s
        }""" % (language_text, summary)

        chat_app = ChatApp()
        response = chat_app.chat(query_text).choices[0].message.content
        flashcards = json.loads(find_dict_in_string(response))

        return jsonify({'flashcards': flashcards})
    
    return jsonify(success=False, error="No filename provided.")


@app.route('/api/webhook', methods=['POST'])
def stripe_webhook():
    payload = request.get_data(as_text=True)
    sig_header = request.headers.get('Stripe-Signature')

    STRIPE_CONFIG = config['STRIPE']
    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, STRIPE_CONFIG['endpoint_secret']
        )
    except ValueError as e:
        # Invalid payload
        return jsonify(success=False, error=str(e)), 400
    except stripe.error.SignatureVerificationError as e:
        # Invalid signature
        return jsonify(success=False, error=str(e)), 400

    # Helper function to get customer email
    def get_customer_email(customer_id):
        customer = stripe.Customer.retrieve(customer_id)
        return customer['email']

    # Handle the event
    event_type = event['type']
    data_object = event['data']['object']
    plan = data_object['plan']['product'] if 'plan' in data_object and 'product' in data_object['plan'] else None
    customer_email = get_customer_email(data_object['customer'])

    set_dict = {}
    if plan and plan in STRIPE_CONFIG['PLANS']:
        set_dict['plan'] = STRIPE_CONFIG['PLANS'][plan]

    if event_type == 'invoice.paid':
        set_dict['subscription_status'] = 'active'
    elif event_type == 'invoice.payment_failed':
        set_dict['subscription_status'] = 'inactive'
    elif event_type == 'invoice.payment_succeeded':
        set_dict['subscription_status'] = 'active'
    elif event_type == 'customer.subscription.created' or event_type == 'customer.subscription.resumed':
        set_dict['subscription_status'] = 'active'
    elif event_type == 'customer.subscription.updated':
        status = data_object['status']
        set_dict['subscription_status'] = status
    elif event_type == 'customer.subscription.deleted' or event_type == 'customer.subscription.paused' or event_type == 'customer.deleted':
        set_dict['subscription_status'] = 'inactive'
    else:
        print(f'Unhandled event type {event_type}')

    if len(set_dict.keys()) > 0 and customer_email:
        users_collection.update_one(
            {"email": customer_email},
            {"$set": set_dict}
        )
    
    return jsonify(success=True)


@app.route('/api/partner/webhook', methods=['POST'])
def partner_user_webhook():
    """
    Idempotent user sync webhook for white-label partners.

    Mandatory fields:
        - id (unique identifier from partner system)
        - email
        - name
        - isSubscribed
    Optional fields:
        - password (required ONLY when creating a new user)
        - organization, phone, collegeName, country, invitation_code, plan, subscription_id
    """

    try:
        # --- Optional shared-secret authentication ---
        expected_secret = (
            os.environ.get('PARTNER_WEBHOOK_SECRET')
            or (config.get('PARTNER', {}).get('WEBHOOK_SECRET') if isinstance(config, dict) else None)
        )
        provided_secret = request.headers.get('X-Partner-Secret')
        if expected_secret and provided_secret != expected_secret:
            return jsonify({'success': False, 'error': 'Unauthorized'}), 401

        payload = request.get_json(silent=True) or {}

        # password is no longer required here
        required_fields = ['id', 'email', 'name', 'isSubscribed']
        missing = [f for f in required_fields if f not in payload or payload[f] in [None, ""]]
        if missing:
            return jsonify({
                'success': False,
                'error': f"Missing required field(s): {', '.join(missing)}"
            }), 400

        partner_user_id = str(payload['id']).strip()
        email = payload['email'].strip().lower()
        name = payload['name'].strip()
        organization = (payload.get('organization') or '').strip() or None
        is_subscribed = bool(payload['isSubscribed'])
        raw_password = payload.get('password')  # optional now

        # --- Optional fields ---
        cellNumber      = payload.get('phone') or payload.get('cellNumber')
        collegeName     = payload.get('collegeName')
        country         = payload.get('country')
        invitation_code = payload.get('invitation_code')
        plan            = payload.get('plan')
        subscription_id = payload.get('subscription_id')

        # Look up user primarily by partner_user_id; fallback to email for first-time linking
        existing = users_collection.find_one({'partner_user_id': partner_user_id}) \
                   or users_collection.find_one({'email': email})

        set_fields = {
            'updated_at': datetime.now(),
            'name': name,
            'email': email,  # allow updating email
            'subscription_status': 'active' if is_subscribed else 'inactive',
            'partner_user_id': partner_user_id  # keep partner id stored
        }

        if organization is not None:
            set_fields['organization'] = organization
        if cellNumber is not None:
            set_fields['cellNumber'] = cellNumber
        if collegeName is not None:
            set_fields['collegeName'] = collegeName
        if country is not None:
            set_fields['country'] = country
        if invitation_code is not None:
            set_fields['invitation_code'] = invitation_code
        if plan is not None:
            set_fields['plan'] = plan
        if subscription_id is not None:
            set_fields['subscription_id'] = subscription_id

        created = False

        if not existing:
            # For a new user, password is required once
            if not raw_password:
                return jsonify({
                    'success': False,
                    'error': 'Password is required when creating a new user'
                }), 400

            hashed_password = generate_password_hash(raw_password)
            new_user = {
                'email': email,
                'password': hashed_password,
                'federated': True,
                'created_at': datetime.now(),
                'followers': [],
                'following': [],
                'liked_posts_or_replies': [],
                'notes': [],
            }
            new_user.update(set_fields)
            result = users_collection.insert_one(new_user)
            created = True
            user_id = str(result.inserted_id)
        else:
            # For existing user, update password only if provided
            if raw_password:
                set_fields['password'] = generate_password_hash(raw_password)

            users_collection.update_one({'_id': existing['_id']}, {'$set': set_fields})
            user_id = str(existing['_id'])

        return jsonify({
            'success': True,
            'created': created,
            'email': email,
            'userId': user_id,
            'partnerUserId': partner_user_id,
            'subscription_status': set_fields['subscription_status'],
            'isSubscribed': is_subscribed
        }), 200

    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500
    
# =========================
# COMMON FILES (PDF + VIDEO) - ADDITIONAL ROUTES
# =========================

COMMON_EMAIL = "common"

def ensure_common_user():
    if not users_collection.find_one({"email": COMMON_EMAIL}):
        users_collection.insert_one({"email": COMMON_EMAIL, "created_at": datetime.now()})

def _derive_folder_subfolder(root_path: str, file_path: str):
    root_norm = os.path.normpath(root_path)
    file_norm = os.path.normpath(file_path)

    folder = os.path.basename(root_norm.rstrip("\\/"))
    rel = os.path.relpath(file_norm, root_norm)
    parts = rel.split(os.sep)
    subfolder = parts[0] if len(parts) >= 2 else ""
    return folder, subfolder

def _list_files(root_path: str, exts, recursive=True):
    if not os.path.isdir(root_path):
        raise ValueError(f"root_path is not a directory: {root_path}")

    exts = {e.lower() for e in exts}
    out = []

    if recursive:
        for r, _, files in os.walk(root_path):
            for f in files:
                if os.path.splitext(f)[1].lower() in exts:
                    out.append(os.path.join(r, f))
    else:
        for f in os.listdir(root_path):
            fp = os.path.join(root_path, f)
            if os.path.isfile(fp) and os.path.splitext(f)[1].lower() in exts:
                out.append(fp)

    return out

def _copy_into_uploads(src_path: str):
    base = os.path.basename(src_path)
    name, ext = os.path.splitext(base)
    dst = os.path.join(app.config["UPLOAD_FOLDER"], base)

    if not os.path.exists(dst):
        shutil.copy2(src_path, dst)
        return base

    i = 1
    while True:
        candidate = f"{name}_{i}{ext}"
        dst2 = os.path.join(app.config["UPLOAD_FOLDER"], candidate)
        if not os.path.exists(dst2):
            shutil.copy2(src_path, dst2)
            return candidate
        i += 1

def download_from_gcs(gcs_path: str) -> str:
    # gcs_path = gs://bucket/path/file.pdf
    if not gcs_path.startswith("gs://"):
        raise ValueError("gcs_path must start with gs://")

    bucket_name, blob_path = gcs_path.replace("gs://", "").split("/", 1)

    client = storage.Client()
    bucket = client.bucket(bucket_name)
    blob = bucket.blob(blob_path)

    fd, local_path = tempfile.mkstemp(suffix=".pdf")
    os.close(fd)

    blob.download_to_filename(local_path)
    return local_path


@app.route("/api/common/upload-pdfs", methods=["POST"])
def common_upload_pdfs():
    # multipart/form-data:
    # - files[] : one or more PDFs (OPTIONAL if gcs_path is provided)
    # - gcs_path: gs://bucket/path/file.pdf (OPTIONAL if files[] is provided)
    # - folder  : string (REQUIRED)
    # - subfolder: string (REQUIRED)
    try:
        folder = request.form.get("folder", "").strip()
        subfolder = request.form.get("subfolder", "").strip()
        if not folder or not subfolder:
            return jsonify({"error": "folder and subfolder are required"}), 400

        ensure_common_user()

        gcs_path = request.form.get("gcs_path", "").strip()
        uploaded = []

        # Build a list of filenames already present in UPLOAD_FOLDER
        filenames = []

        if gcs_path:
            # Requires: download_from_gcs(gcs_path) helper + imports (storage,tempfile,shutil)
            local_pdf = download_from_gcs(gcs_path)
            filename = os.path.basename(gcs_path)

            os.makedirs(app.config["UPLOAD_FOLDER"], exist_ok=True)
            dst = os.path.join(app.config["UPLOAD_FOLDER"], filename)
            shutil.copy2(local_pdf, dst)

            filenames.append(filename)
        else:
            if "files[]" not in request.files:
                return jsonify({"error": "No files found in the request"}), 400

            files = request.files.getlist("files[]")
            if not files:
                return jsonify({"error": "No files found in the request"}), 400

            os.makedirs(app.config["UPLOAD_FOLDER"], exist_ok=True)

            for f in files:
                if not f or not f.filename:
                    continue
                filename = os.path.basename(f.filename)
                f.save(os.path.join(app.config["UPLOAD_FOLDER"], filename))
                filenames.append(filename)

        if not filenames:
            return jsonify({"error": "No valid PDFs provided"}), 400

        for filename in filenames:
            files_collection.insert_one({
                "filename": filename,
                "uploaded_at": datetime.now(),
                "user_email": COMMON_EMAIL,
                "folder": folder,
                "subfolder": subfolder,
                "is_common": True,
                "file_type": "pdf",
            })

            f1 = executor.submit(create_index, filename)
            f1.add_done_callback(_log_future_result("create_index", filename))

            f2 = executor.submit(create_summary, filename)
            f2.add_done_callback(_log_future_result("create_summary", filename))

            uploaded.append({"file": filename, "folder": folder, "subfolder": subfolder})

        return jsonify({"message": "Common PDFs uploaded", "uploaded": uploaded}), 200

    except Exception as e:
        app.logger.exception("common_upload_pdfs failed")
        return jsonify({"error": str(e)}), 500


@app.route("/api/common/upload-videos", methods=["POST"])
def common_upload_videos():
    # multipart/form-data:
    # - files[] : one or more videos (e.g. mp4)
    # - folder  : string
    # - subfolder: string
    try:
        if "files[]" not in request.files:
            return jsonify({"error": "No files found in the request"}), 400

        folder = request.form.get("folder", "").strip()
        subfolder = request.form.get("subfolder", "").strip()
        if not folder or not subfolder:
            return jsonify({"error": "folder and subfolder are required"}), 400

        ensure_common_user()

        uploaded = []
        files = request.files.getlist("files[]")
        for f in files:
            if not f or not f.filename:
                continue

            filename = f.filename
            f.save(os.path.join(app.config["UPLOAD_FOLDER"], filename))

            files_collection.insert_one({
                "filename": filename,
                "uploaded_at": datetime.now(),
                "user_email": COMMON_EMAIL,
                "folder": folder,
                "subfolder": subfolder,
                "is_common": True,
                "file_type": "video",
            })

            uploaded.append({"file": filename, "folder": folder, "subfolder": subfolder})

        return jsonify({"message": "Common videos uploaded", "uploaded": uploaded}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500
    

@app.route("/api/common/pdfs", methods=["GET"])
def common_fetch_pdfs():
    try:
        folder = request.args.get("folder")
        subfolder = request.args.get("subfolder")

        query = {"user_email": COMMON_EMAIL, "file_type": "pdf"}
        if folder:
            query["folder"] = folder
        if subfolder:
            query["subfolder"] = subfolder

        docs = files_collection.find(query, {"_id": 0, "filename": 1, "folder": 1, "subfolder": 1})

        files = []
        for d in docs:
            fn = d.get("filename")
            files.append({
                "file": fn,
                "folder": d.get("folder", ""),
                "subfolder": d.get("subfolder", ""),
                "url": f"/api/common/pdf/{fn}"
            })

        return jsonify({"files": files}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/common/videos", methods=["GET"])
def common_fetch_videos():
    try:
        folder = request.args.get("folder")
        subfolder = request.args.get("subfolder")

        query = {"user_email": COMMON_EMAIL, "file_type": "video"}
        if folder:
            query["folder"] = folder
        if subfolder:
            query["subfolder"] = subfolder

        docs = files_collection.find(query, {"_id": 0, "filename": 1, "folder": 1, "subfolder": 1})

        videos = []
        for d in docs:
            fn = d.get("filename")
            videos.append({
                "file": fn,
                "folder": d.get("folder", ""),
                "subfolder": d.get("subfolder", ""),
                "url": f"/api/common/video/{fn}"
            })

        return jsonify({"videos": videos}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500

# --- REPLACE these two routes in your app.py ---

@app.route("/api/common/pdf/<path:filename>", methods=["GET"])
def common_get_pdf(filename):
    try:
        partner_user_id = (request.args.get("id") or "").strip()
        if not partner_user_id:
            return jsonify({"error": "Missing id"}), 400

        user = users_collection.find_one(
            {"partner_user_id": partner_user_id},
            {"_id": 0, "subscription_status": 1}
        )
        if not user:
            return jsonify({"error": "User not found"}), 404

        if (user.get("subscription_status") or "").lower() != "active":
            return jsonify({"error": "Subscription inactive"}), 403

        # validate file exists in DB as a common pdf
        doc = files_collection.find_one(
            {"user_email": COMMON_EMAIL, "file_type": "pdf", "filename": filename},
            {"_id": 0}
        )
        if not doc:
            return jsonify({"error": "File not found"}), 404

        # Force download (your current code uses as_attachment=False)
        return send_from_directory(app.config["UPLOAD_FOLDER"], filename, as_attachment=True)

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/common/video/<path:filename>", methods=["GET"])
def common_get_video(filename):
    try:
        partner_user_id = (request.args.get("id") or "").strip()
        if not partner_user_id:
            return jsonify({"error": "Missing id"}), 400

        user = users_collection.find_one(
            {"partner_user_id": partner_user_id},
            {"_id": 0, "subscription_status": 1}
        )
        if not user:
            return jsonify({"error": "User not found"}), 404

        if (user.get("subscription_status") or "").lower() != "active":
            return jsonify({"error": "Subscription inactive"}), 403

        # validate file exists in DB as a common video
        doc = files_collection.find_one(
            {"user_email": COMMON_EMAIL, "file_type": "video", "filename": filename},
            {"_id": 0}
        )
        if not doc:
            return jsonify({"error": "File not found"}), 404

        # Force download
        return send_from_directory(app.config["UPLOAD_FOLDER"], filename, as_attachment=True)

    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)
