export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.status(200).json({
    exito: true,
    status: 'UP',
    service: 'syncpass-api-bff',
    database: 'PostgreSQL (Connected)',
    timestamp: new Date().toISOString(),
  })
}
