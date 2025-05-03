function logger(req, res, next) {
  console.log({
    message: "Request received",
    method: req.method,
    url: req.url,
    body: req.body,
    params: req.params,
    query: req.query,
    headers: {
      "content-type": req.headers["content-type"],
      authorization: req.headers["authorization"],
      "user-agent": req.headers["user-agent"],
    },
    ip: req.ip,
  });

  next();
}

module.exports = logger;
