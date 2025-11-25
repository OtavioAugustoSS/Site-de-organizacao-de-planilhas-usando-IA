1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install Python dependencies:
   ```bash
   pip install -r requirements.txt
   ```

3. Create a `.env` file in the `backend` directory and add your Gemini API Key:
   ```
   GEMINI_API_KEY=your_api_key_here
   ```

4. Run the backend server:
   ```bash
   python -m uvicorn main:app --reload
   ```
   The backend will run at `http://localhost:8000`.

### 2. Frontend Setup

1. Open a new terminal and ensure you are in the project root.

2. Install dependencies:
   ```bash
   npm install
   ```

3. Run the frontend development server:
   ```bash
   npm run dev
   ```
   The frontend will run at `http://localhost:3000`.
