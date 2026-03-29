export function Checkbox({ id, label, ...props }) {
  return (
    <label className="ui-checkbox" htmlFor={id}>
      <input id={id} type="checkbox" {...props} />
      <span>{label}</span>
    </label>
  )
}
