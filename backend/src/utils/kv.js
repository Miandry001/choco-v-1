/** Objet {champ: valeur} <-> tableau [{k, v}] (indexable par un seul index multikey sur currentData.k / currentData.v). */
export const toKV = (obj) => Object.entries(obj).map(([k, v]) => ({ k, v }));
export const fromKV = (arr = []) => Object.fromEntries(arr.map(({ k, v }) => [k, v]));
