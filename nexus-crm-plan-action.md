# 🚀 NEXUS CRM — Plan d'Action Semaine par Semaine

> **Objectif :** Passer de zéro à un produit en production avec 5 bêta-testeurs réels en 8 semaines.
> **Rythme estimé :** 4–6h/jour (solo developer fullstack)
> **Principe :** Chaque semaine a une mission claire, des livrables vérifiables et un critère de succès binaire.

---

## 📋 Vue d'Ensemble

| Semaine | Focus                  | Livrable clé            | Critère de succès                                    |
| ------- | ---------------------- | ----------------------- | ---------------------------------------------------- |
| S1      | Infrastructure & Setup | Monorepo déployé        | L'app tourne en prod (même vide)                     |
| S2      | Auth & Multi-tenancy   | Login + Workspaces      | On peut créer un compte et une organisation          |
| S3      | Contacts CRUD          | Module contacts complet | On peut ajouter/lister/éditer/supprimer un contact   |
| S4      | Pipeline Kanban        | Vue deals fonctionnelle | On peut déplacer un deal entre étapes                |
| S5      | Intégration IA         | Assistant contextuel    | L'IA répond en contexte sur un contact               |
| S6      | Email & Activités      | Sync + Timeline         | Les emails Gmail s'affichent dans la fiche contact   |
| S7      | Score IA & Alertes     | Scoring dynamique       | Chaque contact a un score mis à jour automatiquement |
| S8      | Polish & Bêta          | Produit bêta-ready      | 5 personnes utilisent le produit sans aide           |

---

## 🗓️ SEMAINE 1 — Infrastructure & Fondations

> **Mission :** Mettre en place l'environnement de développement complet et déployer une app vide en production. Boring mais critique.

### Jour 1 — Monorepo & Tooling

- [ ] Créer le monorepo avec **Turborepo**
  ```bash
  npx create-turbo@latest nexus-crm
  ```
- [ ] Structure des packages : `apps/web` (Next.js 15), `apps/api` (Hono), `packages/db`, `packages/ui`, `packages/config`
- [ ] Configurer TypeScript strict mode sur tous les packages
- [ ] Setup ESLint + Prettier + lint-staged + Husky (pre-commit hooks)
- [ ] Initialiser le repo Git + créer le repo GitHub (privé)

### Jour 2 — Base de données & ORM

- [ ] Créer le projet **Supabase** (prod) + second projet (dev/staging)
- [ ] Installer et configurer **Drizzle ORM** dans `packages/db`
- [ ] Écrire le schéma initial complet :
  ```
  organizations, users, organization_members,
  contacts, deals, pipeline_stages,
  activities, notes, tags, contact_tags
  ```
- [ ] Configurer Row Level Security (RLS) sur toutes les tables avec `organization_id`
- [ ] Première migration et vérification dans Supabase Studio

### Jour 3 — Frontend Shell

- [ ] Setup **Next.js 15** avec App Router dans `apps/web`
- [ ] Installer et configurer **Tailwind CSS v4** + **shadcn/ui**
  ```bash
  npx shadcn@latest init
  ```
- [ ] Créer le layout de base : sidebar, header, zone de contenu
- [ ] Installer les fonts (Geist ou autre choix typographique)
- [ ] Configurer les variables CSS (couleurs, espacements, tokens de design)
- [ ] Page d'accueil temporaire (landing simple)

### Jour 4 — CI/CD & Déploiement

- [ ] Setup **GitHub Actions** :
  - Workflow `ci.yml` : lint + typecheck + tests sur chaque PR
  - Workflow `deploy.yml` : déploiement auto sur merge dans `main`
- [ ] Connecter `apps/web` à **Vercel** avec preview deployments
- [ ] Déployer `apps/api` sur **Railway** (Dockerfile simple)
- [ ] Configurer les variables d'environnement dans Vercel et Railway
- [ ] Vérifier que les deux services communiquent en production

### Jour 5 — Observabilité & Configuration

