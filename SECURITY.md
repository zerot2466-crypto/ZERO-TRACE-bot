# Politique de sécurité ZERO TRACE

## Signalement responsable

Ne publiez jamais une clé API, un token, un fichier `.env` ou une session WhatsApp dans une issue ou une Pull Request. Pour signaler une vulnérabilité, contactez le propriétaire du projet via un canal privé et décrivez les étapes de reproduction sans inclure de secret actif.

## Clés compromises

Si une clé a été exposée, révoquez-la immédiatement auprès de son fournisseur, créez une nouvelle clé et remplacez-la dans votre fichier `.env`. Supprimer une clé d'un commit récent ne suffit pas toujours : l'historique Git peut la conserver.

## Versions

La version actuelle est expérimentale. Testez les changements dans un environnement séparé avant de connecter un compte de production.
