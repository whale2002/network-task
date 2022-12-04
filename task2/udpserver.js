// dgram 模块提供了对 udp socket 的封装
import dgram from "dgram";
import { SERVER_STATUS, SERVER_ACTIONS, SERVER_PORT } from "./constant.js";

// 模拟丢包率，暂定为50%
const LOSSRATE = 0.5;

class UDPServer {
  // 服务端连接状态
  STATUS = SERVER_STATUS.CLOSE;

  // 状态位
  SYN = 0;
  ACK = 0;
  FIN = 0;
  // 序号
  SEQ = 0;

  // 构造函数
  constructor({ SERVER_PORT }) {
    if (SERVER_PORT) {
      this.udp_server = dgram.createSocket("udp4");
      this.SERVER_PORT = SERVER_PORT;
    }
  }

  // 该方法暴露给外部, 当初始化该 class 之后调用
  receive_message = () => {
    this.init();
  };

  // 初始化
  init = () => {
    this.init_bind_port();
    this.init_on_message();
    this.init_on_listening();
    this.init_on_close();
    this.init_on_error();
  };

  // 接收消息
  init_on_message = () => {
    this.udp_server.on("message", (pkt, { port, address }) => {
      const { data, syn, ack, msg, fin, seq } = JSON.parse(pkt);

      // 第二次握手
      if (syn) {
        if (msg === "firstHandshake")
          this.secondHandshake({ seq, ack, port, address });
        else if (msg === "thirdHandshake")
          this.establishConnection({ seq, ack });
      }

      // 挥手
      else if (fin) {
        this.firstWate({ port, address });
      } else if (ack) {
        // 状态变化
        this.STATUS = SERVER_STATUS.CLOSE;
        console.log("server 状态为", this.STATUS);
        this.udp_server.close();
      }

      // 不是握手也不是挥手，正常数据传输
      else if (!syn && !fin) {
        // 模拟丢包率
        const isLoss = Math.random() <= LOSSRATE;
        if (!isLoss) {
          this.dispatch(SERVER_ACTIONS.RDT_RECEIVE, {
            packet: data,
            port,
            address,
          });
        }
      }
    });
  };

  // 第二次握手
  secondHandshake({ seq, port, address }) {
    console.log(`server 收到第一次握手, syn为1, seq为${seq}`);
    this.SYN = 1;
    this.ACK = seq + 1;
    this.SEQ = Math.ceil(Math.random() * 10);

    const dataGram = {
      syn: this.SYN,
      ack: this.ACK,
      seq: this.SEQ,
      msg: "secondHandshake",
    };

    // 变更状态
    this.STATUS = SERVER_STATUS.SYN_REVD;
    console.log("server 状态为", this.STATUS);
    this.udt_send(JSON.stringify(dataGram), { port, address });
  }

  // 三次握手后建立连接
  establishConnection({ seq, ack }) {
    console.log(`server 收到第三次握手, ack为${ack}, seq为${seq}`);
    this.STATUS = SERVER_STATUS.ESTABLISHED;
    console.log("server 状态为", this.STATUS);

    console.log("server 建立连接!🚀");
  }

  firstWate = ({ port, address }) => {
    const dataGram = {
      ack: 1,
      msg: "secondWave",
    };

    // 变更状态
    this.STATUS = SERVER_STATUS.CLOSE_WAIT;
    console.log("server 状态为", this.STATUS);
    this.udt_send(JSON.stringify(dataGram), { port, address });

    // 如果数据传输完毕
    if (true) {
      this.thirdWave({ port, address });
    }
  };

  thirdWave = ({ port, address }) => {
    console.log("server 开始尝试关闭连接");

    this.FIN = 1;
    const dataGram = {
      fin: this.FIN,
      msg: "thirdWave",
    };

    // 状态变化
    this.STATUS = SERVER_STATUS.LAST_ACK;
    console.log("server 状态为", this.STATUS);
    // 第三次挥手
    this.udt_send(JSON.stringify(dataGram), { port, address });
  };

  dispatch = (action, { packet, port, address }) => {
    switch (action) {
      case SERVER_ACTIONS.RDT_RECEIVE:
        // 处理 packet 得到 data
        const data = packet;
        console.log(`接收到第${data.seqNo}个包`);
        data.serverTime = new Date().getTime();
        data.isReceived = true;
        // 打印数据包
        console.log(data);
        const resPkt = this.make_pkt(data);
        // 然后将成功应答返回给客户端
        this.udt_send(resPkt, { port, address });
        break;
      default:
        return;
    }
  };

  make_pkt = (data) => {
    return JSON.stringify({ data });
  };

  extract = (packet) => {
    return JSON.parse(packet);
  };

  // 服务端在返回信息的时候需要知道客户端的 port 和 address
  udt_send = (pkt, { port, address }) => {
    // 有中文的话最好使用 Buffer 缓冲区 否则下面 send 方法的第三个参数的 length 不好判断
    const _buffer = Buffer.from(pkt);
    // 第二参数 0 表示要发送的信息在 _buffer 中的偏移量
    this.udp_server.send(_buffer, 0, _buffer.byteLength, port, address);
  };

  // 绑定端口
  init_bind_port = () => this.udp_server.bind(this.SERVER_PORT);

  // 监听端口
  init_on_listening = () => {
    this.udp_server.on("listening", () => {
      console.log(`upd server服务正在监听 ${SERVER_PORT} 端口🚀`);
      this.STATUS = SERVER_STATUS.LISTENING;
      console.log("server 状态为", this.STATUS);
    });
  };

  // 当服务端关闭
  init_on_close = () => {
    this.udp_server.on("close", () => console.log("udp 客户端关闭"));
  };

  // 错误处理
  init_on_error = () => {
    this.udp_server.on("error", (err) => {
      console.log(`upd 服务发生错误: ${err}`);
      this.udp_server.close();
    });
  };
}

// 初始化UDP服务端
const server = new UDPServer({ SERVER_PORT });

// 开始监听
server.receive_message();
