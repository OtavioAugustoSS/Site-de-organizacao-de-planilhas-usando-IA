import os
import shutil
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, FileResponse
from dotenv import load_dotenv
import uuid

from backend.services.file_service import read_file_to_dataframe, get_dataframe_sample, get_headers, generate_excel_from_data
from backend.services.ai_service import configure_genai, restructure_data

# Carrega variáveis de ambiente
load_dotenv()

app = FastAPI(title="AI Spreadsheet Restructurer")

# Configuração CORS
origins = [
    "http://localhost",
    "http://localhost:3000", # React default
    "http://localhost:5173", # Vite default
    "*" # Permissive for dev
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configuração Gemini
API_KEY = os.getenv("GEMINI_API_KEY")
if not API_KEY:
    print("AVISO: GEMINI_API_KEY não encontrada nas variáveis de ambiente.")
else:
    configure_genai(API_KEY)

# Diretório temporário para outputs
OUTPUT_DIR = "temp_outputs"
os.makedirs(OUTPUT_DIR, exist_ok=True)

@app.post("/restructure")
async def restructure_files(
    source_file: UploadFile = File(...),
    template_file: UploadFile = File(...)
):
    try:
        # 1. Leitura dos Arquivos
        source_content = await source_file.read()
        template_content = await template_file.read()
        
        df_source = read_file_to_dataframe(source_content, source_file.filename)
        df_template = read_file_to_dataframe(template_content, template_file.filename)
        
        # 2. Preparação para IA
        source_sample = get_dataframe_sample(df_source)
        target_headers = get_headers(df_template)
        
        # Converte todo o dataframe de origem para lista de dicts para processamento
        # Nota: Em produção, isso deve ser otimizado para não estourar memória/contexto
        full_source_data = df_source.to_dict(orient='records')
        
        # 3. Chamada à IA
        if not API_KEY:
            raise HTTPException(status_code=500, detail="API Key do Gemini não configurada no servidor.")
            
        mapped_data, change_log = restructure_data(source_sample, target_headers, full_source_data)
        
        # 4. Geração do Arquivo Final
        output_excel_io = generate_excel_from_data(mapped_data, target_headers)
        
        # Salva em disco para download
        output_filename = f"restructured_{uuid.uuid4()}.xlsx"
        output_path = os.path.join(OUTPUT_DIR, output_filename)
        
        with open(output_path, "wb") as f:
            f.write(output_excel_io.getvalue())
            
        # URL de download (assumindo localhost por enquanto)
        # Em produção, seria um link para S3 ou similar, ou uma rota estática
        download_url = f"/download/{output_filename}"
        
        return {
            "summary": change_log,
            "download_url": download_url
        }

    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/download/{filename}")
async def download_file(filename: str):
    file_path = os.path.join(OUTPUT_DIR, filename)
    if os.path.exists(file_path):
        return FileResponse(file_path, filename=filename, media_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    else:
        raise HTTPException(status_code=404, detail="Arquivo não encontrado")

@app.get("/health")
def health_check():
    return {"status": "ok"}
