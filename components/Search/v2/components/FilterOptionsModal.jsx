import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";

export default function FilterOptionsModal({
  open,
  title,
  subtitle,
  options,
  selectedValues,
  onClose,
  onApply,
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [tempSelected, setTempSelected] = useState([]);

  useEffect(() => {
    if (open) {
      setTempSelected(Array.isArray(selectedValues) ? [...selectedValues] : []);
      setSearchTerm("");
    }
  }, [open, selectedValues]);

  useEffect(() => {
    if (!open) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === "Escape") onClose();
    };

    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  const filteredOptions = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) return options || [];
    return (options || []).filter((option) =>
      String(option?.label || "").toLowerCase().includes(query)
    );
  }, [options, searchTerm]);

  const groupedOptions = useMemo(() => {
    const groups = {};

    filteredOptions.forEach((option) => {
      const firstChar = String(option?.label || "").trim().charAt(0).toUpperCase();
      const key = /^[A-Z]$/.test(firstChar) ? firstChar : "#";
      if (!groups[key]) groups[key] = [];
      groups[key].push(option);
    });

    return Object.keys(groups)
      .sort((a, b) => {
        if (a === "#") return -1;
        if (b === "#") return 1;
        return a.localeCompare(b);
      })
      .map((letter) => ({
        letter,
        items: groups[letter].sort((a, b) =>
          String(a.label || "").localeCompare(String(b.label || ""))
        ),
      }));
  }, [filteredOptions]);

  const toggleOption = (value) => {
    setTempSelected((current) =>
      current.includes(value)
        ? current.filter((item) => item !== value)
        : [...current, value]
    );
  };

  const handleApply = () => {
    onApply(tempSelected);
    onClose();
  };

  if (!open) return null;
  if (typeof window === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/45" onClick={onClose} />

      <div className="relative z-10 flex min-h-full items-center justify-center p-4">
        <section
          role="dialog"
          aria-modal="true"
          className="flex max-h-[86vh] w-full max-w-[860px] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_24px_70px_rgba(15,23,42,0.28)]"
          onClick={(event) => event.stopPropagation()}
        >
          <header className="shrink-0 border-b border-slate-200 bg-white px-6 py-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-3">
                  <h2 className="text-2xl font-semibold tracking-tight text-slate-950">
                    {title}
                  </h2>

                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                    {options.length} options
                  </span>
                </div>

                {subtitle && (
                  <p className="mt-1 text-sm text-slate-500">
                    {subtitle}
                  </p>
                )}
              </div>

              <button
                type="button"
                aria-label="Close"
                onClick={onClose}
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-950"
              >
                ×
              </button>
            </div>

            <div className="relative mt-4">
              <input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search options..."
                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
              />
            </div>
          </header>

          <main className="relative min-h-0 flex-1 overflow-y-auto bg-slate-50 px-6 py-5">
            {filteredOptions.length === 0 ? (
              <div className="flex h-[320px] flex-col items-center justify-center text-center">
                <h3 className="text-sm font-semibold text-slate-900">
                  No options found
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  Try another search term.
                </p>
              </div>
            ) : (
              <div className="mx-auto max-w-[680px] space-y-4">
                {groupedOptions.map((group) => (
                  <section
                    key={group.letter}
                    id={`filter-option-section-${group.letter}`}
                    className="overflow-hidden rounded-xl border border-slate-200 bg-white"
                  >
                    <div className="sticky top-0 z-10 flex h-8 items-center border-b border-slate-100 bg-slate-100 px-4 text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">
                      {group.letter}
                    </div>

                    <div className="divide-y divide-slate-100">
                      {group.items.map((option) => {
                        const checked = tempSelected.includes(option.value);
                        return (
                          <label
                            key={option.value}
                            className={`flex h-10 cursor-pointer items-center justify-between gap-4 px-4 text-sm transition ${
                              checked
                                ? "bg-blue-50 text-slate-950"
                                : "bg-white text-slate-700 hover:bg-slate-50"
                            }`}
                          >
                            <span className="flex min-w-0 items-center gap-3">
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={() => toggleOption(option.value)}
                                className="h-4 w-4 rounded border-slate-300 text-slate-950 focus:ring-2 focus:ring-slate-300"
                              />

                              <span
                                className={`truncate ${
                                  checked
                                    ? "font-semibold text-slate-950"
                                    : "font-medium text-slate-700"
                                }`}
                              >
                                {option.label}
                              </span>
                            </span>

                            {typeof option.count === "number" && (
                              <span className="shrink-0 text-xs tabular-nums text-slate-400">
                                {option.count}
                              </span>
                            )}
                          </label>
                        );
                      })}
                    </div>
                  </section>
                ))}
              </div>
            )}

            <nav className="absolute right-3 top-5 hidden flex-col gap-1 rounded-full border border-slate-200 bg-white px-1 py-2 shadow-sm lg:flex">
              {groupedOptions.map((group) => (
                <button
                  key={group.letter}
                  type="button"
                  onClick={() => {
                    document
                      .getElementById(`filter-option-section-${group.letter}`)
                      ?.scrollIntoView({ behavior: "smooth", block: "start" });
                  }}
                  className="flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold text-slate-500 hover:bg-slate-950 hover:text-white"
                >
                  {group.letter}
                </button>
              ))}
            </nav>
          </main>

          <footer className="shrink-0 border-t border-slate-200 bg-white px-6 py-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={() => setTempSelected([])}
                  className="text-sm font-semibold text-slate-500 hover:text-slate-950"
                >
                  Clear selected
                </button>

                <span className="text-sm text-slate-500">
                  {tempSelected.length} selected
                </span>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="h-10 rounded-xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleApply}
                  className="h-10 rounded-xl bg-slate-950 px-6 text-sm font-semibold text-white hover:bg-black active:scale-[0.98]"
                >
                  {tempSelected.length > 0
                    ? `Apply ${tempSelected.length}`
                    : "Apply"}
                </button>
              </div>
            </div>
          </footer>
        </section>
      </div>
    </div>,
    document.body
  );
}
