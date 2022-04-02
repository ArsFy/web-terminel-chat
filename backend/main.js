const ws = require('nodejs-websocket');
const xss = require('xss');
const config = require('./config.json');

//记录当前连接的用户数量
let count = 0;

const server = ws.createServer(conn => {
    count++;
    broadcast({ "status": "event", "info": "join" });

    conn.on('text', data => {
        let jsonData = JSON.parse(data);
        console.log(jsonData)
        switch (jsonData.status) {
            case "msg":
                let data = {
                    status: jsonData.status,
                    text: xss(jsonData.text)
                }
                if (jsonData['user'] != undefined) { data['user'] = xss(jsonData["user"]) }
                broadcast(jsonData);
                break;
            case "command":
                switch (jsonData.command) {
                    case "count":
                        conn.send(JSON.stringify({ "status": "msg", "text": `<span>online: ${count}</span>` }));
                        break
                    default:
                        if (config.command[jsonData.command] != undefined) {
                            conn.send(JSON.stringify({ "status": "msg", "text": config.command[jsonData.command] }));
                        }
                }
                break;
        }

    });

    conn.on('close', () => {
        count--;
        broadcast({ "status": "event", "info": "left" });
    });

    conn.on('error', () => {
        console.log("Error!");
    });
});

const broadcast = (msg) => {
    server.connections.forEach(item => {
        item.send(JSON.stringify(msg));
    });
}

server.listen(80, () => {
    console.log('Start Server...');
});