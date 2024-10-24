// config.js
module.exports = {
  prometheusUrl: 'http://localhost:9090/api/v1/query',  // URL de Prometheus pour récupérer les métriques
  nodes: [
      { id: 'node1', brokerUrl: 'mqtt://172.20.10.9:1883', topic: 'fog1/chunks' },
      { id: 'node2', brokerUrl: 'mqtt://172.20.10.9:1883', topic: 'fog1/chunks' },
  ],
  thresholds: {
      cpu: 100,  // Seuil CPU en %
      ram: 100,  // Seuil RAM en %
      storage: 100 // Seuil stockage en %
  },
  logFilePath: './logs/loadBalancer.log'  // Emplacement des logs
};
