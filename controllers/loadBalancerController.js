const mqtt = require('mqtt');
const loadBalancerService = require('../services/loadBalancerService');

const mqttUrl = 'mqtt://172.20.10.9:1883'; // L'URL de votre broker MQTT
const mqttChannel = 'streamer/encodedChunks'; // Le topic sur lequel écouter

const startListening = () => {
    const client = mqtt.connect(mqttUrl);

    client.on('connect', () => {
        console.log(`Connecté au broker MQTT à ${mqttUrl}`);
        client.subscribe(mqttChannel, (err) => {
            if (err) {
                console.error('Erreur lors de l\'abonnement au topic:', err);
            } else {
                console.log(`Abonné au topic ${mqttChannel}`);
            }
        });
    });

    client.on('message', async (topic, message) => {
        // Lorsque un message est reçu, il est redirigé vers le load balancer
        const chunkData = JSON.parse(message.toString());
        try {
            await loadBalancerService.loadBalanceChunk(chunkData);
        } catch (error) {
            console.error('Erreur lors du load balancing du chunk:', error.message);
        }
    });

    client.on('error', (error) => {
        console.error('Erreur de connexion MQTT:', error);
    });
};

module.exports = {
    startListening
};
