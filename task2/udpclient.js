// dgram 模块提供了对 udp socket 的封装
import dgram from "dgram";
import {
  CLIENT_STATUS,
  CLIENT_ACTIONS,
  SERVER_ADDRESS,
  SERVER_PORT,
  CLIENT_PORT,
} from "./constant.js";
// 导入数据包类
import Dgram from "./Dgram.js";

const DEFAULT_TIME_OUT = 100;
const dgramNumber = 12;

// 客户端端口号13000，服务端端口号8080

class UDPClient {
  // 客户端连接状态
  STATUS = CLIENT_STATUS.ESTABLISHED;

  // UDP状态位
  SYN = 0;
  ACK = 0;
  FIN = 0;
  // 序列号
  SEQ = 0;

  // 缓存数据包
  buffer_queue = [];
  // 缓存定时器
  timer_queue = [];
  // 记录RTT
  RTTS = [];
  // 数据包序列号
  current_seq = 1;
  // 接收到的数据包数量
  receive_number = 0;
  // 接收的数据包
  receivedDgrams = [];

  constructor({ SERVER_PORT, SERVER_ADDRESS, CLIENT_PORT, DEFAULT_TIME_OUT }) {
    if (SERVER_PORT && SERVER_ADDRESS && CLIENT_PORT) {
      //创建一个监听某个端口的 udp server
      this.udp_client = dgram.createSocket("udp4");
      this.SERVER_PORT = SERVER_PORT;
      this.SERVER_ADDRESS = SERVER_ADDRESS;
      this.CLIENT_PORT = CLIENT_PORT;
      this.DEFAULT_TIME_OUT = DEFAULT_TIME_OUT;
      this.init();
    }
  }

  init = () => {
    this.init_bind_port();
    this.init_on_message();
    this.init_on_close();
    this.init_on_error();
  };

  // 建立连接
  connect = () => {
    console.log("client开始尝试建立连接🚀");

    this.SYN = 1;
    this.SEQ = Math.ceil(Math.random() * 10);

    const dataGram = {
      syn: this.SYN,
      seq: this.SEQ,
      msg: "firstHandshake",
    };

    // 状态变化
    this.STATUS = CLIENT_STATUS.SYN_SENT;
    console.log("client状态为", this.STATUS);
    // 第一次握手
    this.udt_send(JSON.stringify(dataGram));
  };

  // 释放连接
  close = () => {
    console.log("client开始尝试关闭连接");

    this.FIN = 1;

    const dataGram = {
      fin: this.FIN,
      msg: "firstWave",
    };

    // 状态变化
    this.STATUS = CLIENT_STATUS.FIN_WAIT_1;
    console.log("client状态为", this.STATUS);
    // 第一次挥手
    this.udt_send(JSON.stringify(dataGram));
  };

  //  该方法作为暴露给上层的接口进行调用
  send_message = (msg) => {
    this.dispatch(CLIENT_ACTIONS.RDT_SEND, msg);
  };

  // 接收消息
  init_on_message = () =>
    this.udp_client.on("message", (pkt) => {
      const { data, ack, syn, seq, msg } = JSON.parse(pkt);

      if (syn) {
        console.log(`client 收到第二次握手, syn为1, ack为${ack}, seq为${seq}`);
        if (ack === this.SEQ + 1) {
          const dataGram = {
            syn: 1,
            ack: seq + 1,
            seq: Math.ceil(Math.random() * 10),
            msg: "thirdHandshake",
          };

          this.STATUS = CLIENT_STATUS.ESTABLISHED;
          console.log("client 状态为", this.STATUS);
          console.log("client 建立连接!🚀");
          // 第三次握手
          this.udt_send(JSON.stringify(dataGram));
        }

        return;
      } else if (msg === "secondWave") {
        console.log("client收到了server的关闭确认");
        this.STATUS = CLIENT_STATUS.FIN_WAIT_2;
        console.log("client状态为", this.STATUS);
        return;
      } else if (msg === "thirdWave") {
        this.STATUS = CLIENT_STATUS.TIME_WAIT;
        console.log("client状态为", this.STATUS);

        this.fourthWave();

        setTimeout(() => {
          this.STATUS = CLIENT_STATUS.CLOSE;
          console.log("client状态为", this.STATUS);
          this.udp_client.close();
        }, 2000);

        return;
      }
      // 接收响应
      else {
        const index = data.seqNo - 1;
        // 更新数据包
        this.buffer_queue[index] = data;
        this.receivedDgrams.push(data);

        clearTimeout(this.timer_queue[index]);
        // 接收到的数量+1
        this.receive_number++;

        this.calculateRTT(index, data.serverTime);

        if (this.receive_number === dgramNumber) {
          console.log(this.buffer_queue);
        }
      }
    });

  fourthWave = () => {
    this.ACK = 1;
    const dataGram = {
      ack: this.ACK,
      msg: "fourthWave",
    };

    // 第四次挥手
    this.udt_send(JSON.stringify(dataGram));
  };

