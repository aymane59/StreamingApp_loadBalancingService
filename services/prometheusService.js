const axios = require('axios');
const config = require('../config/config');

const getMetrics = async () => {
    try {
        const cpuQuery = `sum(rate(node_cpu_seconds_total{mode!="idle"}[1m])) by (instance) * 100`;
        const ramQuery = `node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes * 100`;
        const storageQuery = `node_filesystem_avail_bytes / node_filesystem_size_bytes * 100`;

        const cpuUsageResponse = await axios.get(`${config.prometheusUrl}?query=${encodeURIComponent(cpuQuery)}`);
        const ramUsageResponse = await axios.get(`${config.prometheusUrl}?query=${encodeURIComponent(ramQuery)}`);
        const storageUsageResponse = await axios.get(`${config.prometheusUrl}?query=${encodeURIComponent(storageQuery)}`);

        const cpuUsage = cpuUsageResponse.data.data.result;
        const ramUsage = ramUsageResponse.data.data.result;
        const storageUsage = storageUsageResponse.data.data.result;

        let metrics = {};

        // Parcours des résultats de CPU
        for (let i = 0; i < cpuUsage.length; i++) {
            const instance = cpuUsage[i].metric.instance;
            const cpuValue = parseFloat(cpuUsage[i].value[1]);

            // Initialiser l'entrée pour chaque instance
            if (!metrics[instance]) {
                metrics[instance] = {};
            }
            metrics[instance].cpu = cpuValue;
        }

        // Parcours des résultats de RAM
        for (let i = 0; i < ramUsage.length; i++) {
            const instance = ramUsage[i].metric.instance;
            const ramValue = parseFloat(ramUsage[i].value[1]);

            // Initialiser l'entrée pour chaque instance si elle n'existe pas encore
            if (!metrics[instance]) {
                metrics[instance] = {};
            }
            metrics[instance].ram = ramValue;
        }

        // Parcours des résultats de stockage
        for (let i = 0; i < storageUsage.length; i++) {
            const instance = storageUsage[i].metric.instance;
            const storageValue = parseFloat(storageUsage[i].value[1]);

            // Initialiser l'entrée pour chaque instance si elle n'existe pas encore
            if (!metrics[instance]) {
                metrics[instance] = {};
            }
            metrics[instance].storage = storageValue;
        }

        // Remplacer les adresses IP par les noms de nœuds
        const updatedMetrics = {};
        for (let instance in metrics) {
            if (instance === '172.20.10.9:9100') {
                updatedMetrics['node1'] = metrics[instance];
            } else if (instance === '172.20.10.5:9100') {
                updatedMetrics['node2'] = metrics[instance];
            } else {
                updatedMetrics[instance] = metrics[instance];  // Garde l'instance originale si non correspondante
            }
        }

        return updatedMetrics;  // Retourne l'objet avec les noms de nœuds mis à jour

    } catch (error) {
        console.error('Erreur lors de la récupération des métriques Prometheus:', error);
        throw error;
    }
};

module.exports = {
    getMetrics
};
