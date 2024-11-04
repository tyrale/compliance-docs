const { Client } = require('@elastic/elasticsearch');
require('dotenv').config();

const client = new Client({
    node: process.env.ELASTICSEARCH_NODE || 'http://localhost:9200',
    auth: {
        username: process.env.ELASTICSEARCH_USERNAME || 'elastic',
        password: process.env.ELASTICSEARCH_PASSWORD || 'changeme'
    },
    maxRetries: 5,
    requestTimeout: 60000,
    sniffOnStart: true
});

const initializeElasticsearch = async () => {
    try {
        // Test the connection
        await client.ping();
        console.log('Elasticsearch connection successful');

        // Create indices if they don't exist
        const indices = ['sections', 'documents'];
        
        for (const index of indices) {
            const exists = await client.indices.exists({ index });
            
            if (!exists) {
                await client.indices.create({
                    index,
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
                                        tags: { type: 'keyword' }
                                    }
                                }
                            }
                        }
                    }
                });
                console.log(`Created index: ${index}`);
            }
        }
    } catch (error) {
        console.error('Error initializing Elasticsearch:', error);
        // Don't throw error to allow application to start without Elasticsearch
        // But log it for monitoring
    }
};

// Remove this line since we'll call it from server.js
// initializeElasticsearch();

// Export both the client and the initialization function
module.exports = {
    client,
    initializeElasticsearch
};