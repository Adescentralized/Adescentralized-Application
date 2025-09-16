// src/s3Service.js
require('dotenv').config();
const S3 = require('aws-sdk/clients/s3');
const { v4: uuidv4 } = require('uuid');

const bucketName = process.env.AWS_S3_BUCKET_NAME;
const region = process.env.AWS_REGION;
const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;

// Inicializa o cliente S3 com as credenciais
const s3 = new S3({
    region,
    accessKeyId,
    secretAccessKey
});

// Função para fazer upload de um arquivo para o S3
async function uploadFile(file) {
    // Pega a extensão do arquivo original (ex: .png, .jpg)
    const fileExtension = file.originalname.split('.').pop();
    
    // Gera uma chave (nome do arquivo) única usando uuid
    const fileKey = `${uuidv4()}.${fileExtension}`;

    const uploadParams = {
        Bucket: bucketName,
        Key: fileKey, // O nome do arquivo no bucket
        Body: file.buffer, // O conteúdo do arquivo
        ACL: 'public-read' // Torna o arquivo publicamente legível
    };

    // Faz o upload e retorna a promessa
    const result = await s3.upload(uploadParams).promise();
    
    // Retorna a URL pública do arquivo
    return result.Location;
}

module.exports = { uploadFile };