import React from "react";
import Terminal, { ColorMode, LineType } from 'react-terminal-ui';
import config from "./config.json";

class App extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            terminalLineData: [],
            user: localStorage.getItem("user"),
            login: false
        }
    }

    componentDidMount() {
        this.setState({
            terminalLineData: [
                { type: LineType.Output, value: 'Welcome to the Chat!' },
                { type: LineType.Output, value: 'You can type /help to see help' },
            ]
        });

        let ws = new WebSocket(config.server);

        ws.addEventListener("message", (msg) => {
            let jsonMsg = JSON.parse(msg.data);
            switch (jsonMsg.status) {
                case "msg":
                    if (jsonMsg.user !== undefined) {
                        this.state.terminalLineData.push({ type: LineType.Output, value: <span><b>{jsonMsg.user}: </b>{jsonMsg.text}</span> })
                    } else {
                        this.state.terminalLineData.push({ type: LineType.Output, value: <span><b style={{ color: "green" }}>System: </b>{<span dangerouslySetInnerHTML={{ __html: jsonMsg.text }} />}</span> })
                    }
                    break
                case "event":
                    switch (jsonMsg.info) {
                        case "left":
                            this.state.terminalLineData.push({ type: LineType.Output, value: <span><b style={{ color: "green" }}>System: </b>a user left this chat</span> })
                            break
                        case "join":
                            this.state.terminalLineData.push({ type: LineType.Output, value: <span><b style={{ color: "green" }}>System: </b>a user join this chat</span> })
                            break
                        default:
                    }
                    break
                default:
                    this.state.terminalLineData.push({ type: LineType.Output, value: <span><b style={{ color: "red" }}>Error: </b>Undefined response: {msg.data}</span> })
            }
            this.setState({ terminalLineData: this.state.terminalLineData })
        })

        ws.addEventListener("close", () => {
            this.state.terminalLineData.push({
                type: LineType.Output, value: <span><b style={{ color: "red" }}>Error: </b>Connect Error, pls <span onClick={() => {
                    window.location.reload()
                }} style={{ color: 'aliceblue', textDecoration: 'underline', cursor: "pointer" }}>reload</span></span>
            })
            this.setState({ terminalLineData: this.state.terminalLineData })
        })

        this.input = (input) => {
            if (input !== "") {
                this.state.terminalLineData.push({ type: LineType.Input, value: input })
                if (input.indexOf('/') === -1) {
                    if (this.state.user != null) {
                        ws.send(JSON.stringify({ "status": "msg", "user": this.state.user, "text": input }))
                    } else {
                        this.state.terminalLineData.push({ type: LineType.Output, value: <span><b style={{ color: "orange" }}>Warning: </b>You must login first, enter /login</span> })
                    }
                } else {
                    let inputinfo = input.split(" ");
                    switch (inputinfo[0]) {
                        case "/login":
                            if (inputinfo[1] !== undefined) {
                                localStorage.setItem("user", inputinfo[1]);
                                this.state.terminalLineData.push({ type: LineType.Output, value: <span><b style={{ color: "green" }}>System: </b>Your name is '{inputinfo[1]}'</span> })
                            } else {
                                this.state.terminalLineData.push({ type: LineType.Output, value: <span>'/login yourname' to set name</span> })
                            }
                            break
                        default:
                            ws.send(JSON.stringify({ "status": "command", "command": input.replace("/", '') }))
                    }
                }
            }
        }
    }

    render() {
        let { terminalLineData } = this.state;

        return (
            <div style={{ margin: '2.5%' }}>
                <Terminal
                    name='ArsFy Chat'
                    colorMode={ColorMode.Dark}
                    lineData={terminalLineData}
                    onInput={terminalInput => this.input(terminalInput)}
                />
            </div>
        )
    }
}

export default App;
