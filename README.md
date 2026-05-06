# ssh-bridge

<https://github.com/fm-elpac/ssh-bridge>

![CI](https://github.com/fm-elpac/ssh-bridge/actions/workflows/ci.yml/badge.svg)

一个用于本地 UNIX socket 通信的简单消息桥接器.

## 项目结构

```
ssh-bridge/
├── src/
│   ├── protocol.ts       # 协议解析和格式化
│   ├── sb-server.ts      # 服务端实现
│   └── sb-client.ts      # 客户端实现
├── bin/
│   ├── sb-server.js      # 编译后的服务端
│   └── sb-client.js      # 编译后的客户端
├── systemd/
│   └── sb-server.service # Systemd 用户服务
└── README.md
```

## 安装

1. 编译项目:

   ```bash
   deno bundle src/sb-server.ts -o bin/sb-server.js
   deno bundle src/sb-client.ts -o bin/sb-client.js
   ```

2. 安装到 `~/.ssh-bridge/`:

   ```bash
   mkdir -p ~/.ssh-bridge/
   cp bin/sb-server.js bin/sb-client.js ~/.ssh-bridge/
   ```

3. 安装 systemd 服务:

   ```bash
   mkdir -p ~/.config/systemd/user/
   cp systemd-user/sb-server.service ~/.config/systemd/user/
   systemctl --user daemon-reload
   systemctl --user enable --now sb-server
   ```

## 协议

协议使用带通道头的逐行 JSON 消息:

```
channel: { "json": "data" }
```

- `channel`: 通道名称 (不允许包含冒号)
- `{ "json": "data" }`: JSON 数据

## 服务端 (sb-server)

- 在 UNIX socket `$XDG_RUNTIME_DIR/ssh-bridge/server` 上监听
- 将收到的所有消息广播到所有连接的客户端
- 作为 systemd 用户服务运行

## 客户端 (sb-client)

### 命令行选项

- `--pub <channel>`: 指定要发布的通道 (默认: "default", 可多次使用)
- `--sub <channel>`: 指定要订阅的通道 (默认: 全部, 可多次使用)

### 使用方法

```bash
# 订阅所有通道并发布到默认通道
sb-client

# 订阅特定通道
sb-client --sub AAA --sub BBB

# 发布到特定通道
sb-client --pub mychannel
```

### 示例

终端 1:

```bash
sb-client --sub log
```

终端 2:

```bash
sb-client --pub log
log: {"message": "hello"}
```

## LICENSE

`MIT`
