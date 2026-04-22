
import re

with open('index.html', 'r', encoding='utf-8') as f:
    content = f.read()

def add_metadata(match):
    card = match.group(0)
    # Default descriptions/specs
    desc = 'Peça artesanal exclusiva, feita com todo carinho e dedicação em cada ponto.'
    specs = 'Material: 100% Algodão Mercerizado | Enchimento: Fibra Siliconada Antialérgica'
    
    if 'Tam: 20cm | Funko' in card:
        desc = 'Miniatura colecionável em estilo Funko Pop. Design autoral com acabamento fosco e detalhes expressivos.'
        specs = 'Altura: 20cm | Olhos: Trava de Segurança | Fio: Amigurumi Premium'
    elif 'Tam: 25cm | Kit' in card:
        desc = 'Amigurumi de tamanho médio, ideal para nichos decorativos e abraços apertados. Textura ultra macia.'
        specs = 'Altura: 25cm | Material: Fio Soft Hipoalergênico | Detalhes: Bordados à mão'
    elif 'Chaveiro' in card:
        desc = 'A fofura que acompanha suas chaves ou mochila. Compacto, leve e extremamente resistente.'
        specs = 'Tamanho: 8-10cm | Acessório: Argola Italiana Inox | Lavável: Sim'

    # Inject data attributes
    # We replace the opening div tag
    new_div = f'<div class="product-card group" data-description="{desc}" data-specs="{specs}">'
    card = re.sub(r'<div class="product-card group">', new_div, card)
    return card

# Regex to find product cards
content = re.sub(r'<div class="product-card group">.*?</div>', add_metadata, content, flags=re.DOTALL)

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(content)
print("Metadata injected successfully.")
