const mqtt = require('mqtt');
const prometheusService = require('../services/prometheusService');
const config = require('../config/config');
const fs = require('fs');

const mqttUrl = config.mqttUrl; // L'URL de votre broker MQTT


// Configurer le client MQTT
const mqttClient = mqtt.connect(mqttUrl);

// Fonction pour écrire les logs
const logMessage = (message) => {
    console.log(message);
    fs.appendFileSync(config.logFilePath, `${new Date().toISOString()} - ${message}\n`);
};

// Fonction pour choisir le nœud fog avec des seuils spécifiques
const chooseFogNode = (metrics) => {
    const availableNodes = config.nodes.filter(node => {
        const nodeMetrics = metrics[node.id];
        if (!nodeMetrics) {
            logMessage(`Pas de métriques pour le nœud ${node.id}`);
            return false;
        }

        return nodeMetrics.cpu < config.thresholds.cpu &&
               nodeMetrics.ram < config.thresholds.ram &&
               nodeMetrics.storage < config.thresholds.storage;
    });

    if (availableNodes.length === 0) {
        throw new Error('Tous les nœuds fog sont saturés ou non disponibles');
    }

    const randomIndex = Math.floor(Math.random() * availableNodes.length);
    return availableNodes[randomIndex];
};

// Fonction de load balancing pour rediriger les chunks
const loadBalanceChunk = async (chunkData) => {
    try {
        const metrics = await prometheusService.getMetrics();
        if (!metrics || Object.keys(metrics).length === 0) {
            throw new Error('Les métriques des nœuds sont manquantes ou mal définies.');
        }

        const selectedNode = chooseFogNode(metrics);
        const topic = `${selectedNode.topic}`;
        const chunkNumber = chunkData.chunkNumber;
        logMessage(`Debut de la redirection du Chunk ${chunkNumber} vers ${topic}`);
        
        // Publier les données sur le topic du nœud sélectionné
        mqttClient.publish(topic, JSON.stringify(chunkData), { qos: 1 }, (error) => {
            if (error) {
                console.error(`Erreur lors de la redirection du chunk ${chunkNumber} à ${topic}:`, error);
            } else {
                console.log(`Chunk ${chunkNumber} redirigé avec succès à ${topic}`);
            }
        });
    } catch (error) {
        logMessage(`Erreur lors du load balancing : ${error.message}`);
        throw error;
    }
};

// Gestion des messages entrants depuis le topic `streamer/encodedChunks`
mqttClient.on('connect', () => {
    mqttClient.subscribe('streamer/encodedChunks', (error) => {
        if (error) {
            logMessage('Erreur lors de l\'abonnement au topic streamer/encodedChunks');
        } else {
            logMessage('Abonné au topic streamer/encodedChunks');
        }
    });
});

mqttClient.on('message', (topic, message) => {
    if (topic === 'streamer/encodedChunks') {
        const chunkData = JSON.parse(message.toString());
        loadBalanceChunk(chunkData).catch(error => {
            console.error('Erreur lors du traitement du chunk:', error);
        });
    }
});

module.exports = {
    loadBalanceChunk
};
