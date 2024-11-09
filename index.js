const express = require("express");
const AWS = require("aws-sdk");
const cors = require("cors");

require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

// Configurar CORS para permitir solicitações do front-end
app.use(cors());
app.use(express.json()); // Suporte para JSON no corpo da requisição

// Configurar AWS S3
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});

// Função para fazer o upload para o S3
async function uploadToS3(fileName, fileContent) {
  const params = {
    Bucket: process.env.S3_BUCKET,
    Key: fileName,
    Body: fileContent,
  };

  try {
    const data = await s3.upload(params).promise();
    console.log("Upload bem-sucedido para o S3:", data.Location);
    return data.Location; // URL pública do arquivo
  } catch (error) {
    console.error("Erro ao fazer upload para o S3:", error);
    throw error;
  }
}

// Rota para fazer o upload dos arquivos
app.post("/upload", async (req, res) => {
  try {
    const { name, url } = req.body;
    console.log("Recebido para upload:", name, url);

    // Importação dinâmica de node-fetch
    const fetch = (await import("node-fetch")).default;

    // Baixar o conteúdo do arquivo a partir da URL
    const response = await fetch(url);
    if (!response.ok)
      throw new Error(`Erro ao baixar o arquivo: status ${response.status}`);

    const arrayBuffer = await response.arrayBuffer();
    const fileContent = Buffer.from(arrayBuffer);
    console.log("Conteúdo do arquivo baixado com sucesso.");

    // Fazer o upload para o S3
    const s3Url = await uploadToS3(name, fileContent);

    res.json({ name, url: s3Url }); // Retorna a URL do arquivo no S3
  } catch (error) {
    console.error("Erro ao fazer upload para o S3:", error);
    res.status(500).json({ error: "Erro ao fazer upload para o S3." });
  }
});

// Iniciar o servidor
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
