/** options : tableau de chaînes ou de { value, label } */
export function Select({ options = [], className = "", ...props }) {
  return (
    <select className={`control ${className}`.trim()} {...props}>
      {options.map((o) => {
        const { value, label } = typeof o === "string" ? { value: o, label: o } : o;
        return (
          <option key={value} value={value}>
            {label}
          </option>
        );
      })}
    </select>
  );
}