- [ ] Installer **Sentry** (frontend + backend) — dès J1, pas après
- [ ] Installer **PostHog** pour l'analytics produit
- [ ] Configurer les logs structurés côté API (pino ou winston)
- [ ] Setup **Axiom** ou Logtail pour la centralisation des logs
- [ ] Documenter les URLs, secrets et accès dans un Notion/README interne
- [ ] **Critère de succès ✅** : `https://app.nexuscrm.io` répond avec une page, Sentry reçoit un event test

---

## 🔐 SEMAINE 2 — Authentification & Multi-tenancy

> **Mission :** Un utilisateur peut s'inscrire, créer son organisation, inviter des collègues, et se connecter. La fondation de toute la sécurité des données.

### Jour 1 — Setup Clerk

- [ ] Créer le projet sur **Clerk** et configurer les providers OAuth (Google, Microsoft)
- [ ] Installer `@clerk/nextjs` dans `apps/web`
- [ ] Middleware Next.js pour protéger toutes les routes `/app/*`
- [ ] Pages : `/sign-in`, `/sign-up`, `/verify-email`
- [ ] Webhook Clerk → API pour synchroniser les users dans Supabase

### Jour 2 — Modèle Organisation (Workspace)

- [ ] Page de création d'organisation (nom, slug, logo optionnel)
- [ ] Logique de sélection d'organisation (un user peut appartenir à plusieurs)
- [ ] Stocker l'`organization_id` actif dans le cookie de session
- [ ] Middleware API qui injecte l'`organization_id` dans chaque requête
- [ ] Vérifier que le RLS Supabase bloque bien les données cross-tenant

### Jour 3 — Invitations & Rôles

- [ ] Système d'invitation par email (Resend) avec token signé
- [ ] Rôles : `owner`, `admin`, `member` avec permissions différentes
- [ ] Page de gestion d'équipe : liste des membres, statut, rôle
- [ ] Révocation d'accès et suppression de membre
- [ ] Guards côté API et frontend sur les routes admin

### Jour 4 — Settings & Profil

- [ ] Page Settings organisation : nom, logo, timezone, devise
- [ ] Page profil utilisateur : nom, avatar, préférences notifications
- [ ] Page billing (placeholder pour Stripe plus tard)
- [ ] Navigation Settings avec sections (General, Team, Billing, Integrations)

### Jour 5 — Tests & Sécurité

- [ ] Tests E2E Playwright : flow inscription → création org → invitation → login
- [ ] Vérifier les cas limites : token expiré, invitation révoquée, user supprimé
- [ ] Audit des headers HTTP (CSP, HSTS, X-Frame-Options)
- [ ] Rate limiting sur les endpoints d'auth (upstash/ratelimit)
- [ ] **Critère de succès ✅** : Alice s'inscrit, invite Bob, Bob rejoint et voit un workspace vide. Impossible pour Alice de voir les données d'une autre organisation.

---

## 👥 SEMAINE 3 — Module Contacts

> **Mission :** Le cœur du CRM. Un commercial peut gérer son portefeuille de contacts de A à Z.

### Jour 1 — Liste & Recherche

- [ ] API endpoint `GET /contacts` avec pagination cursor-based
- [ ] Filtres : par tag, par stage, par score, par owner
- [ ] Recherche full-text PostgreSQL (`tsvector`) sur nom + email + entreprise
- [ ] Vue tableau avec colonnes configurables (show/hide)
- [ ] Tri par colonne (nom, score, valeur, dernière activité)

### Jour 2 — Création & Édition

- [ ] Formulaire de création contact (validation Zod côté client + serveur)
  - Champs : prénom, nom, email, téléphone, entreprise, rôle, linkedin
  - Champs custom configurables par organisation
- [ ] Page fiche contact avec toutes les informations
- [ ] Édition inline des champs principaux (double-clic pour éditer)
- [ ] Upload et affichage de l'avatar

### Jour 3 — Tags, Notes & Activités

- [ ] Système de tags : création, affichage, filtrage, suppression
- [ ] Module notes : ajouter, éditer, supprimer une note sur un contact
- [ ] Log d'activité manuel : appel passé, réunion tenue, email envoyé
- [ ] Timeline des activités en ordre chronologique dans la fiche contact

### Jour 4 — Import & Export

- [ ] Import CSV avec :
  - Prévisualisation des 5 premières lignes
  - Mapping des colonnes CSV → champs CRM
  - Rapport d'import (X créés, Y mis à jour, Z erreurs)
