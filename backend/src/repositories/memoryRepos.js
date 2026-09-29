/**
 * Dépôts en mémoire : mêmes méthodes que les dépôts MongoDB (à venir).
 * Servent aux tests unitaires de la logique métier, sans base de données.
 */
export function createMemoryRepos() {
  const db = { treatments: [], versions: [], audits: [], validations: [], idem: new Map() };
  let seq = 0;
  const id = () => `mem_${++seq}`;
  const clone = (o) => (o ? structuredClone(o) : o);
  return {
    _db: db,
    async withTransaction(fn) {
      const snapshot = structuredClone({ ...db, idem: [...db.idem] });
      try { return await fn(); }
      catch (e) { // rollback
        Object.assign(db, { treatments: snapshot.treatments, versions: snapshot.versions, audits: snapshot.audits,
          validations: snapshot.validations, idem: new Map(snapshot.idem) });
        throw e;
      }
    },
    treatments: {
      async findByRow(sourceRow) { return clone(db.treatments.find((t) => t.sourceRow === sourceRow)); },
      async insert(doc) { const d = { ...clone(doc), _id: id() }; db.treatments.push(d); return clone(d); },
      async update(_id, patch) { Object.assign(db.treatments.find((t) => t._id === _id), clone(patch)); },
    },
    versions: { async insert(doc) { db.versions.push({ ...clone(doc), _id: id() }); } },
    audits: { async insertMany(docs) { docs.forEach((d) => db.audits.push({ ...clone(d), _id: id() })); } },
    validations: { async insert(doc) { db.validations.push({ ...clone(doc), _id: id() }); } },
    idempotency: {
      async get(key) { return clone(db.idem.get(key)); },
      async set(key, result) { db.idem.set(key, clone(result)); },
    },
  };
}
