# Calculateur Logistique Pro - Multi-User Version

Une application web de calcul de frais logistiques avec authentification des utilisateurs et sauvegarde des sessions.

## Fonctionnalités

- **Authentification des utilisateurs** : Inscription et connexion sécurisées
- **Sessions sauvegardées** : Chaque utilisateur peut sauvegarder et charger ses calculs
- **Calculs logistiques** : Calcul des frais de transport, frais locaux, RF, taxes régionales, etc.
- **Multi-devises** : Support MAD, USD, EUR avec taux de change en temps réel
- **Export PDF** : Génération de PDF professionnels
- **Interface moderne** : Design sombre et responsive

## Prérequis

- Node.js (version 14 ou supérieure)
- npm (gestionnaire de paquets Node.js)

## Installation

1. **Installer les dépendances** :
   ```bash
   npm install
   ```

2. **Démarrer le serveur** :
   ```bash
   npm start
   ```
   
   Pour le développement avec auto-rechargement :
   ```bash
   npm run dev
   ```

3. **Accéder à l'application** :
   Ouvrez votre navigateur et allez sur `http://localhost:3000`

## Utilisation

### Première utilisation

1. **Créer un compte** :
   - Cliquez sur "Inscription"
   - Remplissez le formulaire (nom d'utilisateur, email, mot de passe)
   - Validez l'inscription

2. **Se connecter** :
   - Utilisez vos identifiants pour vous connecter
   - Vous serez redirigé vers l'interface principale

### Utilisation de l'application

1. **Créer des calculs** :
   - Cliquez sur "+ Ajouter" pour créer une nouvelle calculatrice
   - Remplissez les informations (transporteur, quantité, type de conteneur)
   - Ajoutez les frais (fret, frais locaux, autres frais)

2. **Gérer les dossiers** :
   - Créez de nouveaux dossiers avec "+ Nouveau Dossier"
   - Renommez les dossiers existants avec l'icône ✏️
   - Supprimez les dossiers non désirés

3. **Sauvegarder les sessions** :
   - Cliquez sur "💾 Sauvegarder" pour enregistrer votre travail
   - Donnez un nom à votre session
   - Vos sessions apparaissent dans la section "Sessions sauvegardées"

4. **Charger une session** :
   - Dans la sidebar, cliquez sur l'icône 📂 à côté d'une session sauvegardée
   - Votre travail sera restauré

5. **Exporter en PDF** :
   - Cliquez sur "📥 PDF" pour générer un PDF professionnel
   - Le PDF inclut tous vos calculs et informations

## Architecture technique

### Backend (Node.js + Express)

- **Serveur Express** : Gère les requêtes HTTP et les sessions
- **SQLite** : Base de données légère pour stocker les utilisateurs et les sessions
- **bcrypt** : Hashage sécurisé des mots de passe
- **express-session** : Gestion des sessions utilisateur

### Base de données

Deux tables principales :

1. **users** : Informations des utilisateurs
   - id, username, email, password (hashé), created_at

2. **user_sessions** : Sessions sauvegardées
   - id, user_id, session_name, session_data (JSON), created_at, updated_at

### API Endpoints

- `POST /api/register` : Inscription d'un nouvel utilisateur
- `POST /api/login` : Connexion d'un utilisateur
- `POST /api/logout` : Déconnexion
- `GET /api/user` : Informations de l'utilisateur connecté
- `GET /api/sessions` : Lister les sessions de l'utilisateur
- `POST /api/sessions` : Sauvegarder une session
- `GET /api/sessions/:id` : Charger une session spécifique
- `DELETE /api/sessions/:id` : Supprimer une session

### Frontend

- **HTML5/CSS3/JavaScript** : Interface utilisateur moderne
- **Responsive Design** : Compatible mobile et desktop
- **jsPDF** : Génération de PDF côté client
- **API Fetch** : Communication avec le backend

## Sécurité

- **Hashage des mots de passe** : Utilisation de bcrypt avec salt
- **Sessions sécurisées** : Cookies HTTP-only avec expiration
- **Validation des entrées** : Protection contre les injections
- **Isolation des données** : Chaque utilisateur n'accède qu'à ses propres sessions

## Déploiement

### Production

1. **Variables d'environnement** :
   ```bash
   export NODE_ENV=production
   export PORT=3000
   export SESSION_SECRET=votre-secret-unique-et-securise
   ```

2. **HTTPS** : Configurez un reverse proxy (nginx/Apache) avec SSL

3. **Base de données** : Pour une charge élevée, migrez vers PostgreSQL ou MySQL

### Docker (optionnel)

```dockerfile
FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

## Maintenance

- **Sauvegardes régulières** : Sauvegardez le fichier `logistics_calculator.db`
- **Logs** : Surveillez les logs du serveur pour détecter les problèmes
- **Mises à jour** : Maintenez les dépendances Node.js à jour

## Support

En cas de problème :

1. Vérifiez les logs du serveur
2. Assurez-vous que Node.js est correctement installé
3. Vérifiez que le port 3000 est disponible
4. Contactez le support technique

## Licence

MIT License
