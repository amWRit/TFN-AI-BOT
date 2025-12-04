/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['@langchain/community', '@langchain/anthropic']
  },
  env: {
    AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID,
    AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY,
    AWS_SESSION_TOKEN: process.env.AWS_SESSION_TOKEN,
    AWS_REGION: process.env.AWS_REGION,
    BEDROCK_MODEL_ID: process.env.BEDROCK_MODEL_ID || 'amazon.nova-lite-v1:0',
    BEDROCK_EMBED_MODEL_ID: process.env.BEDROCK_EMBED_MODEL_ID || 'amazon.titan-embed-text-v1'
  }
}

module.exports = nextConfig;
