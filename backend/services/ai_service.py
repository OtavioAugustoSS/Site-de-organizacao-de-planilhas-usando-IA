import os
import json
import google.generativeai as genai
from typing import List, Dict, Any, Tuple

# Configuração da API Key deve ser feita no main ou via variáveis de ambiente
def configure_genai(api_key: str):
    genai.configure(api_key=api_key)

def restructure_data(source_sample: str, target_headers: List[str], full_source_data: List[Dict[str, Any]]) -> Tuple[List[Dict[str, Any]], str]:
    """
    Envia os dados para o Gemini e retorna os dados mapeados e o log de mudanças.
    Nota: Para grandes volumes, idealmente processaríamos em batches ou usaríamos a API de arquivos do Gemini.
    Para este MVP, enviaremos o JSON completo se não for gigante, ou instruiremos a IA a gerar código de transformação.
    
    Dada a restrição de contexto e o pedido do usuário ("Mapear dados..."), 
    vamos enviar uma amostra para a IA entender o padrão e pedir para ela processar o dado todo 
    OU (mais robusto para LLMs) pedir para ela gerar um script de mapeamento (JSON de regras) e aplicamos no Python.
    
    Porém, o requisito diz: "A IA deve retornar dois objetos... mapped_data". 
    Isso implica que a IA faz o processamento. Vamos limitar o tamanho para o MVP.
    """
    
    model = genai.GenerativeModel('gemini-1.5-flash')
    
    # Prompt do Sistema
    system_instruction = (
        "Você é um especialista em dados. Sua tarefa é analisar a estrutura da 'Planilha A' "
        "e mapear os dados para respeitar estritamente as colunas e regras da 'Planilha B'. "
        "Realize as transformações necessárias."
    )
    
    # Construção do Prompt
    prompt = f"""
    {system_instruction}

    Aqui estão os cabeçalhos da Planilha B (Template - Alvo):
    {json.dumps(target_headers)}

    Aqui está uma amostra dos dados da Planilha A (Origem):
    {source_sample}

    Aqui estão TODOS os dados da Planilha A que precisam ser transformados:
    {json.dumps(full_source_data, default=str)}

    Retorne APENAS um JSON válido com a seguinte estrutura, sem markdown ou explicações adicionais fora do JSON:
    {{
        "mapped_data": [ ... lista de objetos com as chaves exatas da Planilha B ... ],
        "change_log": "Resumo textual em Português das alterações feitas (ex: Coluna X para Y, formatação de data, etc)."
    }}
    """

    try:
        response = model.generate_content(prompt)
        response_text = response.text
        
        # Limpeza básica caso a IA retorne blocos de código markdown
        if response_text.startswith("```json"):
            response_text = response_text[7:]
        if response_text.endswith("```"):
            response_text = response_text[:-3]
            
        result = json.loads(response_text)
        
        return result.get("mapped_data", []), result.get("change_log", "Sem alterações registradas.")
        
    except Exception as e:
        print(f"Erro na chamada da IA: {e}")
        # Fallback ou re-raise
        raise e
