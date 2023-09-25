import socket

def main():
    client_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    server_address = ('localhost', 12345)  # Use the same server address and port as the server

    try:
        client_socket.connect(server_address)
        message = "Hello, server!"
        client_socket.sendall(message.encode('utf-8'))

        response = client_socket.recv(1024).decode('utf-8')
        print("Received from server:", response)

    except Exception as e:
        print("Error:", str(e))

    finally:
        client_socket.close()

if __name__ == "__main__":
    main()
