import type { Screen } from "../types";

type Props = {
  setScreen: (screen: Screen) => void;
};

export function HomeScreen({ setScreen }: Props) {
  return (
    <section className="screen home">
      <div className="hero-panel">
        <h1>Калькулятор надувателя</h1>
        <p className="subtitle">Для расчета заказа шариков.</p>
      </div>

      <div className="menu-grid">
        <button className="menu-card menu-card--lavender" onClick={() => setScreen("calc")}>
          <div className="menu-card__head">
            <span className="menu-card__icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" width="16" height="16">
                <path
                  d="M5 4h14v16H5zM8 8h8M8 12h5M8 16h8"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
            <div className="menu-card__text">
              <span className="menu-card__title">Рассчитать стоимость</span>
              <span className="menu-card__desc">Подсчет количества и общей суммы</span>
            </div>
          </div>
        </button>

        <button className="menu-card menu-card--sand" onClick={() => setScreen("archive")}>
          <div className="menu-card__head">
            <span className="menu-card__icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" width="16" height="16">
                <path
                  d="M4 7h16v13H4zM8 4h8M9 11h6M9 15h6"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
            <div className="menu-card__text">
              <span className="menu-card__title">Архив</span>
              <span className="menu-card__desc">Сохраненные расчеты на устройстве</span>
            </div>
          </div>
        </button>

        <button className="menu-card menu-card--mint" onClick={() => setScreen("add")}>
          <div className="menu-card__head">
            <span className="menu-card__icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" width="16" height="16">
                <path
                  d="M12 5v14M5 12h14"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.9"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
            <div className="menu-card__text">
              <span className="menu-card__title">Добавить наименование</span>
              <span className="menu-card__desc">Новая категория и товары</span>
            </div>
          </div>
        </button>

        <button className="menu-card menu-card--mint" onClick={() => setScreen("price")}>
          <div className="menu-card__head">
            <span className="menu-card__icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" width="16" height="16">
                <path
                  d="M11 4l8 8-7 7-8-8V4zM14.5 8.5h.01"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
            <div className="menu-card__text">
              <span className="menu-card__title">Управление прайсом</span>
              <span className="menu-card__desc">Изменение цен и удаление позиций</span>
            </div>
          </div>
        </button>
      </div>

      <p className="small-note">Сохранения хранятся локально на этом устройстве.</p>
    </section>
  );
}
