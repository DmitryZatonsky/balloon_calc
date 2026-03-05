import type { Dispatch, SetStateAction } from "react";
import type { SavedCalculation } from "../types";
import { formatMoney } from "../utils";

type Props = {
  sortedArchive: SavedCalculation[];
  expandedArchiveId: string | null;
  setExpandedArchiveId: Dispatch<SetStateAction<string | null>>;
  handleEditCalculation: (record: SavedCalculation) => void;
  handleDeleteCalculation: (id: string) => void;
  renderHeader: (title: string) => React.ReactNode;
};

export function ArchiveScreen({
  sortedArchive,
  expandedArchiveId,
  setExpandedArchiveId,
  handleEditCalculation,
  handleDeleteCalculation,
  renderHeader,
}: Props) {
  return (
    <section className="screen archive">
      {renderHeader("Архив")}

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
                    <span>{formatMoney(record.total)}</span>
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
                        handleDeleteCalculation(record.id);
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
                          <strong>{formatMoney(line.lineTotal)}</strong>
                        </span>
                      </li>
                    ))}
                  </ul>

                  <div className="total-row">
                    <span>Всего</span>
                    <strong>{formatMoney(record.total)}</strong>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
