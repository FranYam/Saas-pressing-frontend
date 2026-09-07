import { forwardRef, type InputHTMLAttributes, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react';
import { AlertCircle, Calendar, ChevronDown } from 'lucide-react';
import { formatPhoneInput } from '@/lib/format';

// ─── Champ texte avec label + erreur ─────────────────────────────────────────

interface FieldWrapperProps {
  label: string;
  error?: string;
  hint?: string;
  required?: boolean;
  id: string;
  children: React.ReactNode;
}

export function FieldWrapper({ label, error, hint, required, id, children }: FieldWrapperProps) {
  return (
    <div>
      <label htmlFor={id} className="label-base">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
      {hint && !error && <p className="mt-1.5 text-xs text-slate-400">{hint}</p>}
      {error && (
        <p className="mt-1.5 flex items-center gap-1 text-xs text-red-500" role="alert">
          <AlertCircle size={12} aria-hidden="true" />
          {error}
        </p>
      )}
    </div>
  );
}

interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  hint?: string;
}

export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(({ label, error, hint, id, ...props }, ref) => {
  const fieldId = id ?? props.name ?? label.toLowerCase().replace(/\s+/g, '-');
  return (
    <FieldWrapper label={label} error={error} hint={hint} required={props.required} id={fieldId}>
      <input ref={ref} id={fieldId} className="input-base" aria-invalid={!!error} {...props} />
    </FieldWrapper>
  );
});
TextField.displayName = 'TextField';

// ─── Zone de texte ───────────────────────────────────────────────────────────

interface TextAreaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  error?: string;
}

export const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(({ label, error, id, ...props }, ref) => {
  const fieldId = id ?? props.name ?? label.toLowerCase().replace(/\s+/g, '-');
  return (
    <FieldWrapper label={label} error={error} required={props.required} id={fieldId}>
      <textarea ref={ref} id={fieldId} rows={props.rows ?? 3} className="input-base resize-none" aria-invalid={!!error} {...props} />
    </FieldWrapper>
  );
});
TextArea.displayName = 'TextArea';

// ─── Sélecteur ───────────────────────────────────────────────────────────────

interface SelectFieldProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  error?: string;
  options: { value: string; label: string }[];
  placeholder?: string;
}

export const SelectField = forwardRef<HTMLSelectElement, SelectFieldProps>(
  ({ label, error, options, placeholder, id, ...props }, ref) => {
    const fieldId = id ?? props.name ?? label.toLowerCase().replace(/\s+/g, '-');
    return (
      <FieldWrapper label={label} error={error} required={props.required} id={fieldId}>
        <div className="relative">
          <select ref={ref} id={fieldId} className="input-base appearance-none pr-9" aria-invalid={!!error} {...props}>
            {placeholder && <option value="">{placeholder}</option>}
            {options.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <ChevronDown
            size={16}
            className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-slate-400"
            aria-hidden="true"
          />
        </div>
      </FieldWrapper>
    );
  }
);
SelectField.displayName = 'SelectField';

// ─── Téléphone burkinabè (+226) ──────────────────────────────────────────────

interface PhoneInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
  label: string;
  error?: string;
  value: string;
  onValueChange: (value: string) => void;
}

export function PhoneInput({ label, error, value, onValueChange, id, ...props }: PhoneInputProps) {
  const fieldId = id ?? 'phone';
  return (
    <FieldWrapper label={label} error={error} hint="Format : +226 7X XX XX XX" required={props.required} id={fieldId}>
      <input
        id={fieldId}
        type="tel"
        inputMode="tel"
        className="input-base"
        placeholder="+226 70 00 00 00"
        value={value}
        onChange={(e) => onValueChange(formatPhoneInput(e.target.value))}
        aria-invalid={!!error}
        {...props}
      />
    </FieldWrapper>
  );
}

// ─── Date ────────────────────────────────────────────────────────────────────

interface DatePickerProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export const DatePicker = forwardRef<HTMLInputElement, DatePickerProps>(({ label, error, id, ...props }, ref) => {
  const fieldId = id ?? props.name ?? label.toLowerCase().replace(/\s+/g, '-');
  return (
    <FieldWrapper label={label} error={error} required={props.required} id={fieldId}>
      <div className="relative">
        <input ref={ref} id={fieldId} type="date" className="input-base pr-10" aria-invalid={!!error} {...props} />
        <Calendar size={16} className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-slate-400" aria-hidden="true" />
      </div>
    </FieldWrapper>
  );
});
DatePicker.displayName = 'DatePicker';
