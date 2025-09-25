import { GoogleGenAI, Type } from "@google/genai";
import { ProcessedData, DataRow, GeminiResponse } from '../types';
import { GEMINI_API_KEY } from '../config';

// Prioriza a chave de API do ambiente (fornecida pela plataforma)
// e usa o arquivo config.ts como fallback para desenvolvimento local.
const apiKey = process.env.API_KEY || GEMINI_API_KEY;

if (!apiKey || apiKey === "SUA_CHAVE_API_AQUI") {
  throw new Error("A chave da API do Gemini não foi encontrada. Certifique-se de que está configurada no ambiente ou no arquivo 'config.ts'.");
}
const ai = new GoogleGenAI({ apiKey });


const responseSchema = {
  type: Type.OBJECT,
  properties: {
    headers: {
      type: Type.ARRAY,
      description: "Um array de strings representando os cabeçalhos das colunas, na ordem correta, com base na planilha modelo.",
      items: { type: Type.STRING },
    },
    rows: {
      type: Type.ARRAY,
      description: "Um array de arrays, onde cada array interno é uma linha de dados reestruturados. Os valores em cada linha devem corresponder aos cabeçalhos.",
      items: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
      },
    },
    transformationSummary: {
        type: Type.ARRAY,
        description: "Um registro detalhado do processo de transformação. Cada string no array deve descrever uma ação específica tomada, como mapeamento de colunas, adições ou anexos.",
        items: { type: Type.STRING },
    },
    aiCommentary: {
        type: Type.STRING,
        description: "Um resumo breve, amigável e conversacional do processo de transformação. Deve soar como um comentário da IA, destacando as ações ou observações mais importantes.",
    },
  },
  required: ["headers", "rows", "transformationSummary", "aiCommentary"],
};

export async function restructureSpreadsheet(
  sourceData: string, 
  templateData: string,
  onProgress: (message: string) => void
): Promise<ProcessedData> {
  const prompt = `
    Persona: Atue como um Motor de IA especialista em Transformação de Dados. Seu propósito principal é sincronizar inteligentemente a estrutura de uma planilha (origem) com base no esquema de outra (modelo). Suas operações devem ser precisas, eficientes e preservar os dados.

    Missão: Você receberá dois arquivos de planilha como dados CSV. Sua missão é re-arquitetar a planilha_origem para se conformar perfeitamente à estrutura definida pela planilha_modelo.

    Entradas:
    - planilha_origem: O arquivo contendo os dados originais em uma estrutura desatualizada ou incorreta.
    - planilha_modelo: O arquivo que serve como o "registro mestre" ou modelo principal. Sua estrutura (nomes e ordem das colunas) é o estado final desejado.

    Protocolo de Execução:
    1.  Extração de Esquema: Analise a planilha_modelo para extrair seu esquema definitivo: uma lista exata dos cabeçalhos das colunas e sua ordem precisa.
    2.  Análise da Origem e Mapeamento Semântico: Analise a planilha_origem. Crie um mapeamento entre as colunas de origem e o esquema do modelo usando correspondência exata e aproximada (por exemplo, mapeie 'ID da Trans.' da origem para 'IDTransacao' do modelo).
    3.  Transformação e Reestruturação de Dados:
        - Gere um novo conjunto de dados com base no esquema do modelo.
        - Preencha as colunas do novo conjunto de dados com os dados da planilha_origem de acordo com o mapeamento.
        - **Inferência de Tipo e Formato de Dados:** Analise inteligentemente os dados dentro das colunas. Onde possível, infira e tente padronizar formatos para tipos de dados comuns como datas (ex: padronizar para AAAA-MM-DD), moeda (ex: remover símbolos de moeda, mas manter o valor numérico), ou porcentagens.
        - Para quaisquer colunas definidas no modelo, mas não encontradas na origem, crie-as como colunas vazias.
        - Para quaisquer colunas não mapeadas da origem, anexe-as ao final do novo conjunto de dados, preservando seu cabeçalho e dados originais, para evitar a perda de dados.

    Saída Final:
    Produza um objeto JSON com quatro chaves: "headers", "rows", "transformationSummary" e "aiCommentary".
    - "headers": Um array de strings representando os títulos finais das colunas, começando com as colunas do modelo em ordem, seguidas por quaisquer colunas de origem não mapeadas.
    - "rows": Um array de arrays, onde cada array interno representa uma única linha de dados transformados. O número de itens em cada array de linha deve corresponder exatamente ao número de itens no array de cabeçalhos.
    - "transformationSummary": Um array de strings legíveis por humanos detalhando as alterações feitas. Este registro deve ser claro, conciso e declarar explicitamente quaisquer suposições feitas durante o processo. Por exemplo: ["Coluna de origem 'Nome Antigo' mapeada para 'Nome Novo' com base na similaridade semântica.", "Todas as datas em 'DataPedido' foram padronizadas para o formato AAAA-MM-DD.", "Adicionada a coluna faltante do modelo 'Status'.", "Anexada a coluna de origem não mapeada 'ID Legado' ao final."].
    - "aiCommentary": Um resumo breve, amigável e conversacional do processo de transformação. Deve soar como um comentário do assistente de IA, destacando as ações mais importantes tomadas ou observações feitas. Por exemplo: "Eu alinhei com sucesso seus dados de origem com o modelo! Mapeei várias colunas, adicionei uma nova coluna 'Status' do seu modelo e anexei algumas colunas extras do seu arquivo de origem ao final para garantir que nenhum dado fosse perdido. Tudo deve estar em perfeita ordem agora."
    - Não inclua nenhuma explicação, texto introdutório ou formatação markdown em sua resposta. Apenas retorne o JSON bruto que adere ao esquema fornecido.

    --- PLANILHA MODELO (CSV) ---
    ${templateData}
    --- FIM PLANILHA MODELO ---

    --- PLANILHA DE ORIGEM (CSV) ---
    ${sourceData}
    --- FIM PLANILHA DE ORIGEM ---
  `;
  
  try {
    onProgress('Analisando planilhas...');

    onProgress('Consultando IA... (Isso pode levar um momento)');
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: responseSchema,
      }
    });

    onProgress('Processando resposta da IA...');
    const jsonText = response.text.trim();
    const parsedResponse: GeminiResponse = JSON.parse(jsonText);

    if (!parsedResponse.headers || !parsedResponse.rows || !parsedResponse.transformationSummary || !parsedResponse.aiCommentary) {
        throw new Error("Formato de resposta da IA inválido. Faltando 'headers', 'rows', 'transformationSummary' ou 'aiCommentary'.");
    }

    onProgress('Formatando resultado final...');
    const { headers, rows, transformationSummary, aiCommentary } = parsedResponse;

    const data: DataRow[] = rows.map((row) => {
      const rowObject: DataRow = {};
      headers.forEach((header, index) => {
        rowObject[header] = row[index] || '';
      });
      return rowObject;
    });

    return { headers, data, transformationSummary, aiCommentary };
  } catch (error) {
    console.error("Erro ao chamar a API Gemini:", error);
    if (error instanceof Error && error.message.includes('JSON')) {
        throw new Error("A IA retornou uma resposta JSON inválida. Por favor, tente novamente.");
    }
    throw new Error("Falha ao reestruturar a planilha. O serviço de IA pode estar indisponível ou a solicitação foi inválida.");
  }
}