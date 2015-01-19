# socket.io-redis-with-shared
Socket.io Redis adapter with shared memory


It same as normal `socket.io-redis` adapter.

But have 1 feature. It allow to create a shared objects between instances.
To share any data you could use:
```
socket.adapter.shared.someVar = "someValue";
socket.adapter.sync();
```