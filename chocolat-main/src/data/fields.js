export const FIELDS = [
  "NOM", "retours Hélène & Nathalie", "COMMENTAIRE", "CODIFICATION AVEC PHOTO oui/non",
  "Major Brand", "BRAND", "NEW NOM DE SPECIALITE", "Label", "Bonus1", "Bonus2", "Bonus3", "Bonus4",
  "Type De Produit", "Emballage", "INFO PARFUM", "Additifs", "INFO FOURRAGE",
  "Type De Confiserie", "Type De Confiserie REMARQUE", "Type De Confiserie CORRIGE",
  "TYPE DE SPECIALITE", "TYPE DE SPECIALITE REMARQUES", "TYPE DE SPECIALITE CORRIGE",
  "TYPE DE SUBSTITUT", "PRESENTATION", "INFO GARNITURE", "INFO DRAGEIFIE", "INFO CREUX/PLEIN", "INFO ATTACHE",
  "Libelle Produit", "Info Saison", "Info HALLOWEEN", "Info Noel", "Info Paques", "INFO AUTOMNE",
  "INFO SAINT VALENTIN", "INFO FETE DES MERES", "Info Forme Noel", "Info Forme Pâques", "Info Forme Permanent",
  "Info Forme Halloween", "INFO FORME AUTOMNE", "INFO FORME ST VALENTIN", "INFO FORME FETE DES MERES",
  "Info Sante Nature", "Extras", "Ethnique Info", "Informations Bilgcls", "Info Ecologique",
  "Info Commerce Equtbl", "Info Label", "Info Promotion", "Onces Totales", "Compte Total", "Compte Total De Paqt",
];

export const READONLY = [
  ["NOM KC", "Code catégorie client"],
  ["KEYCAT", "Catégorie clé produit"],
  ["UPC", "Identifiant code article d'origine"],
  ["State", "État de la ligne dans le système client"],
  ["System", "Métadonnée système d'origine"],
  ["Generation", "Version du flux client"],
  ["Vendor", "Nom du fournisseur"],
  ["Item", "Référence article fournisseur"],
  ["CONCATENER", ""],
  ["EAN13", "Code-barres standard à 13 chiffres"],
  ["WAD", ""],
  ["WLM", ""],
  ["Times Moved", "Nombre de déplacements"],
  ["Last Updt Date", "Date de dernière mise à jour"],
  ["Last Updt User", "Utilisateur de la dernière mise à jour"],
  ["Addi Attr Flag", "Indicateur d'attributs additionnels"],
  ["Company", "Société"],
  ["Localisation", "Emplacement en étagère (automatique)"],
];

const AREA = ["retours Hélène & Nathalie", "COMMENTAIRE"];
const NUM = ["Onces Totales", "Compte Total", "Compte Total De Paqt"];
const YESNO = ["CODIFICATION AVEC PHOTO oui/non"];

/** Type de contrôle à afficher pour un champ. */
export function fieldType(name) {
  if (AREA.includes(name)) return "textarea";
  if (YESNO.includes(name)) return "yesno";
  if (NUM.includes(name)) return "number";
  return "text";
}

export function isWide(name) {
  return AREA.includes(name) || name === "NOM";
}

export const fieldId = (s) =>
  "f-" + s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-");

export const emptyValues = () => Object.fromEntries(FIELDS.map((k) => [k, ""]));
