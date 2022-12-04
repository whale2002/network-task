// 定义数据包结构
export default class Dgram {
  constructor(seq, data) {
    // 发送时间
    this.sendTime = new Date().getTime();
    // 响应时间
    this.resTime = null;
    // 序列号
    this.seqNo = seq;
    // 版本号
    this.ver = 2.0;
    // 重传次数
    this.reSendTime = 0;
    // 数据
    this.data = data;
    // RTT
    this.RTT = 0;
    // 服务端系统时间
    this.serverTime = null;
    // 是否被响应
    this.isReceived = false;
  }
}
