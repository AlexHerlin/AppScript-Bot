# Présentation du BOT MAIL avec AppScript
## Contexte
Dans le cadre de la réhabilitation thermique de logement, nous sommes amenés à travailler avec de grand volume de données.
L'opération Rénov' Makers vise à **réhabiliter 6000 logements en deux ans**. Les données thermiques de ces logements sont mises à jour grâce au DPE (diagnostic de performance énergétique). 

Ces DPE se présentent sous deux formes :
- un format .pdf destiné aux particuliers
- un format .xml destiné à l'exploitation des données (notamment à destination de l'[ADEME](https://observatoire-dpe-audit.ademe.fr/accueil))

## Besoins
L'intégration de ces données se faisaient manuellement jusqu'alors. Nous recevions un dossier contenant 150 DPE, ouvrions chaque DPE uns à uns pour extraire les information vers notre table d'information Google Sheet. 
Cette tache bien que basique se révellait extremement chronophage. C'est pourquoi j'ai mis en place cette macro.

## Présentation de la macro
### Tri des mails automatiques
L'ensemble des diagnostics sont réceptionnés sur une boite mail. Il faut cependant trier les mails pour identifier uniquement les diagnostics thermiques (on ne veut pas traiter les diagnostics amiantes par exemple).

Cette macro est écrite dans le fichier *Classement.js*
Les mails sont triés suivant le nom des pièces jointes associées (les noms des fichiers sont normés, permettant l'utilisation de regex).

### Lecture et intégration des données
Une fois les mails triés il faut les exploiter. C'est la macro *integration_mail.js* qui s'en charge :

1. Chargement des pièces jointes dans un dossier Google Drive spécifique pour archivage
2. Lecture des données du fichier .xml (macro *extraction_xml.js*) et identification du logement associé
3. Construction de la requête de mise à jour (utilisation de l'API google sheet pour des raisons de rapidité)
4. Intégration des données

## Principales problématique et défi technique à relever
App script ne peut exécuter un script plus de 5 minutes. Les macros doivent donc être optimiser pour pouvoir s'éxécuter convenablement.
C'est pourquoi l'ensemble des scripts limitent au maximum le nombre de requête envoyé au serveur de google, notamment sur la mise à jour des données google sheet.








