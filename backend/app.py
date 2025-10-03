# app.py

import os
from flask import Flask, request, jsonify
from flask_cors import CORS
from google import genai
from google.genai import types

try:
    client = genai.Client()
except Exception:
    print("WARNING: GEMINI_API_KEY environment variable not found. "
          "Set it for production or local testing.")
    client = None

app = Flask(__name__)
# Enable CORS for the frontend running on a different port (e.g., React's 3000)
CORS(app, resources={r"/api/*": {"origins": [
    "http://localhost:5173",          # Local testing
    "https://grounded-analyst-app.vercel.app",
]}})

# --- Analyst Persona and Instruction ---
# This is the 'secret sauce' that defines the tool's behavior and grounding.
SYSTEM_INSTRUCTION = (
    "Act as a senior financial analyst. "
    "Your primary goal is to provide a professional, concise, and objective analysis "
    "based *only* on the most recent, verifiable information. "
    "Do not include introductory pleasantries or conversational filler. "
    "Be direct and factual. Cite sources briefly if possible."
)

@app.route('/api/analyze', methods=['POST'])
def analyze_query():
    """
    Handles the request from the frontend, calls Gemini with search grounding,
    and returns the professional analysis.
    """
    try:
        data = request.get_json()
        user_query = data.get('query')

        if not user_query:
            return jsonify({"error": "Missing 'query' in request body."}), 400

        print(f"Received query: {user_query}")

        # --- Gemini API Call with Grounding and System Instruction ---
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=user_query,
            config=types.GenerateContentConfig(
                # 1. Set the professional persona
                system_instruction=SYSTEM_INSTRUCTION,
                # 2. Enable Google Search Grounding for real-time data
                tools=[{"google_search": {}}]
            )
        )

        # Extract the text and potentially the grounding sources
        analysis_text = response.text
        grounding_sources = []
        if (response.candidates and 
            response.candidates[0].grounding_metadata and 
            response.candidates[0].grounding_metadata.grounding_chunks):
                
            # Loop through each grounding chunk (piece of information used)
            for chunk in response.candidates[0].grounding_metadata.grounding_chunks:
                if chunk.web:
                    source_uri = chunk.web.uri
                    # Only add unique URIs
                    if source_uri not in [s['uri'] for s in grounding_sources]:
                        grounding_sources.append({
                            "uri": source_uri
                            # You could also try to get the title if available
                        })

        # --- NEW CODE: Return both analysis and sources ---
        return jsonify({
            "analysis": analysis_text,
            "sources": grounding_sources  # Send the list of source URIs
        })

    except Exception as e:
        print(f"An error occurred: {e}")
        return jsonify({"error": "Internal server error during analysis."}), 500

if __name__ == '__main__':
    # Run the server on http://127.0.0.1:5000/
    app.run(debug=True)