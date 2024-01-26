function classement_Mail() {
  //RECUPERATION DES MESSAGE NON LUS
  const threads = GmailApp.search('is:unread');
  const msgs = GmailApp.getMessagesForThreads(threads);
  var label = '';
  Logger.log(label)

  for (var i = 0 ; i < msgs.length; i++) { //Boucle sur l'ensemble des messages
    for (var j = 0; j < msgs[i].length; j++) {
      var attachments = msgs[i][j].getAttachments();
      for (var k = 0; k < attachments.length; k++) {
        
        let piece_jointe = attachments[k]; //Récupération pièce jointe
        let pj_Name = piece_jointe.getName();
        let type = attributionLibelle(pj_Name);
        let thread = msgs[i][j].getThread();

        if (type) {
          label = GmailApp
            .getUserLabelByName('DIAGNOSTICS/' + type)
            .addToThread(thread)
          ;
        }

        if (type !== 'DIAGS THERMIQUE') {
          thread.markRead();
        }

        Logger.log(pj_Name + ' : ' + type);
      }
    }
  }
}

function attributionLibelle (pj_Name) {
  const regex_DPE = new RegExp(/([0-9](\.[0-9]+)+) D /i); //1.7017.400.004.0001 D 0422 D
  const regex_ELEC = new RegExp(/([0-9](\.[0-9]+)+) E /i); //1.9135.002.008.0093 E 1222 DN
  const regex_GAZ = new RegExp(/([0-9](\.[0-9]+)+) G /i); //1.9135.002.008.0093 E 1222 DN
  const regex_AMIANTE = new RegExp(/([0-9](\.[0-9]+)+) (DA[A-Z]+|PLAN|DTA) /i); //1.9141.001.001.0007 DAPP 1222 OK
  const regex_PLOMB = new RegExp(/([0-9](\.[0-9]+)+) (CERP|DPAD|DPAT) /i); //1.9141.001.001.0007 PLAN 1222 OK
  const regex_POLLUTION = new RegExp(/([0-9](\.[0-9]+)+) ERP /i); //1.9141.001.001.0007 PLAN 1222 OK
  const regex_DECHET = new RegExp(/([0-9](\.[0-9]+)+) DDAT /i); //1.9141.001.001.0007 PLAN 1222 OK

  var type = '';

  switch (true) {
    case regex_DPE.test(pj_Name):
      type = 'DIAGS THERMIQUE';
      break;

    case regex_ELEC.test(pj_Name):
      type = 'DIAGS ÉLECTRICITÉ';
      break;

    case regex_AMIANTE.test(pj_Name):
      type = 'DIAGS AMIANTE';
      break;

    case regex_POLLUTION.test(pj_Name):
      type = 'DIAGS POLLUTION';
      break;

    case regex_PLOMB.test(pj_Name):
      type = 'DIAGS PLOMB';
      break;

    case regex_GAZ.test(pj_Name):
      type = 'DIAGS GAZ';
      break;

    case regex_DECHET.test(pj_Name):
      type = 'DIAGS DÉCHET';
      break;

    default:
      type = undefined;
  }

  return type;
}