- [ ] Export CSV des contacts filtrés
- [ ] Détection des doublons à l'import (email identique → merge ou skip)

### Jour 5 — Vue Kanban Contacts + Tests

- [ ] Vue "par segment" avec drag & drop entre groupes
- [ ] Bulk actions : tagger, assigner, supprimer plusieurs contacts
- [ ] Tests Playwright : CRUD complet, import CSV, recherche
- [ ] **Critère de succès ✅** : Importer 50 contacts CSV, les retrouver par recherche, ajouter une note, les exporter. Zéro bug bloquant.

---

## 📊 SEMAINE 4 — Pipeline & Deals

> **Mission :** Visualiser et gérer les opportunités commerciales. Le pipeline est ce que les commerciaux ouvrent 10 fois par jour.

### Jour 1 — Modèle de données Deals

- [ ] Table `deals` : titre, valeur, devise, probabilité, date de closing estimée, owner, contact, stage
- [ ] Table `pipeline_stages` : nom, ordre, couleur, probabilité par défaut (configurable)
- [ ] API CRUD complète pour les deals
- [ ] Lier un deal à un ou plusieurs contacts

### Jour 2 — Vue Kanban

- [ ] Vue Kanban avec colonnes = étapes du pipeline
- [ ] Drag & drop entre colonnes avec **@dnd-kit** (plus maintenu que react-beautiful-dnd)
- [ ] Affichage des cards : nom du deal, contact, valeur, date de closing
- [ ] Filtres : par owner, par valeur, par date
- [ ] Compteur et somme de valeur par colonne

### Jour 3 — Fiche Deal

- [ ] Page détail d'un deal
  - Informations générales (valeur, stage, probabilité, date)
  - Contacts liés avec leur rôle dans le deal
  - Timeline des activités liées au deal
  - Notes spécifiques au deal
- [ ] Historique des changements de stage (qui a déplacé, quand)
- [ ] Fermeture d'un deal : Won ✅ / Lost ❌ avec raison obligatoire

### Jour 4 — Dashboard & Prévisions

- [ ] Page Dashboard avec :
  - MRR/ARR estimé du pipeline pondéré par probabilité
  - Nombre de deals par stage
  - Deals en retard (closing date dépassée)
  - Top 5 des deals les plus chauds
- [ ] Widget "Mon activité" : tâches du jour, deals à relancer
- [ ] Vue liste des deals avec tri et filtres avancés

### Jour 5 — Objectifs & Tests

- [ ] Configuration des objectifs mensuels par commercial (quota)
- [ ] Barre de progression vers l'objectif dans le dashboard
- [ ] Tests E2E : créer un deal, le déplacer, le fermer Won/Lost
- [ ] **Critère de succès ✅** : Un commercial peut gérer son pipeline complet depuis le Kanban. Le dashboard affiche des chiffres cohérents avec les deals créés.

---

## 🤖 SEMAINE 5 — Intégration IA (Claude API)

> **Mission :** Intégrer l'intelligence artificielle au cœur de l'expérience. C'est le différenciateur principal.

### Jour 1 — Infrastructure IA

- [ ] Installer le SDK Anthropic `@anthropic-ai/sdk`
- [ ] Créer le service `AIService` côté API avec gestion des erreurs et retry
- [ ] Système de quotas : compter les tokens utilisés par organisation
- [ ] Table `ai_usage` : tracer chaque appel (tokens in/out, coût estimé, feature utilisée)
- [ ] Cache Redis (Upstash) pour les réponses identiques (ex: enrichissement même URL)

### Jour 2 — Contexte Contact pour l'IA

- [ ] Fonction `buildContactContext(contactId)` :
  - Profil complet du contact
  - Historique des 10 dernières activités
  - Notes récentes
  - Deal(s) associé(s) et leur stage
  - Emails récents (titre + résumé)
- [ ] Système de prompt engineering : system prompt métier bien construit
- [ ] Tests du contexte : vérifier que l'IA répond avec pertinence

### Jour 3 — Assistant Conversationnel

