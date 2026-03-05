import { useRef, useState } from "react";
import type { ChangeEvent } from "react";
import type { Dispatch, SetStateAction } from "react";
import type { SavedCalculation } from "../types";
import { formatMoney } from "../utils";

type Props = {
  sortedArchive: SavedCalculation[];
  expandedArchiveId: string | null;
  setExpandedArchiveId: Dispatch<SetStateAction<string | null>>;
  currencyAbbr: string;
  handleEditCalculation: (record: SavedCalculation) => void;
  handleDeleteCalculation: (id: string) => void;
  handleExportArchive: () => void;
  handleImportArchiveFile: (file: File) => Promise<void>;
  archiveMessage: string;
  renderHeader: (title: string) => React.ReactNode;
};

export function ArchiveScreen({
  sortedArchive,
  expandedArchiveId,
  setExpandedArchiveId,
  currencyAbbr,
  handleEditCalculation,
  handleDeleteCalculation,
  handleExportArchive,
  handleImportArchiveFile,
  archiveMessage,
  renderHeader,
}: Props) {
  const [pendingDelete, setPendingDelete] = useState<{ id: string; label: string } | null>(null);
  const [isImporting, setIsImporting] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  function confirmDelete(): void {
    if (!pendingDelete) {
      return;
    }
    handleDeleteCalculation(pendingDelete.id);
    setPendingDelete(null);
  }

  async function onImportFileChange(event: ChangeEvent<HTMLInputElement>): Promise<void> {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) {
      return;
    }
    setIsImporting(true);
    await handleImportArchiveFile(file);
    setIsImporting(false);
  }

  return (
    <>
      <section className="screen archive">
        {renderHeader("Архив")}
        <div className="archive-tools">
          <button className="ui-btn ui-btn--ghost archive-tool-btn" onClick={handleExportArchive}>
            Экспорт
          </button>
          <button
            className="ui-btn ui-btn--ghost archive-tool-btn"
            onClick={() => fileInputRef.current?.click()}
            disabled={isImporting}
          >
            {isImporting ? "Загрузка..." : "Восстановить"}
          </button>
          <input
            ref={fileInputRef}
            className="archive-file-input"
            type="file"
            accept="application/json,.json"
            onChange={(event) => {
              void onImportFileChange(event);
            }}
          />
        </div>
        {archiveMessage && <p className="status">{archiveMessage}</p>}

        {sortedArchive.length === 0 ? (
          <p className="empty">Пока нет сохраненных расчетов.</p>
        ) : (
          <div className="archive-list">
            {sortedArchive.map((record) => {
              const isExpanded = expandedArchiveId === record.id;

              return (
                <article
                  key={record.id}
                  className={`archive-card ${isExpanded ? "is-expanded" : ""}`}
                  onClick={() => setExpandedArchiveId((prev) => (prev === record.id ? null : record.id))}
                >
                  <div className="archive-top">
                    <div className="archive-meta">
                      <strong>{new Date(record.createdAt).toLocaleString("ru-RU")}</strong>
                      <span>{formatMoney(record.total, currencyAbbr)}</span>
                    </div>

                    <div className="archive-actions">
                      <button
                        className="ui-icon-btn icon-action-btn"
                        aria-label="Редактировать расчет"
                        title="Редактировать"
                        onClick={(event) => {
                          event.stopPropagation();
                          handleEditCalculation(record);
                        }}
                      >
                        <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true">
                          <path
                            d="M4 20h4l10-10-4-4L4 16v4zM13 7l4 4"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.8"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </button>

                      <button
                        className="ui-icon-btn icon-action-btn danger"
                        aria-label="Удалить расчет"
                        title="Удалить"
                        onClick={(event) => {
                          event.stopPropagation();
                          setPendingDelete({
                            id: record.id,
                            label: new Date(record.createdAt).toLocaleString("ru-RU"),
                          });
                        }}
                      >
                        <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true">
                          <path
                            d="M7 7l10 10M17 7L7 17"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>

                  <div className={`archive-details ${isExpanded ? "is-open" : ""}`} aria-hidden={!isExpanded}>
                    <ul>
                      {record.lines.map((line, index) => (
                        <li key={`${record.id}-${line.productName}-${index}`}>
                          <span className="line-label">
                            <span>{line.productName}</span>
                            <span className="line-category">{line.categoryName}</span>
                          </span>
                          <span className="line-meta">
                            <span className="line-qty">x {line.quantity}</span>
                            <strong>{formatMoney(line.lineTotal, currencyAbbr)}</strong>
                          </span>
                        </li>
                      ))}
                    </ul>

                    <div className="total-row">
                      <span>Всего</span>
                      <strong>{formatMoney(record.total, currencyAbbr)}</strong>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {pendingDelete && (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="modal-card">
            <h3>Удалить расчет?</h3>
            <p>Запись от «{pendingDelete.label}» будет удалена из архива.</p>
            <div className="modal-actions">
              <button className="ui-btn ui-btn--ghost" onClick={() => setPendingDelete(null)}>
                Отмена
              </button>
              <button className="ui-btn ui-btn--primary" onClick={confirmDelete}>
                Удалить
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
