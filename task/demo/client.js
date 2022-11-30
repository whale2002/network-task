import dgram from "dgram";
import { HOST, PORT } from "./constant.js";

const udp_client = dgram.createSocket("udp4");

udp_client.on("close", function () {
  console.log("udp client closed.");
});

//错误处理
udp_client.on("error", function () {
  console.log("some error on udp client.");
});

// 接收消息
udp_client.on("message", function (msg, rinfo) {
  console.log(`receive message from ${rinfo.address}:${rinfo.port}：${msg}`);
});

//定时向服务器发送消息
setInterval(function () {
  const SendBuff = "hello 123.";
  const SendLen = SendBuff.length;
  udp_client.send(SendBuff, 0, SendLen, PORT, HOST);
}, 3000);
