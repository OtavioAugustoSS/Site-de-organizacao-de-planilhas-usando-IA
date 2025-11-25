import pandas as pd
import os

def create_test_files():
    os.makedirs('backend/tests/data', exist_ok=True)
    
    # Source Data (Planilha A)
    source_data = {
        'Nome Completo': ['João Silva', 'Maria Souza', 'Pedro Santos'],
        'Data Nasc.': ['1990-01-01', '1985-05-15', '1992-10-20'],
        'Salário Bruto': [5000, 7500, 3200],
        'Departamento': ['TI', 'RH', 'Vendas']
    }
    df_source = pd.DataFrame(source_data)
    df_source.to_excel('backend/tests/data/source.xlsx', index=False)
    print("Created backend/tests/data/source.xlsx")
    
    # Template Data (Planilha B)
    # Estrutura diferente: nomes separados, salario anual, data formatada diferente (implícito)
    template_data = {
        'First_Name': [],
        'Last_Name': [],
        'Birth_Date': [],
        'Annual_Salary': [],
        'Dept_Code': []
    }
    df_template = pd.DataFrame(template_data)
    df_template.to_excel('backend/tests/data/template.xlsx', index=False)
    print("Created backend/tests/data/template.xlsx")

if __name__ == "__main__":
    create_test_files()
