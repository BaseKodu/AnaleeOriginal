# vector_store.py
from chromadb import Client, Settings
from chromadb.utils import embedding_functions
import logging
from typing import List, Dict, Optional
import json
import os

logger = logging.getLogger(__name__)

class TransactionVectorStore:
    def __init__(self):
        # Initialize Chroma client
        self.client = Client(Settings(
            persist_directory="./data/vector_store",
            anonymized_telemetry=False
        ))
        
        # Use OpenAI embeddings
        self.embedding_function = embedding_functions.OpenAIEmbeddingFunction(
            api_key=os.environ.get('OPENAI_API_KEY'),
            model_name="text-embedding-3-small"
        )
        
        # Create collections for different types of data
        self.transactions_collection = self.client.get_or_create_collection(
            name="transactions",
            embedding_function=self.embedding_function
        )
        
        self.accounts_collection = self.client.get_or_create_collection(
            name="accounts",
            embedding_function=self.embedding_function
        )

    def add_transaction(self, transaction: Dict) -> None:
        """Add a transaction to the vector store"""
        try:
            # Create a rich text representation of the transaction
            transaction_text = (
                f"Description: {transaction['description']} "
                f"Amount: {transaction['amount']} "
                f"Category: {transaction.get('category', 'Unknown')} "
                f"Explanation: {transaction.get('explanation', '')}"
            )
            
            # Add to collection
            self.transactions_collection.add(
                documents=[transaction_text],
                metadatas=[{
                    'transaction_id': str(transaction['id']),
                    'amount': transaction['amount'],
                    'category': transaction.get('category', 'Unknown'),
                    'account_id': str(transaction.get('account_id', '')),
                    'date': transaction.get('date', '').isoformat() if transaction.get('date') else ''
                }],
                ids=[f"trans_{transaction['id']}"]
            )
            
        except Exception as e:
            logger.error(f"Error adding transaction to vector store: {str(e)}")
            raise

    def add_account(self, account: Dict) -> None:
        """Add an account to the vector store"""
        try:
            # Create rich text representation of the account
            account_text = (
                f"Name: {account['name']} "
                f"Category: {account['category']} "
                f"Sub-category: {account.get('sub_category', '')} "
                f"Purpose: Standard {account['category']} account for {account['name'].lower()} transactions"
            )
            
            # Add to collection
            self.accounts_collection.add(
                documents=[account_text],
                metadatas=[{
                    'account_id': str(account['id']),
                    'category': account['category'],
                    'link': account.get('link', ''),
                    'is_active': account.get('is_active', True)
                }],
                ids=[f"acc_{account['id']}"]
            )
            
        except Exception as e:
            logger.error(f"Error adding account to vector store: {str(e)}")
            raise

    def find_similar_transactions(self, description: str, user_id: str, limit: int = 5) -> List[Dict]:
        """Find similar transactions using vector similarity"""
        try:
            # Query the collection
            results = self.transactions_collection.query(
                query_texts=[description],
                n_results=limit,
                where={"user_id": user_id}  # Filter by user_id
            )
            
            if not results or not results['metadatas']:
                return []
                
            similar_transactions = []
            for idx, metadata in enumerate(results['metadatas'][0]):
                similar_transactions.append({
                    'transaction_id': metadata['transaction_id'],
                    'similarity_score': float(results['distances'][0][idx]) if 'distances' in results else 0.0,
                    'metadata': metadata
                })
                
            return similar_transactions
            
        except Exception as e:
            logger.error(f"Error finding similar transactions: {str(e)}")
            return []

    def suggest_account(self, description: str, amount: float, limit: int = 3) -> List[Dict]:
        """Suggest accounts based on transaction description and amount"""
        try:
            # Create query text combining description and amount
            query_text = f"Transaction: {description} Amount: {amount}"
            
            # Query accounts collection
            results = self.accounts_collection.query(
                query_texts=[query_text],
                n_results=limit,
                where={"is_active": True}  # Only consider active accounts
            )
            
            if not results or not results['metadatas']:
                return []
                
            suggestions = []
            for idx, metadata in enumerate(results['metadatas'][0]):
                confidence = 1 - float(results['distances'][0][idx]) if 'distances' in results else 0.5
                suggestions.append({
                    'account_id': metadata['account_id'],
                    'confidence': confidence,
                    'category': metadata['category'],
                    'metadata': metadata
                })
                
            return suggestions
            
        except Exception as e:
            logger.error(f"Error suggesting accounts: {str(e)}")
            return []

    def bulk_add_transactions(self, transactions: List[Dict]) -> None:
        """Bulk add transactions to the vector store"""
        try:
            documents = []
            metadatas = []
            ids = []
            
            for transaction in transactions:
                # Create text representation
                transaction_text = (
                    f"Description: {transaction['description']} "
                    f"Amount: {transaction['amount']} "
                    f"Category: {transaction.get('category', 'Unknown')} "
                    f"Explanation: {transaction.get('explanation', '')}"
                )
                
                documents.append(transaction_text)
                metadatas.append({
                    'transaction_id': str(transaction['id']),
                    'amount': transaction['amount'],
                    'category': transaction.get('category', 'Unknown'),
                    'account_id': str(transaction.get('account_id', '')),
                    'date': transaction.get('date', '').isoformat() if transaction.get('date') else '',
                    'user_id': str(transaction['user_id'])
                })
                ids.append(f"trans_{transaction['id']}")
            
            # Bulk add to collection
            self.transactions_collection.add(
                documents=documents,
                metadatas=metadatas,
                ids=ids
            )
            
        except Exception as e:
            logger.error(f"Error bulk adding transactions: {str(e)}")
            raise

    def update_transaction(self, transaction_id: str, updates: Dict) -> None:
        """Update a transaction in the vector store"""
        try:
            # Delete existing transaction
            self.transactions_collection.delete(ids=[f"trans_{transaction_id}"])
            
            # Add updated transaction
            self.add_transaction({**updates, 'id': transaction_id})
            
        except Exception as e:
            logger.error(f"Error updating transaction: {str(e)}")
            raise

    def get_transaction_embedding(self, description: str) -> List[float]:
        """Get embedding for a transaction description"""
        try:
            return self.embedding_function([description])[0]
        except Exception as e:
            logger.error(f"Error getting transaction embedding: {str(e)}")
            raise