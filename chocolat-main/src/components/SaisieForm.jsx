import { useState } from "react";
import { Button, Field, Select, TextArea, TextInput } from "./ui";
import { FIELDS, emptyValues, fieldId, fieldType, isWide } from "../data/fields.js";
import { formatValue, getRules, validate, validateAll } from "../data/rules.js";

const YESNO_OPTIONS = ["", "OUI", "NON"];

function FieldControl({ name, id, value, error, onChange, onBlur }) {
  const common = {
    id,
    name,
    value,
    required: getRules(name).required,
    "aria-invalid": error ? true : undefined,
    "aria-describedby": error ? `${id}-error` : undefined,
    onChange: (e) => onChange(name, e.target.value),
    onBlur: () => onBlur(name),
  };
  switch (fieldType(name)) {
    case "textarea":
      return <TextArea {...common} />;
    case "yesno":
      return <Select options={YESNO_OPTIONS} {...common} />;
    case "number":
      return <TextInput inputMode="decimal" {...common} />;
    default:
      return <TextInput {...common} />;
  }
}

export function SaisieForm({ onSubmit }) {
  const [values, setValues] = useState(emptyValues);
  const [errors, setErrors] = useState({});

  const setError = (name, error) =>
    setErrors(({ [name]: _, ...rest }) => (error ? { ...rest, [name]: error } : rest));

  const handleChange = (name, raw) => {
    const value = formatValue(raw);
    setValues((v) => ({ ...v, [name]: value }));
    // Un champ déjà en erreur est revalidé à chaque frappe pour que le message disparaisse dès qu'il est corrigé.
    if (errors[name]) setError(name, validate(value, getRules(name)));
  };

  const handleBlur = (name) => setError(name, validate(values[name], getRules(name)));

  const handleSubmit = (e) => {
    e.preventDefault();
    const found = validateAll(values);
    setErrors(found);
    const first = FIELDS.find((name) => found[name]);
    if (first) {
      document.getElementById(fieldId(first))?.focus();
      return;
    }
    onSubmit?.(Object.fromEntries(Object.entries(values).map(([k, v]) => [k, formatValue(v.trim())])));
  };

  const handleReset = (e) => {
    e.preventDefault();
    setValues(emptyValues());
    setErrors({});
  };

  return (
    <form className="form-grid" autoComplete="off" noValidate onSubmit={handleSubmit} onReset={handleReset}>
      {FIELDS.map((name) => {
        const id = fieldId(name);
        return (
          <Field key={name} id={id} label={name} wide={isWide(name)} required={getRules(name).required} error={errors[name]}>
            <FieldControl
              name={name}
              id={id}
              value={values[name]}
              error={errors[name]}
              onChange={handleChange}
              onBlur={handleBlur}
            />
          </Field>
        );
      })}
      <div className="form-actions">
        <Button type="reset">Effacer</Button>
        <Button type="submit" variant="primary">Valider</Button>
      </div>
    </form>
  );
}
