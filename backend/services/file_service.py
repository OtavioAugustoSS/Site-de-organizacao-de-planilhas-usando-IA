import pandas as pd
import io
import json
from typing import List, Dict, Any

def read_file_to_dataframe(file_content: bytes, filename: str) -> pd.DataFrame:
    """Lê o conteúdo do arquivo (Excel ou CSV) e retorna um DataFrame."""
    if filename.endswith('.csv'):
        return pd.read_csv(io.BytesIO(file_content))
    elif filename.endswith(('.xls', '.xlsx')):
        return pd.read_excel(io.BytesIO(file_content))
    else:
        raise ValueError("Formato de arquivo não suportado. Use CSV ou Excel.")

def get_dataframe_sample(df: pd.DataFrame, rows: int = 5) -> str:
    """Retorna uma amostra do DataFrame em formato JSON string."""
    # Converte timestamps para string para evitar erros de serialização
    df_sample = df.head(rows).copy()
    for col in df_sample.columns:
        if pd.api.types.is_datetime64_any_dtype(df_sample[col]):
            df_sample[col] = df_sample[col].astype(str)
            
    return df_sample.to_json(orient='records', date_format='iso')

def get_headers(df: pd.DataFrame) -> List[str]:
    """Retorna a lista de cabeçalhos do DataFrame."""
    return list(df.columns)

def generate_excel_from_data(data: List[Dict[str, Any]], headers: List[str]) -> io.BytesIO:
    """Gera um arquivo Excel a partir de uma lista de dicionários e headers."""
    df = pd.DataFrame(data)
    
    # Garante que todas as colunas do template existam, preenchendo com vazio se necessário
    for header in headers:
        if header not in df.columns:
            df[header] = None
            
    # Reordena as colunas para bater com o template e remove extras se houver (opcional, mas seguro)
    df = df[headers]
    
    output = io.BytesIO()
    with pd.ExcelWriter(output, engine='openpyxl') as writer:
        df.to_excel(writer, index=False)
    
    output.seek(0)
    return output
