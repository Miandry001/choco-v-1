import { Section } from "./components/ui";
import { SaisieForm } from "./components/SaisieForm.jsx";
import { SourceTable } from "./components/SourceTable.jsx";

export default function App() {
  return (
    <div className="wrap">
      <h1 className="page-title">Saisie Confiserie</h1>
      <div className="layout">
        <Section title="Données source — lecture seule" sticky>
          <SourceTable />
        </Section>
        <Section title="Saisie">
          <SaisieForm onSubmit={(values) => console.log(values)} />
        </Section>
      </div>
    </div>
  );
}
