# Configuration GitHub Actions - Synchronisation Automatique

## 📍 Emplacement exact du fichier

Le workflow est situé à :
```
.github/workflows/sync-repository.yml
```

## 🔐 Permissions GitHub nécessaires

### 1. Créer un Personal Access Token (PAT)

1. Allez dans **Settings** > **Developer settings** > **Personal access tokens**
2. Cliquez sur **Generate new token** > **Generate new token (classic)**
3. Configurez le token avec ces permissions :
   - `repo` (Accès complet aux repositories)
   - `workflow` (Gestion des workflows)
   - `write:packages` (Si nécessaire pour Vercel)

4. Copiez le token immédiatement (il ne sera plus affiché)

### 2. Configurer le secret dans le repository miroir

Dans votre repository `Bestbeedev/smartqueue` :

1. Allez dans **Settings** > **Secrets and variables** > **Actions**
2. Cliquez sur **New repository secret**
3. Nom : `SYNC_TOKEN`
4. Value : collez votre Personal Access Token

### 3. Permissions du workflow

Le workflow nécessite ces permissions dans le repository `Bestbeedev/smartqueue` :

```yaml
permissions:
  contents: write      # Pour pusher les changements
  actions: read       # Pour lire les workflows
  pull-requests: read # Pour vérifier les PR si nécessaire
```

## 🔄 Configuration du remote upstream

### Méthode 1 : Locale (pour développement)

```bash
# Dans votre repository local
cd /path/to/SmartQueue

# Ajouter le remote upstream
git remote add upstream https://github.com/stephdeve/SmartQueue.git

# Vérifier les remotes
git remote -v

# Récupérer les changements
git fetch upstream
```

### Méthode 2 : Automatique (dans le workflow)

Le workflow configure automatiquement le remote upstream, donc aucune configuration manuelle n'est nécessaire sur GitHub.

## 🚀 Déploiement et activation

### 1. Activer GitHub Actions

1. Dans votre repository `Bestbeedev/smartqueue`
2. Allez dans **Actions** tab
3. Si c'est le premier workflow, cliquez sur **I understand my workflows, go ahead and enable them**

### 2. Vérifier le workflow

1. Allez dans **Actions** > **Sync Repository from Upstream**
2. Cliquez sur **Run workflow** pour tester manuellement
3. Cochez **Force sync** pour une première synchronisation complète

## 📊 Monitoring et déclenchement

### Déclenchements automatiques

- **Schedule** : Toutes les 5 minutes (`*/5 * * * *`)
- **Webhook** : Via `repository_dispatch` si configuré
- **Manuel** : Via l'interface GitHub Actions

### Surveillance

- Les logs sont disponibles dans l'onglet **Actions**
- Le workflow inclut un job de monitoring pour éviter les boucles infinies
- Statistiques détaillées dans les logs de chaque exécution

## ⚠️ Points importants

### Éviter les boucles infinies

Le workflow utilise plusieurs stratégies :
- Vérification des différences avant sync
- `--force-with-lease` au lieu de `--force`
- Monitoring du statut de synchronisation

### Gestion des conflits

- Priorité au fast-forward quand possible
- Merge automatique avec message de commit standard
- Les conflits doivent être résolus manuellement si nécessaire

### Performance

- `fetch-depth: 0` pour récupérer tout l'historique
- `--prune --tags` pour nettoyer les branches obsolètes
- Exécution optimisée avec conditions early-exit

## 🔧 Personnalisation

### Modifier la fréquence

Changez le cron dans le workflow :
```yaml
schedule:
  - cron: '*/10 * * * *'  # Toutes les 10 minutes
  - cron: '0 * * * *'     # Toutes les heures
```

### Branches spécifiques

Pour synchroniser d'autres branches :
```yaml
git fetch upstream branch-name
git merge upstream/branch-name
git push origin branch-name
```

### Notifications

Ajoutez des notifications Slack/Email dans la section `notify` si nécessaire.
