function searchVal(textDPE, searchValue) {
  var result = "";
  var erreur = false
  //Cas d'une valeur unique : Recherche directement dans la chaine de caractère
  if (searchValue.indexOf('/') == -1) {
    var searchString = textDPE.slice(textDPE.indexOf(searchValue));
    result = searchString.substring(searchString.indexOf('>') + 1, searchString.indexOf('<')).replace('>', '').replace(/\n|\r/g,'');
    return result;    

  //Nécéssité d'un chemin d'accès
  } else {
    try {
      //Vérification du prologue
      if (textDPE.slice(0, 1) != "<") {
        textDPE = textDPE.slice(1);
      }
      var root = XmlService.parse(textDPE).getRootElement();
      var path = searchValue.split("/");
      var pathing = root

      for (i = 0; i < path.length; i++){
        if (pathing != null){
          pathing = pathing.getChild(path[i]);
        } else {
          erreur = true
          break;
        }
      }

      if (erreur == true || pathing == null){
        throw new Error ("Le chemin d'accès spécifié n'est pas valide.");
      } else {
        result = pathing.getValue().replace(/\n|\r/g,'');
        return result;
      }
    } catch (e) {
      throw new Error (e);
    }
  }
}
