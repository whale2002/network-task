// 客户端状态
CLIENT_STATUS = {};

// 客户端行为
CLIENT_ACTIONS = {
  RDT_SEND: "rdt_send",
  NOT_CORRUPT: "not_corrupt",
  CORRUPT: "corrupt",
};

// 服务端状态
SERVER_STATUS = {};
// 服务端行为
SERVER_ACTIONS = {
  RDT_RECEIVE: "rdt_rcv",
  NOT_CORRUPT: "not_corrupt", // 该动作在校验和没出错的情况下触发
  CORRUPT: "corrupt", // 该动作在校验和出错的情况下触发
};