- [ ] Interface chat dans la fiche contact (panel latéral ou modal)
- [ ] Streaming des réponses (`stream: true`) pour l'UX temps réel
- [ ] Historique de la conversation dans la session (pas persisté pour l'instant)
- [ ] Suggestions de questions pré-configurées :
  - "Quelle est la prochaine meilleure action ?"
  - "Rédige un email de relance"
  - "Analyse les risques de ce deal"
  - "Prépare-moi pour mon prochain RDV"

### Jour 4 — Rédaction d'Emails IA

- [ ] Page de rédaction d'email avec mode IA
- [ ] Génération d'email selon : contexte du contact + intention + ton choisi
- [ ] Édition de l'email généré avant envoi
- [ ] Bibliothèque de templates avec variables dynamiques
- [ ] Historique des emails générés par contact

### Jour 5 — Score IA Basique + Tests

- [ ] Calcul du score IA (première version par règles + LLM) :
  - Activité récente (email ouvert, réponse, RDV) → +points
  - Inactivité longue → -points
  - Stage avancé → score plus élevé
  - LLM analyse le dernier email pour détecter le sentiment
- [ ] Affichage du score avec jauge animée dans la fiche contact
- [ ] Tests : vérifier cohérence des scores, tester les cas limites
- [ ] **Critère de succès ✅** : L'assistant répond en <3s avec une suggestion pertinente sur un vrai contact. La génération d'email fait gagner 5 minutes vs rédaction manuelle.

---

## 📧 SEMAINE 6 — Email & Timeline d'Activité

> **Mission :** Connecter les boîtes email des commerciaux pour centraliser toutes les communications dans le CRM.

### Jour 1 — OAuth Gmail

- [ ] Setup Google Cloud Console : OAuth app, scopes Gmail
- [ ] Flow de connexion Gmail dans les settings utilisateur
- [ ] Stocker les tokens OAuth (access + refresh) chiffrés en base
- [ ] Refresh automatique des tokens expirés
- [ ] Page de statut de la connexion email

### Jour 2 — Sync des Emails

- [ ] Job BullMQ : sync des emails des 30 derniers jours à la première connexion
- [ ] Job incrémental toutes les 15 minutes
- [ ] Matching email → contact (par adresse email)
- [ ] Stocker les emails dans la table `activities` (type: `email`)
- [ ] Gérer les threads Gmail (grouper les emails d'une même conversation)

### Jour 3 — Tracking Email

- [ ] Pixel de tracking invisible dans les emails envoyés (1x1 PNG unique)
- [ ] Tracking des clics sur les liens (redirect via l'API)
- [ ] Affichage dans la timeline : "Email ouvert il y a 2h" / "Lien cliqué"
- [ ] Ces events alimentent le score IA automatiquement

### Jour 4 — Timeline Unifiée

- [ ] Timeline dans la fiche contact affichant dans un flux chronologique :
  - Emails envoyés et reçus (avec tracking)
  - Appels logués manuellement
  - Réunions
  - Notes
  - Changements de stage
  - Events IA (score mis à jour, email généré)
- [ ] Filtres sur la timeline par type d'activité
- [ ] Épingler une activité en haut de la timeline

### Jour 5 — Boîte email intégrée (basique)

- [ ] Vue "Boîte de réception" dans le CRM : emails non lus liés à des contacts
- [ ] Répondre à un email directement depuis le CRM
- [ ] Composer un email depuis la fiche contact (avec brouillon IA)
- [ ] **Critère de succès ✅** : Connecter sa boîte Gmail et voir les 30 derniers emails triés par contact, avec les ouvertures trackées.

---

## ⚡ SEMAINE 7 — Score IA Dynamique & Alertes Intelligentes

> **Mission :** Rendre le CRM vraiment prédictif — il dit aux commerciaux sur qui se concentrer aujourd'hui.

### Jour 1 — Moteur de Scoring Avancé

- [ ] Refactorer le scoring en un système de signaux pondérés :
  ```
  Signal                    Poids   Durée
  Email répondu            +20     7 jours
  Email ouvert             +5      3 jours
  Lien cliqué              +10     3 jours
  RDV passé                +25     14 jours
  Deal avancé de stage     +30     30 jours
  Aucune activité          -5/j    après 7j
  Deal en retard           -15     immédiat
  ```
- [ ] Job quotidien (cron) qui recalcule les scores de toute l'organisation
- [ ] Historique du score → graphique d'évolution dans la fiche contact

### Jour 2 — Analyse de Sentiment IA

- [ ] Pour chaque email entrant, appel API Claude pour analyser :
  - Sentiment : positif / neutre / négatif / urgent
  - Intention : achat, questionnement, objection, blocage, désintérêt
  - Urgence détectée : oui / non
- [ ] Stocker le sentiment dans l'activité
- [ ] Impacter le score IA selon le sentiment détecté
- [ ] Afficher une icône de sentiment dans la timeline

### Jour 3 — Système d'Alertes

- [ ] Table `alerts` : type, contact_id, deal_id, message, lue
- [ ] Types d'alertes générées automatiquement :
  - "🔥 Julien Mercer a ouvert ton email 3 fois ce matin"
  - "⚠️ Deal Orbital SaaS n'a pas bougé depuis 14 jours"
  - "📈 Score de Sophia Laurent a augmenté de 20 points"
  - "🗓️ RDV avec Marcus Osei demain — aucune préparation IA faite"
- [ ] Centre de notifications dans le header
- [ ] Email digest quotidien (Resend) avec les alertes du jour

### Jour 4 — "Que faire maintenant ?" — IA Proactive

- [ ] Widget "Priorités du jour" dans le dashboard (généré par IA chaque matin)
  - Top 5 contacts à relancer aujourd'hui (basé sur signaux + score)
  - Deals en danger identifiés
  - Opportunités détectées
- [ ] Génération IA du plan d'action quotidien (job cron 8h du matin)
- [ ] Bouton "Préparer mon RDV" → contexte briefing IA du contact + deal

### Jour 5 — Affinage & Tests de Charge

- [ ] Vérifier les performances du moteur de scoring (objectif : <5s pour 1000 contacts)
- [ ] Optimiser les index PostgreSQL sur les champs fréquemment filtrés
- [ ] Tester les crons sur des données volumineuses (seed 500 contacts)
- [ ] Vérifier le coût API IA avec 20 utilisateurs simulés
- [ ] **Critère de succès ✅** : Le widget "Priorités du jour" identifie correctement les 3 contacts les plus chauds d'un portefeuille de 50. Les alertes arrivent dans les 15 minutes après un événement.

---

## 🎯 SEMAINE 8 — Polish, Onboarding & Lancement Bêta

> **Mission :** Rendre le produit utilisable par quelqu'un qui n'est pas toi. C'est la semaine la plus importante.

### Jour 1 — Onboarding Flow

- [ ] Wizard d'onboarding en 4 étapes pour un nouvel utilisateur :
  1. Nom et photo de profil
  2. Connexion email Gmail/Outlook (avec explication de la valeur)
  3. Import de premiers contacts (CSV ou manual)
  4. Créer son premier deal
- [ ] Progress bar et possibilité de sauter les étapes
- [ ] Checklist "Premiers pas" dans le dashboard jusqu'à complétion
- [ ] Email de bienvenue personnalisé (Resend) à l'inscription

### Jour 2 — Vide States & Loading States

- [ ] Chaque page vide a un état "empty state" avec illustration et CTA clair
  - Contacts vides → "Importez vos premiers contacts"
  - Pipeline vide → "Créez votre première opportunité"
  - Aucune alerte → "Tout est sous contrôle 🎉"
- [ ] Skeleton loaders sur toutes les listes et cartes
- [ ] Error boundaries sur toutes les sections critiques
- [ ] Toast notifications cohérentes pour toutes les actions (succès + erreur)

### Jour 3 — Performance & Mobile

- [ ] Audit Lighthouse : viser >85 sur Performance, Accessibility, Best Practices
- [ ] Lazy loading des composants lourds (graphiques, éditeur)
- [ ] Optimisation des images (next/image partout)
- [ ] Responsive mobile : les vues essentielles fonctionnent sur téléphone
  - Dashboard, fiche contact, timeline, chat IA
- [ ] PWA basique : manifest + service worker pour installation mobile

### Jour 4 — Sécurité & RGPD

- [ ] Audit complet des endpoints API : chaque route vérifie l'appartenance à l'organisation
- [ ] Chiffrement des tokens OAuth en base (AES-256)
- [ ] Page RGPD dans les settings : télécharger ses données, supprimer son compte
- [ ] Bannière de cookies si nécessaire
- [ ] Rate limiting sur toutes les routes API sensibles
- [ ] Politique de rétention des données définie (90 jours pour les logs)

### Jour 5 — Lancement Bêta 🚀

- [ ] Créer 5 comptes bêta-testeurs (idéalement de vrais commerciaux B2B)
- [ ] Session d'onboarding individuelle de 30 min avec chaque bêta-testeur
- [ ] Mettre en place le canal de feedback (Slack ou Discord privé)
- [ ] Installer un widget Intercom ou Crisp pour le support in-app
- [ ] Créer un tableau Notion pour tracker les feedbacks par priorité
- [ ] Envoyer l'email de lancement bêta
- [ ] **Critère de succès ✅** : 5 personnes utilisent le produit sans aide pendant 30 minutes, logguent au moins 3 activités, et expriment une intention de continuer à l'utiliser.

---

## 📅 Semaines 9–12 — Itérations Post-Bêta

> À définir selon les feedbacks des bêta-testeurs. Voici les candidats probables.

### Backlog Prioritaire (basé sur les retours attendus)

**Quick wins (1–2 jours chacun)**

- [ ] Raccourcis clavier globaux (⌘K pour la recherche universelle)
- [ ] Mode sombre / clair (si la demande remonte souvent)
- [ ] Export PDF d'une fiche contact
- [ ] Notifications push web (ServiceWorker)
- [ ] Intégration Slack : recevoir les alertes dans un channel

**Features semaine (3–5 jours)**

- [ ] Séquences email automatisées (workflow multi-étapes)
- [ ] Transcription automatique des réunions (OpenAI Whisper)
- [ ] Module Reporting manager : vue équipe, comparatifs
- [ ] Intégration LinkedIn Sales Navigator

**Features mois**

- [ ] Application mobile React Native / Expo
- [ ] API publique + documentation
- [ ] Connecteurs Zapier / Make
- [ ] Facturation Stripe + portail client

---

## 🛠️ Stack & Outils de Référence

```
Frontend          Next.js 15 + TypeScript + Tailwind CSS v4 + shadcn/ui
Backend           Hono (ou Fastify) + Zod pour la validation
Base de données   Supabase (PostgreSQL) + Drizzle ORM
Auth              Clerk
IA                Anthropic Claude API (claude-sonnet-4-5)
Emails            Resend + React Email
Jobs              BullMQ + Upstash Redis
Déploiement       Vercel (web) + Railway (API)
Monitoring        Sentry + PostHog + Axiom
Tests             Vitest (unit) + Playwright (E2E)
```

---

## 📏 Règles de Développement

1. **Livrable quotidien** — chaque soir, quelque chose de nouveau fonctionne en production
2. **Tests sur les chemins critiques** — auth, RLS, paiement, appels IA
3. **Pas de fonctionnalité sans empty state** — le produit doit être utilisable dès J1
4. **Mobile first pour les vues fréquentes** — dashboard, fiche contact, chat IA
5. **Coût IA monitoré** — regarder le dashboard d'usage Anthropic chaque jour
6. **Feedback utilisateur dès la S8** — ne pas attendre la perfection pour montrer

---

## 💰 Budget Estimé — Premiers 3 Mois

| Service       | Plan          | Coût/mois            |
| ------------- | ------------- | -------------------- |
| Supabase      | Pro           | $25                  |
| Vercel        | Pro           | $20                  |
| Railway       | Starter       | $10                  |
| Clerk         | Pro           | $25                  |
| Anthropic API | Pay-as-you-go | ~$50–150 selon usage |
| Resend        | Starter       | $0 (100k emails)     |
| Upstash Redis | Pay-as-you-go | ~$5                  |
| Sentry        | Developer     | $0                   |
| PostHog       | Free          | $0                   |
| **Total**     |               | **~$135–235/mois**   |

> 💡 En dessous de 10 clients payants à €29/mois, le produit est autofinancé.

---

_Document généré le Juin 2025 — À réviser chaque vendredi soir selon l'avancement réel._
