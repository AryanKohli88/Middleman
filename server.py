from pymongo.mongo_client import MongoClient
from pymongo.server_api import ServerApi
import socket
from vars.config import mongodb_password
import threading
from pymongo import MongoClient

# MongoDB configuration
client = MongoClient("mongodb+srv://owner:{mongodb_password}@cluster0.uc8kcse.mongodb.net/?retryWrites=true&w=majority")
db = client["anonymous_posts"]
collection = db["messages"]

def handle_client(client_socket):
    try:
        while True:
            data = client_socket.recv(1024).decode('utf-8')
            if not data:
                break

            # Store the message in the MongoDB collection
            message_data = {"message": data}
            collection.insert_one(message_data)

            response = "Message received and posted anonymously."
            client_socket.sendall(response.encode('utf-8'))

    finally:
        client_socket.close()

def main():
    server_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    server_address = ('cluster0.uc8kcse.mongodb.net', 27017)  # Use your desired server address and port
    server_socket.bind(server_address)

    server_socket.listen()

    print('Server is listening for incoming connections...')

    try:
        while True:
            client_socket, client_address = server_socket.accept()

            client_thread = threading.Thread(target=handle_client, args=(client_socket,))
            client_thread.start()

    except KeyboardInterrupt:
        print('Server stopped.')

    finally:
        server_socket.close()

if __name__ == "__main__":
    main()



# uri = f"mongodb+srv://owner:{mongodb_password}@cluster0.uc8kcse.mongodb.net/?retryWrites=true&w=majority"

# # Create a new client and connect to the server
# client = MongoClient(uri, server_api=ServerApi('1'))

# # Send a ping to confirm a successful connection
# try:
#     client.admin.command('ping')
#     print("Pinged your deployment. You successfully connected to MongoDB!")
# except Exception as e:
#     print(e)