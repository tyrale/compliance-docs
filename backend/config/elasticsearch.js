const { Client } = require('@elastic/elasticsearch');
const dotenv = require('dotenv');

dotenv.config();

const client = new Client({
  node: process.env.ELASTICSEARCH_NODE || 'http://localhost:9200',
  maxRetries: 5,
  requestTimeout: 60000,
  sniffOnStart: true,
});

// Initialize Elasticsearch indices
const initializeElasticsearch = async () => {
  try {
    // Create documents index
    const documentsExists = await client.indices.exists({
      index: 'documents',
    });

    if (!documentsExists) {
      await client.indices.create({
        index: 'documents',
        body: {
          mappings: {
            properties: {
              title: { type: 'text' },
              content: { type: 'text' },
              metadata: {
                properties: {
                  author: { type: 'keyword' },
                  keywords: { type: 'keyword' },
                  category: { type: 'keyword' },
                  createdDate: { type: 'date' },
                  lastModified: { type: 'date' },
                },
              },
              uploadedBy: { type: 'keyword' },
              permissions: {
                properties: {
                  readAccess: { type: 'keyword' },
                  writeAccess: { type: 'keyword' },
                },
              },
            },
          },
        },
      });
    }

    // Create sections index
    const sectionsExists = await client.indices.exists({
      index: 'sections',
    });

    if (!sectionsExists) {
      await client.indices.create({
        index: 'sections',
        body: {
          mappings: {
            properties: {
              documentId: { type: 'keyword' },
              title: { type: 'text' },
              content: { type: 'text' },
              summary: { type: 'text' },
              pageNumber: { type: 'integer' },
              metadata: {
                properties: {
                  level: { type: 'integer' },
                  tags: { type: 'keyword' },
                },
              },
            },
          },
        },
      });
    }

    console.log('Elasticsearch indices initialized successfully');
  } catch (error) {
    console.error('Error initializing Elasticsearch:', error);
    throw error;
  }
};

module.exports = { client, initializeElasticsearch };
