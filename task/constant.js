// 客户端状态
export const CLIENT_STATUS = {
  SYN_SENT: "SYN_SENT",
  ESTABLISHED: "ESTABLISHED",
};

// 客户端行为
export const CLIENT_ACTIONS = {
  RDT_SEND: "rdt_send",
  NOT_CORRUPT: "not_corrupt",
  CORRUPT: "corrupt",
};

// 服务端状态
export const SERVER_STATUS = {
  LISTENING: "LISTENING",
  SYN_REVD: "SYN_REVD",
  ESTABLISHED: "ESTABLISHED",
};

// 服务端行为
export const SERVER_ACTIONS = {
  RDT_RECEIVE: "rdt_rcv",
  NOT_CORRUPT: "not_corrupt", // 该动作在校验和没出错的情况下触发
  CORRUPT: "corrupt", // 该动作在校验和出错的情况下触发
};
