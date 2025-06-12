// lib/typesense.js

import Typesense from 'typesense';

const client = new Typesense.Client({
  nodes: [
    {
      host: 'localhost', // Your Typesense server's hostname
      port: 8108, // Your Typesense server's port
      protocol: 'http', // or 'https'
    },
  ],
  apiKey: 'your_api_key', // Replace with your Typesense API key
  connectionTimeoutSeconds: 2,
});

export default client;






// Run this once to create your collection in Typesense

import client from './lib/typesense';

const schema = {
  name: 'your_collection_name',
  fields: [
    { name: 'id', type: 'int32' },
    { name: 'title', type: 'string' },
    { name: 'description', type: 'string' },
  ],
  default_sorting_field: 'id',
};

async function createCollection() {
  try {
    const result = await client.collections().create(schema);
    console.log('Collection created:', result);
  } catch (error) {
    console.error('Error creating collection:', error);
  }
}

createCollection();







// Example of indexing documents

const documents = [
    { id: 1, title: 'Hello World', description: 'This is a test document' },
    { id: 2, title: 'Next.js with Typesense', description: 'How to use Typesense with Next.js' },
  ];
  
  async function indexDocuments() {
    try {
      const result = await client.collections('your_collection_name')
        .documents()
        .import(documents);
      console.log('Documents indexed:', result);
    } catch (error) {
      console.error('Error indexing documents:', error);
    }
  }
  
  indexDocuments();
  