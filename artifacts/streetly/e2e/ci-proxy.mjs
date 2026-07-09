// Minimal reverse proxy used only in CI to combine the streetly web app and
// the api-server into a single origin, mirroring how Replit's own routing
// combines artifact paths ("/" -> web, "/api" -> api-server) in dev/prod.
import http from "node:http";

const PORT = Number(process.env.PROXY_PORT || 5000);
const WEB_PORT = Number(process.env.WEB_PORT || 19254);
const API_PORT = Number(process.env.API_PORT || 8080);

function proxy(req, res, targetPort) {
  const proxyReq = http.request(
    {
      hostname: "127.0.0.1",
      port: targetPort,
      path: req.url,
      method: req.method,
      headers: req.headers,
    },
    (proxyRes) => {
      res.writeHead(proxyRes.statusCode ?? 502, proxyRes.headers);
      proxyRes.pipe(res, { end: true });
    },
  );
  proxyReq.on("error", (err) => {
    if (!res.headersSent) res.writeHead(502);
    res.end(`CI proxy error: ${err.message}`);
  });
  req.pipe(proxyReq, { end: true });
}

const server = http.createServer((req, res) => {
  const targetPort = req.url && req.url.startsWith("/api") ? API_PORT : WEB_PORT;
  proxy(req, res, targetPort);
});

server.listen(PORT, () => {
  console.log(`[ci-proxy] listening on :${PORT} (api -> :${API_PORT}, web -> :${WEB_PORT})`);
});
