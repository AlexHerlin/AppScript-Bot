function traitementMail () {

  //RECUPERATION DES FEUILLES DE CALCUL
  const SPREADSHEET_ID = '1xxYrCK0oWSEW3tyoyCMPrvT8Ci7LTybcmUfI2cT4KzI'
  const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheetDonneesPatrimoine = spreadsheet.getSheetByName('Données Clésence');
  const sheetReceptionDPE = spreadsheet.getSheetByName('Réception DPE');

  //RECUPERATION DE LA LISTE DES CODES UG
  var listeCodeUG = sheetDonneesPatrimoine.getRange(1, 1, sheetDonneesPatrimoine.getLastRow()).getValues();
  listeCodeUG = listeCodeUG.flat();
  Logger.log('Récupération de la liste des codes patrimoines effectuée.')

  //DOSSIER PDF -- 3 - Diagnostics / 1 - DPE / 1- DPE PDF / 0 - IMPORTATION DES PDF
  var dossierPDF = DriveApp.getFolderById('10WIFXtyWwDitmgO1qtJ5JgK4sxhWpxOo');

  //RECUPERATION DES MESSAGE NON LUS
  const threads = GmailApp.search('is:unread label:"DIAGNOSTICS/DIAGS THERMIQUE"');
  const msgs = GmailApp.getMessagesForThreads(threads);
  if (msgs.length === 0) {return;}

  //CREATION D'UN ARRAY DE REQUEST POUR MAJ DES VALEURS
  var requests = [];
  var donneesReceptionDPE = [];

  for (var i = 0 ; i < msgs.length; i++) { //Boucle sur l'ensemble des messages //msgs.length
    for (var j = 0; j < msgs[i].length; j++) {
      
      Logger.log('Traitement du mail : ' + msgs[i][j].getDate() + ' - ' + msgs[i][j].getSubject())

      //Récupération du dpe PDF et XML
      var attachments = extractionDpeFromMail(msgs[i][j]);

      //Si problème avec la nomenclature des DPE (DPE à l'immeuble par exemple)
      if (attachments === undefined) {
        msgs[i][j].getThread().markRead();
        Logger.log('Erreur. Les nomenclatures ne sont pas respectées.')
        continue;
      };

      //Récupération du code UG et vérification si présence dans la base de données. 
      var codeUG = attachments[0].getName().match(/[0-9].[0-9]{4}.[0-9]{3}.[0-9]{3}.[0-9]{4}/)[0];
      var ligneCodeUG = searchCodeUG(codeUG);

      //Si pas de présence alors on marque le mail lu et on continue
      if (ligneCodeUG === 0) {
        msgs[i][j].getThread().markRead();
        continue;
      };

      Logger.log('Traitement du code UG :' + codeUG + " ligne : " + ligneCodeUG);

      //Création de la pièces jointe dans le dossier pdf
      var dpePDF = dossierPDF.createFile(attachments[0]).setName(codeUG);

      //Construction d'une requête de mise à jour 
      var request = majDonneesDPE(dpePDF, attachments[1], ligneCodeUG);
      requests.push(request);
      donneesReceptionDPE.push([codeUG, msgs[i][j].getDate()]);

      //Mise à jour du statut du mail
      msgs[i][j].getThread().markRead();
    }
  }

  //Mise à jour des données dans 'Données Clésence'
  Sheets.Spreadsheets.batchUpdate({"requests": requests}, SPREADSHEET_ID);
  Logger.log(donneesReceptionDPE);

  //Mise à jour des données dans Réception DPE
  sheetReceptionDPE.getRange(sheetReceptionDPE.getLastRow(), 1, donneesReceptionDPE.length, 2).setValues(donneesReceptionDPE);

  //Conversion des données en dates
  spreadsheet.getRangeByName('DateDPE_Full').setNumberFormat("dd/MM/yyyy");
  spreadsheet.getRangeByName('ValeurDPE1_Full').setNumberFormat("0");
  spreadsheet.getRangeByName('ValeurDPE2_Full').setNumberFormat("0");
  spreadsheet.getRangeByName('ValeurGES_Full').setNumberFormat("0");

  //Filtre du tableau réception DPE pour affichage mails reçus
  sheetReceptionDPE.getDataRange().sort({column: 2, ascending: false});


  /** Retourne un array de 2 pièces jointes (xml et pdf) à partir d'un array de pièce jointe générique */
  function extractionDpeFromMail (messages) {
    //Récupération des pièces jointes
    var attachments = messages.getAttachments();

    //Définition du regex DPE
    var regexUG = RegExp(/[0-9].[0-9]{4}.[0-9]{3}.[0-9]{3}.[0-9]{4} D/);

    //Filtre des pièces jointes suivant le regex pour ne retrouver que le duo xml et pdf
    var dpeAttachment = attachments.filter(attachment => regexUG.test(attachment.getName()))

    //Si le code UG ne respecte pas la nomenclature
    if (dpeAttachment[0] === undefined || dpeAttachment.length !== 2) {
      return undefined;
    }

    //Reverse de l'array pour retrouver le fichier PDF en position 0 de l'array
    dpeAttachment[1].getName().toLowerCase().indexOf('pdf') !== -1 && dpeAttachment.reverse()

    return dpeAttachment
  }

  /** Extrait les données contenu dans le XML et retourne la requête de mise à jour des valeurs */
  function majDonneesDPE (dpePDF, dpeXML, ligneCodeUG) {

    //Convertion du fichier XML en texte
    const texteXML = dpeXML.getDataAsString();

    //Extraction des données du texte XML et remplacement des potentiels points par des virgules
    const valuesToExtract = ['date_etablissement_dpe', 'classe_bilan_dpe',	'ep_conso_5_usages_m2',	'conso_5_usages_m2',	'classe_emission_ges',	'emission_ges_5_usages_m2'].map(value => searchVal(texteXML, value).replace('.',','));

    //Ajout de l'information du DPE immeuble ou non
    texteXML.indexOf('<dpe_immeuble_associe>') !== -1 ? valuesToExtract.splice(0, 0, 'OUI') : valuesToExtract.splice(0, 0, 'NON');

    //Ajout du lien vers le fichier PDF
    valuesToExtract.splice(0, 0, dpePDF.getUrl());

    //Création de la requete
    var request = constructeurRequete(sheetDonneesPatrimoine.getSheetId(), ligneCodeUG, spreadsheet.getRangeByName('LIEN_DPE').getColumn(), valuesToExtract)

    return request
  }

  /** Construit la requête de mise à jour des données */
  function constructeurRequete(sheetId, indexRow, indexCol, valeurs) {

    var request = {
      "updateCells": {
        "rows": [
          {
            "values": [
              {"userEnteredValue": {"formulaValue": '=LIEN_HYPERTEXTE("' + valeurs[0] + '"; "PDF")'}},
              {"userEnteredValue": {"stringValue": valeurs[1]}},
              {"userEnteredValue": {"stringValue": valeurs[2]}},
              {"userEnteredValue": {"stringValue": valeurs[3]}},
              {"userEnteredValue": {"stringValue": valeurs[4]}},
              {"userEnteredValue": {"stringValue": valeurs[5]}},
              {"userEnteredValue": {"stringValue": valeurs[6]}},
              {"userEnteredValue": {"stringValue": valeurs[7]}}
            ]
          }
        ],
        "fields": "userEnteredValue, userEnteredFormat.numberFormat.type, userEnteredFormat.numberFormat.pattern",
        "range": {
          "sheetId": sheetId,
          "startRowIndex": indexRow - 1,
          "endRowIndex": indexRow,
          "startColumnIndex": indexCol - 1,
          "endColumnIndex": indexCol + valeurs.length - 1
        }
      }
    };

    return request;
  }

  /** Fonction qui recherche le code UG dans l'array et renvoie sa position */
  function searchCodeUG (codeUG) {
    return listeCodeUG.indexOf(codeUG) + 1;
  }
}
