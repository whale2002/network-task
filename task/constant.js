// 客户端状态
export const CLIENT_STATUS = {
  CLOSE: "CLOSE",
  SYN_SENT: "SYN_SENT",
  ESTABLISHED: "ESTABLISHED",
  FIN_WAIT_1: "FIN_WAIT_1",
  FIN_WAIT_2: "FIN_WAIT_2",
  TIME_WAIT: "TIME_WAIT",
};

// 客户端行为
export const CLIENT_ACTIONS = {
  RDT_SEND: "rdt_send",
  NOT_CORRUPT: "not_corrupt",
  CORRUPT: "corrupt",
};

// 服务端状态
export const SERVER_STATUS = {
  CLOSE: "CLOSE",
  LISTENING: "LISTENING",
  SYN_REVD: "SYN_REVD",
  ESTABLISHED: "ESTABLISHED",
  CLOSE_WAIT: "CLOSE_WAIT",
  LAST_ACK: "LAST_ACK",
};

// 服务端行为
export const SERVER_ACTIONS = {
  RDT_RECEIVE: "rdt_rcv",
  NOT_CORRUPT: "not_corrupt", // 该动作在校验和没出错的情况下触发
  CORRUPT: "corrupt", // 该动作在校验和出错的情况下触发
};
