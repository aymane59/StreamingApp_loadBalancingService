const express = require('express');
const loadBalancerController = require('./controllers/loadBalancerController');

const app = express();

// Démarrer le service de load balancing en s'abonnant au topic
const startLoadBalancingService = async () => {
    try {
        await loadBalancerController.startListening(); // Démarrer l'écoute des messages
        console.log('Service de load balancing démarré avec succès.');
    } catch (error) {
        console.error('Erreur lors du démarrage du service de load balancing:', error);
    }
};

// Initialiser le service
startLoadBalancingService();

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
    console.log(`Load balancer démarré sur le port ${PORT}`);
});
