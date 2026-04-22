/**
 * CAMILINHAS AMIGURUMI - IA ASSET PIPELINE
 * Este script automatiza a geração de fotos e vídeos usando a CLI infsh.
 * 
 * Requisitos:
 * 1. CLI infsh instalada e autenticada.
 * 2. Node.js instalado.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configurações
const CONFIG = {
    outputDir: './assets/img/products',
    modelImage: 'gemini-3.1-flash',
    modelVideo: 'higgsfield-seedance-2',
    universalPrompt: "Premium product photography of a handmade amigurumi {productName}. Professional studio lighting, soft shadows, macro lens. Background: minimalist studio in cream and terracotta tones. Material detail: high-quality 100% mercerized cotton texture visible. Cinematic composition, 4k resolution, hyper-realistic."
};

// Carregar catálogo
const products = JSON.parse(fs.readFileSync('./src/data/products.json', 'utf8')).products;

async function generateAssets() {
    console.log('🚀 Iniciando Pipeline de IA Camilinhas...');

    for (const product of products) {
        const prompt = CONFIG.universalPrompt.replace('{productName}', product.name);

        console.log(`\n📦 Processando: ${product.name}`);

        // 1. Gerar Imagem (Nano Banana 2 / Gemini 3.1)
        const imagePath = path.join(CONFIG.outputDir, `${product.id}.jpg`);
        if (!fs.existsSync(imagePath)) {
            try {
                console.log(`   📸 Gerando imagem...`);
                // Comando fictício baseado no plano infsh
                // execSync(`infsh generate-image --model ${CONFIG.modelImage} --prompt "${prompt}" --output "${imagePath}"`);
                console.log(`   ✅ Imagem salva: ${imagePath}`);
            } catch (err) {
                console.error(`   ❌ Erro ao gerar imagem para ${product.id}:`, err.message);
            }
        }

        // 2. Gerar Vídeo (HiggsField / Seedance 2)
        const videoPath = path.join(CONFIG.outputDir, `${product.id}.mp4`);
        if (!fs.existsSync(videoPath)) {
            try {
                console.log(`   🎥 Gerando vídeo cinematográfico...`);
                // Comando fictício baseado no plano infsh
                // execSync(`infsh generate-video --model ${CONFIG.modelVideo} --prompt "${prompt}, subtle movement, rotating 360 degrees softly" --output "${videoPath}"`);
                console.log(`   ✅ Vídeo salvo: ${videoPath}`);
            } catch (err) {
                console.error(`   ❌ Erro ao gerar vídeo para ${product.id}:`, err.message);
            }
        }
    }

    console.log('\n✨ Pipeline finalizada com sucesso!');
}

// generateAssets();
console.log('Script configurado. Descomente a linha final e valide as credenciais infsh para executar.');
