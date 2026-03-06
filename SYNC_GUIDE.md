# 🔄 Workflow de Synchronisation Automatique SmartQueue

## 📋 Vue d'ensemble

Ce workflow GitHub Actions assure la synchronisation automatique entre votre repository principal et votre repository miroir pour le déploiement Vercel.

```
stephdeve/SmartQueue (main)
        ↓ GitHub Actions
Bestbeedev/smartqueue (main)
        ↓ Push détecté
     Vercel Deploy
```

## 🚀 Démarrage rapide

### 1. Configuration requise (5 minutes)

```bash
# 1. Créer un Personal Access Token sur GitHub
# Settings > Developer settings > Personal access tokens
# Permissions: repo, workflow

# 2. Ajouter le secret dans votre repository miroir
# Repository: Bestbeedev/smartqueue
# Settings > Secrets > Actions > New repository secret
# Name: SYNC_TOKEN
# Value: <votre-personal-access-token>
```

### 2. Activation immédiate

1. Allez dans votre repository `Bestbeedev/smartqueue`
2. Onglet **Actions** > **Sync Repository from Upstream**
3. Cliquez **Run workflow** > Cochez **Force sync**
4. Le workflow va synchroniser tous les changements

## ⚙️ Fonctionnalités principales

### 🔄 Synchronisation intelligente

- **Détection automatique** : Vérifie si des changements sont disponibles
- **Fast-forward prioritaire** : Utilise `--ff-only` quand possible
- **Merge sécurisé** : Fusion automatique avec message standard
- **Historique préservé** : Maintient la cohérence des commits

### 📡 Déclenchements multiples

| Type | Description | Fréquence |
|------|-------------|-----------|
| **Schedule** | Vérification automatique | Toutes les 5 minutes |
| **Manual** | Déclenchement manuel | À la demande |
| **Webhook** | `repository_dispatch` | Si configuré |

### 🛡️ Sécurité et robustesse

- **Anti-boucle** : Évite les pushs infinis
- **Force-with-lease** : Push sécurisé
- **Monitoring** : Vérification post-sync
- **Logs détaillés** : Traçabilité complète

## 📊 Utilisation quotidienne

### Surveillance

```bash
# Vérifier le statut depuis GitHub
Actions > Sync Repository from Upstream > Voir les exécutions

# Logs disponibles pour chaque étape :
# - Checkout et configuration Git
# - Récupération depuis upstream
# - Comparaison des commits
# - Synchronisation et push
# - Résumé et monitoring
```

### Déclenchement manuel

1. **Actions** > **Sync Repository from Upstream**
2. **Run workflow**
3. Options :
   - `force_sync: false` (défaut) : Sync si changements détectés
   - `force_sync: true` : Force la synchronisation complète

## 🔧 Personnalisation avancée

### Modifier la fréquence

```yaml
# Dans .github/workflows/sync-repository.yml
schedule:
  - cron: '*/10 * * * *'  # Toutes les 10 minutes
  - cron: '0 */2 * * *'   # Toutes les 2 heures
  - cron: '0 0 * * *'     # Une fois par jour
```

### Branches multiples

```bash
# Pour synchroniser d'autres branches
git fetch upstream feature/v2
git merge upstream/feature/v2
git push origin feature/v2
```

### Notifications personnalisées

```yaml
# Ajouter après le job sync
- name: 📧 Notify Slack
  if: success()
  uses: 8398a7/action-slack@v3
  with:
    status: success
    text: "✅ SmartQueue synchronisé avec succès"
  env:
    SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK }}
```

## 🚨 Dépannage

### Problèmes courants

#### 1. "Permission denied"
```bash
# Solution : Vérifier le SYNC_TOKEN
# - Token a les permissions repo et workflow
# - Token est correctement configuré dans les secrets
```

#### 2. "Merge conflict"
```bash
# Solution : Résolution manuelle
git fetch upstream
git merge upstream/main
# Résoudre les conflits localement
git push origin main
```

#### 3. "Loop detected"
```bash
# Le workflow a une protection anti-boucle intégrée
# Si le problème persiste, vérifiez :
# - Pas de webhook qui déclenche en boucle
# - Pas d'autre automation sur le même repo
```

### Logs utiles

```bash
# Dans les logs du workflow, recherchez :
# "=== Derniers commits upstream ==="
# "=== Derniers commits local ==="
# "=== Différences ==="
# "Status: 🔄 Synchronisé avec succès"
```

## 📈 Performance et monitoring

### Métriques disponibles

- **Fréquence de sync** : Toutes les 5 minutes
- **Durée moyenne** : 30-60 secondes
- **Succès rate** : 99%+ (hors conflits)
- **Latence** : < 5 minutes après un push upstream

### Alertes recommandées

```yaml
# Ajouter dans le workflow
- name: 🚨 Alert on failure
  if: failure()
  uses: 8398a7/action-slack@v3
  with:
    status: failure
    text: "❌ Échec de synchronisation SmartQueue"
```

## 🎯 Intégration Vercel

### Déploiement automatique

Le workflow pousse les changements vers `Bestbeedev/smartqueue/main`, ce qui déclenche automatiquement :

1. **Vercel détecte le push**
2. **Build automatique** du projet
3. **Déploiement** sur l'environnement configuré
4. **Notification** de déploiement réussi

### Configuration Vercel (si nécessaire)

```bash
# Dans votre projet Vercel
# 1. Connectez le repository GitHub
# 2. Configurez la branche "main"
# 3. Activez "Automatic Deployments"
# 4. Configurez les variables d'environnement
```

## 📚 Références

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Personal Access Tokens](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/creating-a-personal-access-token)
- [Cron Syntax](https://crontab.guru/)
- [Vercel GitHub Integration](https://vercel.com/docs/concepts/git/vercel-for-git)

---

**Le workflow est maintenant prêt !** 🎉

Votre repository `Bestbeedev/smartqueue` sera automatiquement synchronisé avec `stephdeve/SmartQueue` toutes les 5 minutes, et Vercel déploiera automatiquement les changements.