  dispatch = (action, data) => {
    switch (action) {
      case CLIENT_ACTIONS.RDT_SEND:
        const dgram = new Dgram(this.current_seq, data);
        // 缓存数据包
        this.buffer_queue.push(dgram);

        const packet = this.make_pkt(dgram);
        // 发送该数据包
        this.udt_send(packet);
        // 开启一个定时器
        this.start_timer(this.current_seq);
        this.current_seq++;
        break;

      case CLIENT_ACTIONS.CORRUPT:
        // 根据序号找到数据包，重传
        const index = data - 1; //找到索引
        const tempDGram = this.buffer_queue[index];
        tempDGram.reSendTime++;

        // 重传次数超过2次
        if (tempDGram.reSendTime > 2) {
          console.log(`第${index + 1}个数据包重传次数超过两次，放弃重传`);
        } else {
          tempDGram.reSendTime++; //重传次数+1
          tempDGram.sendTime = new Date().getTime();
          clearTimeout(this.timer_queue[index]);
          const reSendPacket = this.make_pkt(tempDGram);
          // 发送该数据报
          this.udt_send(reSendPacket);
          // 定时器的参数是数据包序号
          this.start_timer(index + 1);
        }

        break;
      default:
        return;
    }
  };

  make_pkt = (data) => JSON.stringify({ data });

  calculateRTT = (index, time) => {
    this.buffer_queue[index].resTime = new Date().getTime();

    this.buffer_queue[index].RTT =
      this.buffer_queue[index].resTime - this.buffer_queue[index].sendTime;

    this.RTTS.push(this.buffer_queue[index].RTT);

    console.log(
      `第${
        index + 1
      }个报文ack, serverIP为${SERVER_ADDRESS}, post为${SERVER_PORT}, RTT为${
        this.buffer_queue[index].RTT
      }, server 时间为${this.getServerTime(time)}`
    );
  };

  udt_send = (pkt) => {
    // 有中文的话最好使用 Buffer 缓冲区 否则下面 send 方法的第三个参数的 length 不好判断
    const _buffer = Buffer.from(pkt);
    // 第二参数 0 表示要发送的信息在 _buffer 中的偏移量
    this.udp_client.send(
      _buffer,
      0,
      _buffer.byteLength,
      this.SERVER_PORT,
      this.SERVER_ADDRESS
    );
  };

  // 绑定某个端口
  init_bind_port = () => this.udp_client.bind(this.CLIENT_PORT);

  // 当客户端关闭
  init_on_close = () => {
    this.udp_client.on("close", () => console.log("udp 客户端关闭"));
  };

  // 错误处理
  init_on_error = () => {
    this.udp_client.on("error", (err) =>
      console.log(`upd 服务发生错误: ${err}`)
    );
  };

  start_timer = (current_seq) => {
    const seq = current_seq;
    const timer = setTimeout(() => {
      console.log(`第${seq}个数据包超时定时器被触发`);
      // 重新触发失败后发送的动作
      this.dispatch("corrupt", seq);
    }, DEFAULT_TIME_OUT);

    this.timer_queue[seq - 1] = timer;
  };

  getServerTime = (timeStamp) => {
    const data = new Date(timeStamp);
    return data.getHours() + "-" + data.getMinutes() + "-" + data.getSeconds();
  };
}

// 初始化UDP客户端
const client = new UDPClient({
  SERVER_PORT,
  SERVER_ADDRESS,
  CLIENT_PORT,
  DEFAULT_TIME_OUT,
});

// 三次握手建立连接;
setTimeout(() => {
  client.connect();
}, 0);

// 传输数据
setTimeout(() => {
  for (let i = 0; i < dgramNumber; i++) {
    const data = i + 1;
    client.send_message(`数字: ${data}`);
  }
}, 1000);

// 汇总信息
setTimeout(() => {
  statistics();
}, 3000);

setTimeout(() => {
  // 关闭连接
  client.close();
}, 8000);

function statistics() {
  const length = client.RTTS.length;
  client.RTTS.sort((a, b) => a - b);

  let sum = 0;

  for (let i = 0; i < length; i++) {
    sum += client.RTTS[i];
  }
  const avg = sum / length;
  sum = 0;

  for (let i = 0; i < length; i++)
    sum += (client.RTTS[i] - avg) * (client.RTTS[i] - avg);

  const sd = Math.sqrt(sum / length);

  console.log(
    `
    汇总信息如下：
    接收到${client.receive_number}个udp packets
    丢包率为${(1 - client.receive_number / dgramNumber) * 100}%
    最大RTT为${client.RTTS[length - 1]}ms, 最小RTT为${client.RTTS[0]}ms
    平均RTT为${avg}ms, RTT的标准差为${sd}ms
    server的整体响应时间为${
      client.receivedDgrams[client.receive_number - 1].serverTime -
      client.receivedDgrams[0].serverTime
    }ms
    `
  );
}
